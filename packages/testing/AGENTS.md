# @flowcord/testing — Agent Context

Headless test harness for FlowCord menus: `MenuHarness` wraps an
in-memory `SimulatedAdapter` around a **real** `MenuEngine`, so
behavior tests exercise actual core logic with no Discord
connection. `createTestSession` is the lower-level escape hatch;
Discord.js stubs are re-exported from `@flowcord/core/mocks`.

**Version lock:** published in lockstep with `@flowcord/core` and
pins it as an exact-version peer dependency. Never bump this
package or the pin independently — `nx release` owns both.

## Depth docs

[README.md](./README.md) is the authoritative harness reference:

- `## Quick Start` — minimal harness test + global teardown setup
- `## API Surface` — full export table and `MenuHarness` method list
- `## Writing Integration Tests` — the two rules (drain sessions,
  prefer harness over raw adapter)

Real-world usage examples: the test suite in
`packages/core-integration/src/__tests__/`.

## Conventions

- Consumers should wire `afterEach(() => MenuHarness.endAll())`
  in their Jest setup (this repo already does, in
  `packages/core-integration/jest.setup.ts`).
- Changes to the harness API must keep the README's API Surface
  table accurate in the same PR.
