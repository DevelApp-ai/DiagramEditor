import { describe, expect, it } from 'vitest';
import {
  INVALID_PARAMS,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  PROTOCOL_VERSION,
  SERVER_NAME,
  createMcpServer
} from '../../src/mcp/server.js';

interface RpcMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: unknown;
}

const request = (id: number | string, method: string, params?: unknown): RpcMessage => ({
  jsonrpc: '2.0',
  id,
  method,
  params
});

const notification = (method: string): RpcMessage => ({ jsonrpc: '2.0', method });

describe('mcp protocol', () => {
  it('completes the initialize handshake', async () => {
    const server = createMcpServer();
    const response = await server.handleMessage(
      request(1, 'initialize', {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'test-client', version: '0.0.0' }
      })
    );
    expect(response).not.toBeNull();
    expect(response?.id).toBe(1);
    expect(response?.error).toBeUndefined();
    const result = response?.result as {
      protocolVersion: string;
      capabilities: { tools: unknown };
      serverInfo: { name: string; version: string };
    };
    expect(result.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(result.capabilities.tools).toBeDefined();
    expect(result.serverInfo.name).toBe(SERVER_NAME);
    expect(typeof result.serverInfo.version).toBe('string');
  });

  it('falls back to the default protocol version for unsupported requests', async () => {
    const server = createMcpServer();
    const response = await server.handleMessage(
      request('abc-1', 'initialize', { protocolVersion: '1999-01-01' })
    );
    expect(response?.id).toBe('abc-1');
    const result = response?.result as { protocolVersion: string };
    expect(result.protocolVersion).toBe(PROTOCOL_VERSION);
  });

  it('responds to ping', async () => {
    const server = createMcpServer();
    const response = await server.handleMessage(request(2, 'ping'));
    expect(response?.id).toBe(2);
    expect(response?.result).toEqual({});
  });

  it('ignores notifications, known and unknown', async () => {
    const server = createMcpServer();
    expect(await server.handleMessage(notification('notifications/initialized'))).toBeNull();
    expect(await server.handleMessage(notification('some/unknown'))).toBeNull();
  });

  it('rejects invalid requests with -32600', async () => {
    const server = createMcpServer();
    expect(await server.handleMessage([1, 2, 3])).toEqual({
      jsonrpc: '2.0',
      id: null,
      error: { code: INVALID_REQUEST, message: 'Invalid Request' }
    });
    expect(await server.handleMessage({ jsonrpc: '1.0', id: 5, method: 'ping' }))
      .toMatchObject({ id: 5, error: { code: INVALID_REQUEST } });
    expect(await server.handleMessage({ jsonrpc: '2.0', id: 6 }))
      .toMatchObject({ id: 6, error: { code: INVALID_REQUEST } });
  });

  it('returns method not found for unknown methods', async () => {
    const server = createMcpServer();
    const response = await server.handleMessage(request(7, 'resources/list'));
    expect(response).toMatchObject({
      id: 7,
      error: { code: METHOD_NOT_FOUND, message: 'Method not found: resources/list' }
    });
  });

  it('lists all tools with object input schemas', async () => {
    const server = createMcpServer();
    const response = await server.handleMessage(request(8, 'tools/list'));
    const result = response?.result as {
      tools: Array<{ name: string; description: string; inputSchema: { type: string } }>;
    };
    expect(result.tools).toHaveLength(6);
    const names = result.tools.map((tool) => tool.name);
    expect(names).toEqual([
      'create_diagram',
      'add_node',
      'add_edge',
      'validate_diagram',
      'export_json',
      'import_json'
    ]);
    for (const tool of result.tools) {
      expect(tool.inputSchema.type).toBe('object');
      expect(typeof tool.description).toBe('string');
    }
  });

  it('returns -32602 for structurally invalid tools/call params', async () => {
    const server = createMcpServer();
    expect(
      await server.handleMessage(request(9, 'tools/call', { arguments: {} }))
    ).toMatchObject({ id: 9, error: { code: INVALID_PARAMS } });
    expect(
      await server.handleMessage(
        request(11, 'tools/call', { name: 'add_node', arguments: ['nope'] })
      )
    ).toMatchObject({ id: 11, error: { code: INVALID_PARAMS } });
    expect(
      await server.handleMessage(request(12, 'tools/call', { name: 'not_a_tool' }))
    ).toMatchObject({ id: 12, error: { code: INVALID_PARAMS } });
  });

  it('returns a structured tool error when arguments are omitted or incomplete', async () => {
    const server = createMcpServer();
    await server.handleMessage(request(13, 'tools/call', { name: 'create_diagram' }));
    const response = await server.handleMessage(request(14, 'tools/call', { name: 'add_node' }));
    expect(response?.error).toBeUndefined();
    const result = response?.result as { isError: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Missing required argument/);
  });

  it('supports a stateful editor flow through tools/call', async () => {
    const server = createMcpServer();
    const create = await server.handleMessage(
      request(20, 'tools/call', { name: 'create_diagram', arguments: {} })
    );
    expect((create?.result as { isError: boolean }).isError).toBe(false);
    await server.handleMessage(
      request(21, 'tools/call', {
        name: 'add_node',
        arguments: { id: 'n1', label: 'Start' }
      })
    );
    const exported = await server.handleMessage(
      request(22, 'tools/call', { name: 'export_json', arguments: {} })
    );
    const content = (exported?.result as { content: Array<{ text: string }> }).content;
    const diagram = JSON.parse(content[0].text) as {
      nodes: Array<{ id: string }>;
    };
    expect(diagram.nodes.map((node) => node.id)).toEqual(['n1']);
  });
});
