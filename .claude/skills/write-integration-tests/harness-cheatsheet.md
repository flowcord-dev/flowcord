# MenuHarness cheatsheet

Quick reference for `@flowcord/testing`. Authoritative docs:
`packages/testing/README.md` (sections: Quick Start, API Surface,
Writing Integration Tests).

## API at a glance

| Category   | Members                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Lifecycle  | `start(menuName, options?)`, `end()`, static `endAll()`                 |
| Drive      | `click()`, `select()`, `sendMessage()`, `clickModal()`, `submitModal()`, `goBack()`, `cancel()`, `nextPage()`, `prevPage()` |
| Query      | `getButton()`/`queryButton()`, `getButtonById()`/`queryButtonById()`, `getSelect()`/`querySelect()`, `getEmbed()`/`queryEmbed()` |
| Content    | `currentMenu`, `hasText()`, `findText()`                                |
| Renders    | `renders`, `lastRender`, `renderCount`                                  |
| Tracing    | `navigationHistory`, `hookHistory`, `actionHistory`, `lastAction`, `modalHistory` |

`get*` throws when the component is absent; `query*` returns
undefined — use `query*` for negative assertions.

## Asserting a navigation path

The render log is the cleanest way to assert a whole journey:

```ts
await sim.start('main');
await sim.click('Go to Detail');
await sim.goBack();

expect(sim.renders.map((rdr) => rdr.menuId)).toEqual([
  'main',
  'detail',
  'main',
]);
```

## Modal round-trip

```ts
// clickModal is synchronous (the modal "opens"); submitModal
// fills fields (keyed by field custom id) and submits.
sim.clickModal('Edit name');
await sim.submitModal({ 'name-field': 'New value' });

expect(sim.hasText('New value')).toBe(true);
// One 'shown' entry + one 'submit' entry:
expect(sim.modalHistory.map((m) => m.kind)).toEqual([
  'shown',
  'submit',
]);
```

## Tracing instead of spies

The engine logs hooks/actions/navigation — assert on those rather
than wrapping handlers in jest.fn():

```ts
await sim.click('Save');

// lastAction: { menuId, componentId } | null
expect(sim.lastAction?.menuId).toBe('main');
// hookHistory entries: { menuId, hookName } — e.g. 'setup',
// 'onEnter', 'beforeRender', 'afterRender', 'onLeave'
expect(sim.hookHistory.map((h) => h.hookName)).toContain(
  'afterRender',
);
// navigationHistory entries: { from, to }
```

## Lower level: `createTestSession` / `SimulatedAdapter`

Only when the harness can't express the scenario (e.g. you need
to interleave raw adapter events). Prefer the harness — see
"Writing Integration Tests" in the testing README.
