<p align="center">
  <img src="https://img.shields.io/npm/v/@flowcord/testing?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white" alt="discord.js v14" />
  <img src="https://img.shields.io/badge/license-Apache%202.0-green?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

# @flowcord/testing

**Headless test harness for [FlowCord](https://flowcord.dev) menus**

Drive menu sessions to completion in-process — no Discord gateway connection, no real interactions, fully deterministic. The package centers on `MenuHarness`, a fluent wrapper around an in-memory `SimulatedAdapter` and a real `MenuEngine`: register your menu factories, `start()` a session, then `click()` / `select()` / `sendMessage()` your way through it and assert on what was rendered.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Surface](#api-surface)
- [Writing Integration Tests](#writing-integration-tests)
- [Documentation](#documentation)
- [License](#license)

---

## Installation

> **This package is currently in alpha.** The API may change between releases.

```bash
npm install --save-dev @flowcord/testing@next
```

> **Version lock:** `@flowcord/testing` is published in lockstep with `@flowcord/core` and declares it as an **exact-version** peer dependency. A core/testing version mismatch can produce silent, subtle breakage, so always install the two at the same version.

---

## Quick Start

```ts
import { MenuHarness } from '@flowcord/testing';
import { mockMainMenu, mockDetailMenu } from '../src/menus';

it('navigates to the detail menu on button click', async () => {
  const harness = new MenuHarness({
    main: mockMainMenu,
    detail: mockDetailMenu,
  });

  await harness.start('main');

  await harness.click('Go to detail');

  expect(harness.currentMenu).toBe('detail');
  expect(harness.hasText('Detail view')).toBe(true);
  // No explicit teardown needed — the afterEach hook below ends any open session.
});
```

Wire `MenuHarness.endAll()` into a global `afterEach` so a session left open by a test never leaks an open handle:

```ts
// jest.setup.ts
import { MenuHarness } from '@flowcord/testing';

afterEach(async () => {
  await MenuHarness.endAll();
});
```

> `harness.end()` is test teardown — it force-terminates any still-running session, and is what `endAll()` calls to clean up open handles after each test.

---

## API Surface

| Export                                                                                                          | Purpose                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `MenuHarness`                                                                                                   | High-level harness: start a session, drive interactions, assert on renders     |
| `createTestSession`                                                                                             | Lower-level factory returning the raw `SimulatedAdapter` + a `startSession` fn |
| `SimulatedAdapter`                                                                                              | In-process `FlowCordAdapter` test double backed by an interaction queue        |
| `SimulatedTimeoutError`                                                                                         | Thrown when the adapter's safety timeout fires                                 |
| `mockClient`, `mockCommandInteraction`, `mockComponentInteraction`, `mockMessage`, `mockModalSubmitInteraction` | Discord.js stubs for unit tests                                                |
| `mockMenuContext`                                                                                               | Stub `MenuContext` for functions that take one directly                        |
| `mockMenuSessionLike`                                                                                           | Stub `MenuSessionLike` (e.g. constructing a `MenuBuilder` outside a session)   |
| `EventLog`, `SessionEvent`                                                                                      | Re-exported from core; the harness's tracing sink                              |

The mocks live in `@flowcord/core` and are published at the `@flowcord/core/mocks` subpath — they are re-exported here so the harness and its consumers have a single entry point.

### `MenuHarness` highlights

- **Lifecycle:** `start(menuName, options?)`, `end()`, static `endAll()`
- **Drive:** `click()`, `select()`, `sendMessage()`, `clickModal()`, `submitModal()`, `goBack()`, `cancel()`, `nextPage()`, `prevPage()`
- **Query rendered components:** `getButton()`/`queryButton()`, `getButtonById()`/`queryButtonById()`, `getSelect()`/`querySelect()`, `getEmbed()`/`queryEmbed()`
- **Assert on content:** `currentMenu`, `hasText()`, `findText()`
- **Manual payload access:** `renders`, `lastRender`, `renderCount`
- **Inspect tracing:** `navigationHistory`, `hookHistory`, `actionHistory`, `lastAction`, `modalHistory`

---

## Writing Integration Tests

Each `MenuHarness` method that drives an interaction (`click`, `select`, `sendMessage`, …) awaits the next render before resolving, so you can read state immediately after. Two rules keep tests clean:

- **Always drain the session.** No session loop should be left running at the end of a test. The simplest way is the global `afterEach(() => MenuHarness.endAll())` hook shown above, which ends any session a test left open — so individual tests rarely need an explicit `end()`.
- **Prefer the harness over the raw adapter.** Reach for `createTestSession` / `SimulatedAdapter` directly only when you need lower-level control over the render/interaction loop.

---

## Documentation

Full documentation for the FlowCord framework lives at **[flowcord.dev](https://flowcord.dev)**. Until the testing guide lands there, this README is the authoritative reference for the harness — the [`@flowcord/core-integration`](https://github.com/flowcord-dev/flowcord/tree/master/packages/core-integration) test suite is a rich source of real-world usage examples.

---

## License

[Apache 2.0](https://github.com/flowcord-dev/flowcord/blob/master/LICENSE)
