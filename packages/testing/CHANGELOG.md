# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.2] - 2026-06-10

Initial release. The FlowCord test harness, previously internal to `@flowcord/core`, is now its own package, versioned in lockstep with core.

### Added

- `MenuHarness` — ergonomic API for driving menus in tests: click/select/submit-modal helpers, text and component finders (string or `RegExp`), render history, and event-log observability. Open sessions are tracked in a static registry; call `MenuHarness.endAll()` in an `afterEach` hook to clean up automatically
- `createTestSession` for lower-level session control, plus `SimulatedAdapter` / `SimulatedTimeoutError` for running sessions entirely in-memory without Discord
- Convenience re-exports of `EventLog` / `SessionEvent` and of the test mocks (`mockClient`, `mockMenuContext`, …). The mocks themselves live in core and are published at the `@flowcord/core/mocks` subpath — re-exported here so the harness and its consumers have a single entry point

[Unreleased]: https://github.com/flowcord-dev/flowcord/compare/v0.1.0-alpha.2...HEAD
[0.1.0-alpha.2]: https://github.com/flowcord-dev/flowcord/releases/tag/v0.1.0-alpha.2
