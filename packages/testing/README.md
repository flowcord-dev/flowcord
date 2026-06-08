# @flowcord/testing

Testing utilities for [FlowCord](https://github.com/flowcord-dev/flowcord-core). Drive
menu sessions to completion in-process — no Discord gateway connection, no real
interactions, fully deterministic.

The package centers on `MenuHarness`, a fluent wrapper around an in-memory
`SimulatedAdapter` and a real `MenuEngine`. You register your menu factories,
`start()` a session, then `click()` / `select()` / `sendMessage()` your way
through it and assert on what was rendered.

## Installation

```sh
npm install --save-dev @flowcord/testing
```

> **Version lock:** `@flowcord/testing` is published in lockstep with
> `@flowcord/core` and declares it as an **exact-version** peer dependency. A
> core/testing version mismatch can produce silent, subtle breakage, so always
> install the two at the same version.

## Quick start

```ts
import { MenuHarness } from '@flowcord/testing';
import { makeMainMenu, makeDetailMenu } from '../src/menus';

it('navigates to the detail menu on button click', async () => {
  const harness = new MenuHarness({
    main: makeMainMenu,
    detail: makeDetailMenu,
  });

  await harness.start('main');

  await harness.click('Go to detail');

  expect(harness.currentMenu).toBe('detail');
  expect(harness.hasText('Detail view')).toBe(true);

  await harness.cancel(); // drain the session to completion
});
```

`MenuHarness.endAll()` ends every harness left open by a test — wire it into a
global `afterEach` so a forgotten `cancel()`/`end()` never leaks an open handle:

```ts
// jest.setup.ts
import { MenuHarness } from '@flowcord/testing';

afterEach(async () => {
  await MenuHarness.endAll();
});
```

## API surface

| Export | Purpose |
|--------|---------|
| `MenuHarness` | High-level harness: start a session, drive interactions, assert on renders |
| `createTestSession` | Lower-level factory returning the raw `SimulatedAdapter` + a `startSession` fn |
| `SimulatedAdapter` | In-process `FlowCordAdapter` test double backed by an interaction queue |
| `SimulatedTimeoutError` | Thrown when the adapter's safety timeout fires |
| `mockClient`, `mockCommandInteraction`, `mockComponentInteraction`, `mockMessage`, `mockModalSubmitInteraction` | Discord.js stubs for unit tests |
| `mockMenuContext` | Stub `MenuContext` for functions that take one directly |
| `mockMenuSessionLike` | Stub `MenuSessionLike` (e.g. constructing a `MenuBuilder` outside a session) |
| `EventLog`, `SessionEvent` | Re-exported from core; the harness's tracing sink |

> The mocks listed above live in core and are published at `@flowcord/core/mocks`
> (so core's own unit tests can use them without depending on this package).
> They're re-exported here for convenience — importing from either entry point works.

### `MenuHarness` highlights

- **Lifecycle:** `start(menuName, options?)`, `end()`, static `endAll()`
- **Drive:** `click()`, `select()`, `sendMessage()`, `clickModal()`, `submitModal()`, `goBack()`, `cancel()`, `nextPage()`, `prevPage()`
- **Query rendered components:** `getButton()`/`queryButton()`, `getButtonById()`/`queryButtonById()`, `getSelect()`/`querySelect()`, `getEmbed()`/`queryEmbed()`
- **Assert on content:** `currentMenu`, `hasText()`, `findText()`
- **Inspect tracing:** `navigationHistory`, `hookHistory`, `actionHistory`, `lastAction`

## Writing integration tests

Each `MenuHarness` method that drives an interaction (`click`, `select`,
`sendMessage`, …) awaits the next render before resolving, so you can read state
immediately after. Two rules keep tests clean:

- **Always drain the session.** End each test with a terminal action
  (`cancel()`, `end()`, or a handler that closes the menu) so no session loop is
  left running.
- **Prefer the harness over the raw adapter.** Reach for `createTestSession` /
  `SimulatedAdapter` directly only when you need lower-level control over the
  render/interaction loop.

## Conventions

All variable names — including arrow-function parameters — must be **at least 3
characters**. Single-character names (`i`, `e`, `fn`, `m`, …) are not permitted.

## License

Apache-2.0
