# Operations Runbook (Baseline)

## Deployment Architecture

- Build artifact: compiled TypeScript output in `dist/`.
- Target runtime: Node.js 22 LTS.
- The editor runs as an MCP server over stdio, launched by MCP clients; there is no hosted service yet.
- Environments: development (local), staging and production once a hosted runtime exists.

## Environment Configuration

- `NODE_ENV`: `development|staging|production`
- No secrets are currently required by this MCP server.

## Process Lifecycle

- The server reads newline-delimited JSON-RPC from stdin and writes responses to stdout.
- SIGINT/SIGTERM trigger a clean exit (exit code 0).
- Protocol errors return JSON-RPC error codes; malformed input lines never terminate the process.

## Observability

- Add metrics, structured logging, and alerting when a hosted runtime is introduced.
- Until then, CI (lint, typecheck, build, coverage, audit, secret scan) is the health baseline.

## Backup and Recovery

- Diagrams are produced as JSON via the `export_json` tool; clients own persistence of exported files.
- When durable backend storage is added: daily snapshots + point-in-time recovery, with quarterly restore drills.

## SLO and Incident Response

- Availability target (future hosted service): 99.9% monthly.
- Incident severity levels: Sev1, Sev2, Sev3.
- Initial response target: Sev1 within 15 minutes.
