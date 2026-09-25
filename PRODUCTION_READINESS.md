# Production Readiness Assessment

Current status: **Not production ready** - an MCP-server-based editor core with CI quality gates, but with product and operational gaps still open.

## What exists today

- Diagram domain model (nodes/edges + validation) - `src/domain/diagram.ts`.
- JSON import/export persistence boundary - `src/persistence/json.ts`.
- MCP server over stdio (initialize / tools/list / tools/call / ping, JSON-RPC 2.0) with six editor tools - `src/mcp/`, `src/server/main.ts`.
- Test suites: unit (domain), integration (persistence), MCP protocol conformance, tool contracts, untrusted-input security, and client-over-stdio e2e - `tests/`.
- CI: lint, typecheck, build, coverage-gated tests, dependency audit (separate job), TruffleHog secret scanning (pinned) - `.github/workflows/ci.yml`.
- LICENSE (ISC), CHANGELOG, documented release/security/operations baselines in `docs/`.

## Gap Summary (tracked in issues)

- Branch protection is not enforced on `main`; PRs have previously been merged with red CI - #18.
- No draw.io (mxGraph XML) format support yet; only the JSON boundary exists - #21.
- No release automation (tags, releases) yet; CHANGELOG added in this baseline - #24.
- Pre-commit hooks not yet added; coverage thresholds are a baseline 70% - #25.
- No hosted runtime: metrics, alerting, and dashboards remain future work (see `docs/OPERATIONS.md`).

## Production Readiness TODO

- [x] Define MVP scope and architecture (MCP editor core) - `docs/ARCHITECTURE.md`.
- [x] Core domain and JSON persistence implementation.
- [x] MCP server implementation (stdio transport, JSON-RPC 2.0, six tools) - #26.
- [x] Unit, integration, MCP protocol, tool-contract, security, and e2e tests - #27, #28, #29, #30.
- [x] Lint/typecheck/build/coverage enforced in CI - #25 (pre-commit hooks still open).
- [x] Dependency vulnerability scanning (audit job + weekly Dependabot) and secret scanning (TruffleHog, pinned) - #19.
- [x] Error handling standard: tool errors as structured MCP `isError` results; protocol errors as JSON-RPC codes.
- [x] Contributor guide incl. MCP Inspector manual test - `docs/CONTRIBUTING.md`.
- [x] LICENSE (ISC) - #23.
- [x] CHANGELOG and versioning policy - `docs/RELEASE.md` (automation still open - #24).
- [x] Toolchain fixed: TypeScript ~6.0.3, compatible with typescript-eslint 8.x - #17.
- [ ] Branch protection + CODEOWNERS - #18.
- [ ] draw.io format compatibility - #21.
- [ ] Release automation and first tagged release - #24.
- [ ] Pre-commit hooks - #25.
- [ ] Observability baseline when a hosted runtime exists.

## How to Track Progress

- Keep this file updated in each related pull request.
- Add links to PRs/issues beside completed items for auditability.
