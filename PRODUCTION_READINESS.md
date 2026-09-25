# Production Readiness Assessment

Current status: **Not production ready** - an MCP-server-based editor core with CI quality gates, but with product and operational gaps still open.

## What exists today

- Diagram domain model (nodes/edges + validation) - `src/domain/diagram.ts`.
- JSON import/export persistence boundary - `src/persistence/json.ts`.
- draw.io (mxGraphModel XML) import/export - `src/persistence/drawio.ts`.
- MCP server over stdio (initialize / tools/list / tools/call / ping, JSON-RPC 2.0) with six editor tools - `src/mcp/`, `src/server/main.ts`.
- Test suites: unit (domain), integration (JSON + draw.io persistence), MCP protocol conformance, tool contracts, untrusted-input security, and client-over-stdio e2e - `tests/`.
- CI: lint, typecheck, build, coverage-gated tests, dependency audit (separate job), TruffleHog secret scanning (pinned) - `.github/workflows/ci.yml`.
- Release automation: semver tag push runs the full gate and creates a GitHub Release with changelog notes - `.github/workflows/release.yml`.
- Pre-commit hook: secret scan + eslint on staged files, installed via `npm install` - `scripts/`.
- LICENSE (ISC), CHANGELOG, documented release/security/operations baselines in `docs/`.

## Gap Summary (tracked in issues)

- Branch protection is not enforced on `main` - #18 (requires repository admin).
- draw.io XML is library-level only; not yet exposed as MCP tools.
- No hosted runtime: metrics, alerting, and dashboards remain future work (see `docs/OPERATIONS.md`).

## Production Readiness TODO

- [x] Define MVP scope and architecture (MCP editor core) - `docs/ARCHITECTURE.md`.
- [x] Core domain, JSON persistence, and draw.io XML persistence implementation - #21.
- [x] MCP server implementation (stdio transport, JSON-RPC 2.0, six tools) - #26.
- [x] Unit, integration, MCP protocol, tool-contract, security, and e2e tests - #27, #28, #29, #30.
- [x] Lint/typecheck/build/coverage enforced in CI; pre-commit hook added - #25.
- [x] Dependency vulnerability scanning (audit job + weekly Dependabot) and secret scanning (TruffleHog, pinned) - #19.
- [x] Error handling standard: tool errors as structured MCP `isError` results; protocol errors as JSON-RPC codes.
- [x] Contributor guide incl. MCP Inspector manual test - `docs/CONTRIBUTING.md`.
- [x] LICENSE (ISC) - #23.
- [x] CHANGELOG, versioning policy, and release automation - #24.
- [x] Toolchain fixed: TypeScript ~6.0.3, compatible with typescript-eslint 8.x - #17.
- [ ] Branch protection + required reviews - #18 (needs repository admin).
- [ ] Observability baseline when a hosted runtime exists.

## How to Track Progress

- Keep this file updated in each related pull request.
- Add links to PRs/issues beside completed items for auditability.
