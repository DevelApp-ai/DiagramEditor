import { createInterface } from 'node:readline';
import {
  INTERNAL_ERROR,
  JsonRpcResponse,
  PARSE_ERROR,
  createMcpServer
} from '../mcp/server.js';

const server = createMcpServer();

function send(message: JsonRpcResponse | null): void {
  if (message === null) {
    return;
  }
  process.stdout.write(JSON.stringify(message) + '\n');
}

async function handleLine(line: string): Promise<void> {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return;
  }
  let message: unknown;
  try {
    message = JSON.parse(trimmed);
  } catch {
    send({
      jsonrpc: '2.0',
      id: null,
      error: { code: PARSE_ERROR, message: 'Parse error' }
    });
    return;
  }
  send(await server.handleMessage(message));
}

const readline = createInterface({ input: process.stdin });
readline.on('line', (line) => {
  void handleLine(line).catch(() => {
    send({
      jsonrpc: '2.0',
      id: null,
      error: { code: INTERNAL_ERROR, message: 'Internal error' }
    });
  });
});

process.on('SIGINT', () => {
  process.exit(0);
});
process.on('SIGTERM', () => {
  process.exit(0);
});
