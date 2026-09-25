import { EditorSession, ToolCallResult, toolDefinitions } from './tools.js';

export const PROTOCOL_VERSION = '2025-06-18';
export const SERVER_NAME = 'diagrameditor';
export const SERVER_VERSION = '0.1.0';

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

const SUPPORTED_PROTOCOL_VERSIONS = new Set(['2025-06-18', '2025-03-26']);

export interface JsonRpcError {
  readonly code: number;
  readonly message: string;
}

export interface JsonRpcResponse {
  readonly jsonrpc: '2.0';
  readonly id: number | string | null;
  readonly result?: unknown;
  readonly error?: JsonRpcError;
}

export interface McpServer {
  handleMessage(message: unknown): Promise<JsonRpcResponse | null>;
}

class RpcError extends Error {
  constructor(
    readonly code: number,
    message: string
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requestId(message: Record<string, unknown>): number | string | null {
  const id = message.id;
  return typeof id === 'number' || typeof id === 'string' ? id : null;
}

function response(id: number | string, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function errorResponse(
  id: number | string | null,
  code: number,
  message: string
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function isKnownTool(name: string): boolean {
  return toolDefinitions.some((tool) => tool.name === name);
}

function dispatch(
  method: string,
  params: Record<string, unknown> | undefined,
  session: EditorSession
): unknown {
  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      const version =
        typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.has(requested)
          ? requested
          : PROTOCOL_VERSION;
      return {
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: toolDefinitions };
    case 'tools/call': {
      const name = params?.name;
      if (typeof name !== 'string' || name.length === 0) {
        throw new RpcError(INVALID_PARAMS, 'Invalid params: missing tool name.');
      }
      if (!isKnownTool(name)) {
        throw new RpcError(INVALID_PARAMS, 'Unknown tool: ' + name);
      }
      const rawArgs = params?.arguments;
      let args: Record<string, unknown> = {};
      if (rawArgs !== undefined) {
        if (!isJsonObject(rawArgs)) {
          throw new RpcError(
            INVALID_PARAMS,
            'Invalid params: arguments must be an object.'
          );
        }
        args = rawArgs;
      }
      const result: ToolCallResult = session.callTool(name, args);
      return { content: result.content, isError: result.isError === true };
    }
    default:
      throw new RpcError(METHOD_NOT_FOUND, 'Method not found: ' + method);
  }
}

export function createMcpServer(): McpServer {
  const session = new EditorSession();
  return {
    async handleMessage(message: unknown): Promise<JsonRpcResponse | null> {
      if (!isJsonObject(message)) {
        return errorResponse(null, INVALID_REQUEST, 'Invalid Request');
      }
      if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
        return errorResponse(requestId(message), INVALID_REQUEST, 'Invalid Request');
      }
      const id = message.id;
      if (typeof id !== 'number' && typeof id !== 'string') {
        return null;
      }
      const params = isJsonObject(message.params) ? message.params : undefined;
      try {
        return response(id, dispatch(message.method, params, session));
      } catch (error) {
        if (error instanceof RpcError) {
          return errorResponse(id, error.code, error.message);
        }
        return errorResponse(id, INTERNAL_ERROR, 'Internal error');
      }
    }
  };
}
