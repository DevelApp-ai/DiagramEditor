# MVP Scope and Architecture

## MVP Scope

An MCP-server-based diagram editor: clients create and edit diagrams through MCP tool calls.

- Diagram domain model (nodes + edges) with validation.
- JSON import/export boundary.
- draw.io (mxGraphModel XML) import/export boundary (subset).
- MCP server (stdio, JSON-RPC 2.0) exposing eight tools.
- Per-connection stateful editor session.

## Module Boundaries

- `src/domain/*`: pure business logic and validation (no I/O).
- `src/persistence/json.ts`: JSON serialization/deserialization boundary.
- `src/persistence/drawio.ts`: draw.io (mxGraphModel XML) serialization/deserialization boundary.
- `src/mcp/tools.ts`: tool definitions, input limits, and `EditorSession` (per-connection state).
- `src/mcp/server.ts`: MCP protocol handling (initialize, tools/list, tools/call, ping) over JSON-RPC 2.0.
- `src/server/main.ts`: stdio entrypoint (newline-delimited JSON-RPC).
- `src/index.ts`: library API export surface.
- `tests/unit/*`: domain behavior coverage.
- `src/persistence/*.integration.test.ts`: persistence boundary coverage (JSON and draw.io XML).
- `tests/mcp/*`: protocol conformance, tool contract, and security coverage.
- `tests/e2e/*`: client-over-stdio end-to-end coverage.

## Formats

- **JSON (versioned `DiagramDocument`)**: canonical internal format; complete fidelity.
- **draw.io XML (mxGraphModel subset)**: vertices and edges with labels map to
  nodes and edges. Geometry, styles, and other mxCell attributes are not
  preserved. Structural cells (id "0" and "1") are ignored on import and
  regenerated on export. The parser is strict: DOCTYPE, CDATA, unsupported
  entities, unexpected elements, and stray text content are rejected.

## Protocol

- Transport: stdio, one JSON-RPC 2.0 message per line.
- Supported protocol versions: 2025-06-18 (default), 2025-03-26.
- Tool errors are results with `isError: true`; protocol errors use JSON-RPC codes (-32700, -32600, -32601, -32602, -32603).
- Notifications (messages without `id`) receive no response and unknown notifications are ignored.

## Limits and Robustness

- Maximum 10,000 nodes and 10,000 edges; strings capped at 10,000 characters; import payloads capped at 1,000,000 characters (JSON and draw.io XML).
- Imported content is validated against the `DiagramDocument` schema before use; labels are inert data and are never interpreted.

## Technology Choices

- Runtime/build: Node.js 22 + TypeScript.
- Test framework: Vitest (unit, integration, protocol, security, e2e).
- Static analysis: ESLint.
- CI: GitHub Actions.

## Future Work

- Branch protection on `main` (#18).
