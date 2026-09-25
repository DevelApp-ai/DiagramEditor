# DiagramEditor

A draw.io-compatible diagram editor exposed as an **MCP (Model Context Protocol) server**. MCP clients can create and edit node/edge diagrams through tool calls; diagrams import and export as JSON.

## Project Status

Core domain, JSON persistence, an MCP server (stdio transport), and CI quality gates are in place. **Not yet production ready** - see [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) for the tracked gap list.

## Quick Start

```bash
npm install
npm run build
npm start
```

`npm start` runs the MCP server on stdio. Connect with any MCP client:

```json
{
  "mcpServers": {
    "diagrameditor": { "command": "node", "args": ["dist/src/server/main.js"] }
  }
}
```

## MCP Tools

| Tool | Description |
|---|---|
| `create_diagram` | Create a new empty diagram, replacing the current one |
| `add_node` | Add a node (unique, non-empty `id`; `label`) |
| `add_edge` | Add an edge between two existing nodes (optional `label`) |
| `validate_diagram` | Validate id uniqueness and edge endpoint integrity |
| `export_json` | Export the current diagram as JSON text |
| `import_json` | Import and validate a diagram from JSON text |

Each connection holds one stateful editor session. Limits: 10,000 nodes/edges, 10,000-char strings, 1,000,000-char import payloads.

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
```

Manual inspection: `npx @modelcontextprotocol/inspector node dist/src/server/main.js`

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Developer Setup](./docs/CONTRIBUTING.md)
- [Security Baseline](./docs/SECURITY_BASELINE.md)
- [Operations Runbook](./docs/OPERATIONS.md)
- [Release Strategy](./docs/RELEASE.md)
- [Production Sign-off Criteria](./docs/ACCEPTANCE_CRITERIA.md)
- [Changelog](./CHANGELOG.md)
- [Production Readiness Assessment](./PRODUCTION_READINESS.md)
