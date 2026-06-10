# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.2] - 2026-06-10

### Added

- Initial extraction of the FlowCord test harness into its own published package, `@flowcord/testing`. Previously bundled inside `@flowcord/core` under `src/testing`; now consumable standalone and version-locked (lockstep) with `@flowcord/core`.
- `MenuHarness`, `createTestSession`, and `SimulatedAdapter` / `SimulatedTimeoutError`.
- Convenience re-exports of `EventLog` / `SessionEvent` and of the test mocks (`mockClient`, `mockMenuContext`, …). The mocks themselves live in core and are published at the `@flowcord/core/mocks` subpath — re-exported here so the harness and its consumers have a single entry point.
