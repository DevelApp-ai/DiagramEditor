# MVP Scope and Architecture

## MVP Scope

The current MVP covers:

- Diagram domain model (nodes + edges).
- Domain validation (ID uniqueness and edge endpoint integrity).
- JSON import/export boundary for persistence and interoperability.
- End-to-end smoke flow for create -> serialize -> import -> validate.

## Module Boundaries

- `src/domain/*`: core business logic and validation.
- `src/persistence/*`: JSON serialization/deserialization boundary.
- `src/index.ts`: public API export surface.
- `tests/unit/*`: unit coverage for domain behavior.
- `src/persistence/*.integration.test.ts`: integration coverage near persistence implementation.
- `tests/e2e/*`: smoke coverage of critical user flow through public API.

## Technology Choices

- Runtime/build: Node.js + TypeScript.
- Test framework: Vitest.
- Static analysis: ESLint.
- CI: GitHub Actions.
