# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- MCP server over stdio: `initialize`, `tools/list`, `tools/call`, `ping` with
  six editor tools (`create_diagram`, `add_node`, `add_edge`,
  `validate_diagram`, `export_json`, `import_json`).
- Test suites: MCP protocol conformance, tool contracts, untrusted-input
  security, and client-over-stdio end-to-end tests (`tests/mcp`, `tests/e2e`).
- LICENSE (ISC), CHANGELOG, `.nvmrc`, `engines` field.
- Coverage thresholds enforced in CI; `npm audit` split into a dedicated job.

### Changed
- TypeScript pinned to `~6.0.3` (typescript-eslint 8.x compatibility) which
  fixes the `validate` CI job that had failed on every PR since the
  TypeScript 7 bump (#17).
- vitest bumped to 5.0.1 (supersedes #16); TruffleHog action pinned to a
  released commit instead of `@main` (#19).

### Fixed
- Documentation now reflects actual implementation state (#20).
