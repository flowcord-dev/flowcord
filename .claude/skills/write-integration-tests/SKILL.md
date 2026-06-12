---
name: write-integration-tests
description: Use when writing or modifying behavior/integration tests for FlowCord menus, sessions, navigation, or interactions — anything involving MenuHarness, @flowcord/testing, or packages/core-integration.
---

# Writing FlowCord behavior tests

Behavior tests live in `packages/core-integration/src/__tests__/`
and drive a **real** `MenuEngine` through the `MenuHarness` from
`@flowcord/testing` — never hand-rolled Discord.js mocks.

## Before writing anything

Read the existing suite closest to your topic in
`packages/core-integration/src/__tests__/`: `session`, `hooks`,
`modal`, `pagination`, `select`, `state`, `layout`, `message`.
They are the source of truth for patterns — do not invent new
ones.

## The canonical pattern

```ts
import { ButtonStyle } from 'discord.js';
import {
  goTo,
  MenuBuilder,
  type MenuSessionLike,
} from '@flowcord/core';
import { MenuHarness } from '@flowcord/testing';

// 1. Menu factories at module scope
const mockMainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
    .setButtons(() => [
      {
        label: 'Go to Detail',
        style: ButtonStyle.Primary,
        action: goTo('detail'),
      },
    ])
    .build();

// 2. Per test: harness → start → drive → assert
it('navigates to detail', async () => {
  expect.assertions(1);
  const sim = new MenuHarness({
    main: mockMainMenu,
    detail: mockDetailMenu,
  });
  await sim.start('main');

  await sim.click('Go to Detail');

  expect(sim.currentMenu).toBe('detail');
});
```

## Rules

- `expect.assertions(n)` at the top of each test (existing suites
  do this consistently).
- Every drive method (`click`, `select`, `sendMessage`, …) awaits
  the next render — assert immediately after, no manual waiting.
- **No per-test teardown**: `jest.setup.ts` runs
  `MenuHarness.endAll()` in a global `afterEach`. Only call
  `end()` explicitly when termination is what you're testing.
- Prefer harness assertions (`currentMenu`, `hasText`, `renders`,
  `lastRender`, tracing via `navigationHistory`/`actionHistory`)
  over poking at internals.
- Run with `npx nx test core-integration`; format obeys root
  Prettier (70-char width, single quotes).

## References

- [harness-cheatsheet.md](./harness-cheatsheet.md) — API quick
  reference with annotated snippets
- `packages/testing/README.md` — authoritative harness docs
