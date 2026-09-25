# Production Readiness Sign-off Criteria

A release is considered production-ready only if all items below are true:

- [ ] CI is green (lint, typecheck, build, coverage-gated tests, audit, secret scan).
- [ ] Unit tests cover core domain logic changes.
- [ ] Integration tests cover persistence/import-export changes.
- [ ] MCP protocol conformance and tool contract tests pass.
- [ ] E2E suite (client over stdio) passes for the critical editor flow.
- [ ] No high/critical dependency vulnerabilities are open.
- [ ] No unresolved secret scanning findings.
- [ ] Deployment, rollback, and incident process are documented and current.
- [ ] Release notes and version tag are prepared.
