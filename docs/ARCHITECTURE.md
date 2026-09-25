# MVP Scope and Architecture

## MVP Scope

An MCP-server-based diagram editor: clients create and edit diagrams through MCP tool calls.

- Diagram domain model (nodes + edges) with validation.
- JSON import/export boundary.
- MCP server (stdio, JSON-RPC 2.0) exposing six tools.
- Per-connection stateful editor session.

## Module Boundaries

- `src/domain/*`: pure business logic and validation (no I/O).
- `src/persistence/*`: JSON serialization/deserialization boundary.
- `src/mcp/tools.ts`: tool definitions, input limits, and `EditorSession` (per-connection state).
- `src/mcp/server.ts`: MCP protocol handling (initialize, tools/list, tools/call, ping) over JSON-RPC 2.0.
- `src/server/main.ts`: stdio entrypoint (newline-delimited JSON-RPC).
- `src/index.ts`: library API export surface.
- `tests/unit/*`: domain behavior coverage.
- `src/persistence/*.integration.test.ts`: persistence boundary coverage.
- `tests/mcp/*`: protocol conformance, tool contract, and security coverage.
- `tests/e2e/*`: client-over-stdio end-to-end coverage.

## Protocol

- Transport: stdio, one JSON-RPC 2.0 message per line.
- Supported protocol versions: 2025-06-18 (default), 2025-03-26.
- Tool errors are results with `isError: true`; protocol errors use JSON-RPC codes (-32700, -32600, -32601, -32602, -32603).
- Notifications (messages without `id`) receive no response and unknown notifications are ignored.

## Limits and Robustness

- Maximum 10,000 nodes and 10,000 edges; strings capped at 10,000 characters; import payloads capped at 1,000,000 characters.
- Imported content is validated against the `DiagramDocument` schema before use; labels are inert data and are never interpreted.

## Technology Choices

- Runtime/build: Node.js 22 + TypeScript.
- Test framework: Vitest (unit, integration, protocol, security, e2e).
- Static analysis: ESLint.
- CI: GitHub Actions.

## Future Work

- draw.io (mxGraph XML) import/export - #21.
