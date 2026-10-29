# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- MCP tools `export_drawio` and `import_drawio`, exposing the draw.io
  (mxGraphModel XML) persistence boundary over the MCP protocol. Same input
  limits and structured error handling as the JSON tools; covered by protocol,
  tool-contract, security, and end-to-end tests (#66).
- draw.io (mxGraphModel XML) import/export: `importDiagramFromDrawioXml` /
  `exportDiagramToDrawioXml` in `src/persistence/drawio.ts`, with a strict,
  hand-rolled parser (no XML dependencies) and integration tests including
  adversarial inputs (#21).
- Release automation: pushing a semver tag now runs the full quality gate and
  creates a GitHub Release with notes extracted from this changelog (#24).
- Pre-commit hook (installed via `npm install` through the `prepare` script):
  secret-pattern scan and eslint on staged files (#25).

### Changed
- Documentation updated to reflect the draw.io format subset and the release
  and pre-commit processes.

### Fixed
- CI audit job restored to green: bumped `vitest` and
  `@vitest/coverage-v8` to `^5.0.5` and regenerated the lockfile, resolving
  six npm audit advisories in the dev-dependency tree, including the high
  severity `source-map-js` (GHSA-68fv-2mgg-jv7q) and `vite` advisories and
  the `@vitest/mocker` manual-mock injection advisory (GHSA-qxg6-89mg-rqv8).

## 0.1.0 - 2026-09-25

### Added
- MCP server over stdio: `initialize`, `tools/list`, `tools/call`, `ping` with
  six editor tools (`create_diagram`, `add_node`, `add_edge`,
  `validate_diagram`, `export_json`, `import_json`).
- Test suites: MCP protocol conformance, tool contracts, untrusted-input
  security, and client-over-stdio end-to-end tests.
- LICENSE (ISC), CHANGELOG, `.nvmrc`, `engines` field, CODEOWNERS.
- Coverage thresholds enforced in CI; `npm audit` in a dedicated job.

### Fixed
- TypeScript pinned to `~6.0.3` (typescript-eslint compatibility), fixing the
  `validate` CI job that had failed on every PR since the TypeScript 7 bump.
- TruffleHog action pinned to a released commit instead of `@main`.
