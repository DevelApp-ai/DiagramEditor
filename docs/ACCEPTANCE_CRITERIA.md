# Production Readiness Sign-off Criteria

A release is considered production-ready only if all items below are true:

- [ ] CI is green (lint, typecheck, build, tests, audit, secret scan).
- [ ] Unit tests cover core domain logic changes.
- [ ] Integration tests cover persistence/import-export changes.
- [ ] E2E smoke test passes for critical user flow.
- [ ] No high/critical dependency vulnerabilities are open.
- [ ] No unresolved secret scanning findings.
- [ ] Deployment, rollback, and incident process are documented and current.
- [ ] Release notes and version tag are prepared.
