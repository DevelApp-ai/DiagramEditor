# Operations Runbook (Baseline)

## Deployment Architecture

- Build artifact: compiled TypeScript output in `dist/`.
- Target runtime: Node.js 22 LTS.
- Environments: development, staging, production.

## Environment Configuration

- `NODE_ENV`: `development|staging|production`
- No secrets are currently required by this MVP core module.

## Observability

- Health check command: `npm run typecheck` and `npm test`.
- Error logs should be structured JSON once runtime API/server is added.
- Add metrics and alerting when a hosted runtime is introduced.

## Backup and Recovery

- Persisted diagrams must be stored in durable backing storage when backend is added.
- Backup policy target: daily snapshots + point-in-time recovery.
- Recovery drill target: quarterly restore validation.

## SLO and Incident Response

- Availability target (future hosted service): 99.9% monthly.
- Incident severity levels: Sev1, Sev2, Sev3.
- Initial response target: Sev1 within 15 minutes.
