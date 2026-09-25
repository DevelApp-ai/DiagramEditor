# Developer Setup

## Requirements

- Node.js 22.12+ (see `.nvmrc`)
- npm 10+

## Install

```bash
npm install
```

## Local Validation

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run test:coverage
```

Note: the e2e suite (`tests/e2e`) spawns the built server from `dist/`. It builds automatically if `dist` is missing, but CI always builds first.

## Testing the MCP Server Manually

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/src/server/main.js
```

The server speaks newline-delimited JSON-RPC 2.0 on stdio, so you can also drive it with plain pipes.

## Test Suites

- `tests/unit` - domain logic.
- `src/persistence/*.integration.test.ts` - JSON persistence boundary.
- `tests/mcp` - protocol conformance, tool contracts, untrusted-input robustness.
- `tests/e2e` - real client process over stdio.
