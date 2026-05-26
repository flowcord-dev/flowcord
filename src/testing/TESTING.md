# Testing Guide

## Directory layout

```
src/
  MODULE/
    __tests__/
      ModuleName.test.ts   ← unit tests for that module
  testing/
    __tests__/
      session.test.ts      ← session lifecycle integration tests
      hooks.test.ts        ← hook pipeline integration tests
      pagination.test.ts   ← pagination integration tests
      layout.test.ts       ← layout / display-component integration tests
      select.test.ts       ← select menu integration tests
      modal.test.ts        ← modal integration tests
      message.test.ts      ← message handler integration tests
      state.test.ts        ← state accessor integration tests
      helpers.ts           ← shared interaction helpers (not a test file)
    mocks/
      discordjs.ts         ← mockClient(), mockInteraction()
      menuContext.ts       ← mockMenuContext()
      menuSession.ts       ← mockMenuSessionLike()
      index.ts             ← barrel re-export
    createTestSession.ts   ← test session factory
    SimulatedAdapter.ts    ← in-process Discord adapter
    index.ts               ← public re-exports
```

## Unit tests vs integration tests

### Unit tests — `src/MODULE/__tests__/`

For modules with a self-contained API: registries, state, tracing, lifecycle, validators, builders. No Discord.js connection or session loop needed.

- Instantiate the class or call the function directly
- Assert on return values and thrown errors
- Use `mockMenuContext()` when a `MenuContext` argument is required
- Use `mockMenuSessionLike()` when a `MenuSessionLike` argument is required (e.g. constructing a `MenuBuilder` outside a session)

```ts
// src/registry/__tests__/MenuRegistry.test.ts
import { MenuRegistry } from '../MenuRegistry';

it('throws on duplicate registration', () => {
  const registry = new MenuRegistry();
  registry.register('menu', mockFactory);
  expect(() => registry.register('menu', mockFactory)).toThrow();
});
```

### Integration tests — `src/testing/__tests__/`

For behaviour that requires a running session loop, rendered payloads, and user interaction. All tests here use `createTestSession` + `SimulatedAdapter`.

```ts
import { createTestSession } from '../createTestSession';
import { click, findButtonId } from './helpers';

it('navigates to detail on button click', async () => {
  const { adapter, startSession } = createTestSession({ main: makeMain, detail: makeDetail });
  const done = startSession('main');   // do NOT await — runs concurrently

  await adapter.waitForNextRender();   // synchronise with the session loop

  const btnId = findButtonId(adapter.lastRender!, 'Go Detail');
  adapter.enqueueComponent(click(btnId!));
  await adapter.waitForNextRender();

  // ... assertions ...

  adapter.enqueueComponent(click(closeId!));
  await done;
});
```

**Key rules:**
- Never `await startSession(...)` immediately — the session loop runs concurrently with your test
- Always drain the session to completion (`await done`) at the end of each test to avoid open handles
- Use `adapter.waitForNextRender()` to gate on each render before inspecting or enqueuing the next interaction

## Mocks

| Mock | Location | Use when |
|------|----------|----------|
| `mockClient()` | `mocks/discordjs.ts` | Need a stub `Client<true>` (e.g. constructing a `MenuEngine`) |
| `mockInteraction()` | `mocks/discordjs.ts` | Need a stub `ChatInputCommandInteraction` |
| `mockMenuContext()` | `mocks/menuContext.ts` | A function under test accepts a `MenuContext` argument |
| `mockMenuSessionLike()` | `mocks/menuSession.ts` | Constructing a `MenuBuilder` in a unit test |

All mocks are re-exported from `src/testing` (the public barrel) and from `src/testing/mocks`.

## Interaction helpers (`helpers.ts`)

| Helper | Purpose |
|--------|---------|
| `click(customId, userId?)` | Build a button `NormalizedComponentInteraction` |
| `select(customId, values, userId?)` | Build a select `NormalizedComponentInteraction` |
| `modalSubmit(fields)` | Build a `NormalizedModalSubmission` |
| `message(content)` | Build a `NormalizedMessage` |
| `reservedClick(payload, reservedId, menuId, userId?)` | Click a reserved button (Back, Cancel, etc.) by extracting the session ID from the rendered payload |
| `findButtonId(payload, label)` | Find a button's `customId` by label in a rendered payload |
| `findSelectId(payload)` | Find the first select menu's `customId` in a rendered payload |

## Variable naming

All variable names must be **at least 3 characters**, including arrow function parameters. Single-character names (`i`, `e`, `fn`, `m`, etc.) are not permitted anywhere in the test suite.
