import { execSync, spawn, ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SERVER_PATH = 'dist/src/server/main.js';

if (!existsSync(SERVER_PATH)) {
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
}

interface Pending {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
}

class McpClientProcess {
  private readonly child: ChildProcess;
  private readonly pending = new Map<number, Pending>();
  private nextId = 0;

  constructor() {
    this.child = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = createInterface({ input: this.child.stdout });
    lines.on('line', (line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        return;
      }
      const message = JSON.parse(trimmed) as { id?: unknown };
      if (typeof message.id === 'number') {
        const entry = this.pending.get(message.id);
        if (entry) {
          this.pending.delete(message.id);
          entry.resolve(message as Record<string, unknown>);
        }
      }
    });
  }

  request(method: string, params?: unknown): Promise<Record<string, unknown>> {
    const id = ++this.nextId;
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Timed out waiting for response to ' + method));
      }, 15000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject
      });
      this.child.stdin?.write(
        JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'
      );
    });
  }

  notify(method: string): void {
    this.child.stdin?.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n');
  }

  sendRaw(payload: string): void {
    this.child.stdin?.write(payload + '\n');
  }

  kill(): void {
    this.child.kill();
  }
}

describe('mcp e2e: client over stdio', () => {
  let client: McpClientProcess;

  beforeAll(() => {
    client = new McpClientProcess();
  }, 30000);

  afterAll(() => {
    client.kill();
  });

  it('completes initialize and lists tools', async () => {
    const init = await client.request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '0.0.0' }
    });
    expect(init.error).toBeUndefined();
    const initResult = init.result as { serverInfo: { name: string } };
    expect(initResult.serverInfo.name).toBe('diagrameditor');

    client.notify('notifications/initialized');

    const list = await client.request('tools/list', {});
    const tools = (list.result as { tools: Array<{ name: string }> }).tools;
    expect(tools.map((tool) => tool.name)).toEqual([
      'create_diagram',
      'add_node',
      'add_edge',
      'validate_diagram',
      'export_json',
      'import_json'
    ]);
  });

  it('supports the core editor flow through tool calls', async () => {
    await client.request('tools/call', { name: 'create_diagram', arguments: {} });
    await client.request('tools/call', {
      name: 'add_node',
      arguments: { id: 'n-start', label: 'Start' }
    });
    await client.request('tools/call', {
      name: 'add_node',
      arguments: { id: 'n-end', label: 'End' }
    });
    await client.request('tools/call', {
      name: 'add_edge',
      arguments: { id: 'e-main', from: 'n-start', to: 'n-end' }
    });
    const exported = await client.request('tools/call', {
      name: 'export_json',
      arguments: {}
    });
    const content = (exported.result as {
      content: Array<{ type: string; text: string }>;
    }).content;
    const diagram = JSON.parse(content[0].text) as {
      nodes: Array<{ id: string }>;
      edges: unknown[];
    };
    expect(diagram.nodes.map((node) => node.id)).toEqual(['n-start', 'n-end']);
    expect(diagram.edges).toHaveLength(1);
  });

  it('recovers from malformed input lines and keeps serving', async () => {
    client.sendRaw('this is not json');
    const pong = await client.request('ping', {});
    expect(pong.result).toEqual({});
  });
});
