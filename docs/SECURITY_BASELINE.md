# Security Baseline

## Dependency Vulnerability Management

- Run `npm audit` in CI on every push and pull request.
- Review findings within 2 business days.
- Patch high/critical vulnerabilities immediately; medium in next planned release.

## Secret Scanning

- Run repository secret scanning in CI before merge.
- Never commit credentials, tokens, or private keys.
- If a secret is detected, rotate it immediately and remove it from git history if required.

## Reporting Process

- Open a security issue for each confirmed vulnerability.
- Track status: identified -> in progress -> fixed -> verified.
