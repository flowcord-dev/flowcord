# @flowcord/core-integration — Agent Context

Private package containing only behavior (integration) tests for
`@flowcord/core`, written against the `MenuHarness` from
`@flowcord/testing`. No exported code; nothing here is published.

Run with `npx nx test core-integration`.

## The canonical test pattern

```ts
const mockMainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main') /* … */.build();

const sim = new MenuHarness({ main: mockMainMenu });
await sim.start('main');
await sim.click('Go to Detail');
expect(sim.currentMenu).toBe('detail');
```

- **Read an existing test before writing one** — the suites in
  `src/__tests__/` (session, hooks, modal, pagination, select,
  state, layout, message) are the source of truth for patterns.
- Never hand-roll Discord.js mocks here; the harness simulates
  the full interaction loop.
- `jest.setup.ts` already runs `MenuHarness.endAll()` in a global
  `afterEach` — do not add per-test `end()`/teardown unless the
  test specifically exercises termination.
- A `write-integration-tests` skill exists at
  `.claude/skills/write-integration-tests/` with a harness
  cheatsheet.
