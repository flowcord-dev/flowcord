---
sidebar_position: 2
---

# MenuBuilder

Fluent builder for defining menus. Constructed once per session and produces a `MenuDefinition` via `.build()`.

```ts
import { MenuBuilder } from '@flowcord/core';
```

## Generics

```ts
MenuBuilder<TState, TSessionState, TCtx, TMode>
```

| Generic | Default | Description |
|---|---|---|
| `TState` | `Record<string, unknown>` | Typed menu-local state shape |
| `TSessionState` | `Record<string, unknown>` | Typed session-wide state shape |
| `TCtx` | `MenuContext<TState, TSessionState, Record<string, unknown>>` | Context type (extended by builder subclasses) |
| `TMode` | `'unset'` | Tracks render mode — narrows to `'embeds'` or `'layout'` when the respective method is called |

`TMode` enforces at compile time that embed-mode methods (`.setEmbeds`, `.setButtons`, `.setSelectMenu`) cannot be called alongside layout-mode methods (`.setLayout`).

## Constructor

```ts
new MenuBuilder(session: MenuSessionLike, name: string, options?: Record<string, unknown>)
```

`session` is the `MenuSession` instance passed into the menu factory. `name` is the unique menu identifier. `options` are available as `ctx.options` in callbacks.

---

## Render methods

### `.setEmbeds(fn)` — embeds mode

```ts
setEmbeds(fn: (ctx: TCtx) => Awaitable<EmbedBuilder[]>): MenuBuilder<TState, TSessionState, TCtx, 'embeds'>
```

Sets the embed render callback. Switches the builder to embeds mode.

---

### `.setButtons(fn, options?)` — embeds mode

```ts
setButtons(
  fn: (ctx: TCtx) => Awaitable<ButtonInputConfig<TCtx>[]>,
  options?: SetButtonsOptions
): MenuBuilder<TState, TSessionState, TCtx, 'embeds'>
```

Sets the button render callback. `options.pagination` enables explicit button pagination.

**`SetButtonsOptions`:**

```ts
{ pagination?: ButtonPaginationOptions }
```

**`ButtonPaginationOptions`:**

| Option | Type | Default | Description |
|---|---|---|---|
| `perPage` | `number` | `25` | Buttons per page |
| `stableButtons` | `boolean` | `true` | Always render both nav buttons (disabled when N/A) |
| `labels.next` | `string` | `'Next →'` | Next button label |
| `labels.previous` | `string` | `'← Previous'` | Previous button label |

---

### `.setSelectMenu(fn)` — embeds mode

```ts
setSelectMenu(fn: (ctx: TCtx) => Awaitable<SelectInputConfig<TCtx>>): MenuBuilder<TState, TSessionState, TCtx, 'embeds'>
```

Sets the select menu render callback.

---

### `.setLayout(fn)` — layout mode

```ts
setLayout(fn: (ctx: TCtx) => Awaitable<ComponentConfig<TCtx>[]>): MenuBuilder<TState, TSessionState, TCtx, 'layout'>
```

Sets the layout render callback (Components v2). Switches the builder to layout mode.

---

### `.setModal(fn)` — both modes

```ts
setModal(fn: (ctx: TCtx) => Awaitable<ModalConfig<TCtx> | ModalConfig<TCtx>[]>): this
```

Sets the modal render callback. Return a single `ModalConfig` for one modal, or an array for multiple (each requiring a unique `id`).

---

### `.setMessageHandler(fn, options?)` — both modes

```ts
setMessageHandler(
  fn: (ctx: TCtx, response: string) => Awaitable<void>,
  options?: { behavior?: InteractionBehavior }
): this
```

Enables text message input handling. The callback fires when the user sends a message in the channel.

`options.behavior` overrides the behavior for the render cycle after the message is collected. If omitted, the framework defaults the `messageCleanup` to `'postAndStrip'` for message collection cycles — this prevents the menu from being buried under the user's message in chat.

:::caution
If your existing menus rely on the message handler editing in place, set `.setMessageCleanup('edit')` explicitly or pass `{ behavior: { messageCleanup: 'edit' } }` to restore the previous behavior.
:::

---

## Lifecycle hooks

All hook methods accept `(ctx: TCtx) => Awaitable<void>` and return `this`.

| Method | Fires |
|---|---|
| `.setup(fn)` | Once on menu creation, before `onEnter` |
| `.onEnter(fn)` | Each time the menu is entered |
| `.beforeRender(fn)` | Before each render cycle |
| `.afterRender(fn)` | After the Discord message is sent or updated |
| `.onAction(fn)` | Before each button/select action callback |
| `.onNext(fn)` | When the user clicks the Next pagination button |
| `.onPrevious(fn)` | When the user clicks the Previous pagination button |
| `.onLeave(fn)` | When the menu is exited |
| `.onCancel(fn)` | When the user presses the Cancel button (before `onLeave`) |

See [Lifecycle Hooks](/docs/core-concepts/lifecycle-hooks) for execution order and usage guidance.

---

## Navigation & behaviour options

### `.setTrackedInHistory()`

Pushes this menu onto the navigation stack when navigating away. Required for `goBack()` to return here. See [Navigation](/docs/core-concepts/navigation).

### `.setReturnable()`

Injects a Back button into the reserved row. The button calls `goBack()`.

### `.setCancellable()`

Injects a Cancel button into the reserved row. Fires `onCancel` then `onLeave`.

### `.setPreserveStateOnReturn()`

Snapshots `ctx.state` and pagination position when leaving. Restores them when `goBack()` returns to this menu, skipping `setup()`. Requires `setTrackedInHistory()`. See [State Management](/docs/core-concepts/state-management).

### `.setFallbackMenu(menuId, options?)`

Specifies where `goBack()` navigates when the stack is empty. See [Fallback Menus](/docs/advanced/fallback-menus).

### `.setEphemeral(ephemeral?)`

```ts
setEphemeral(ephemeral?: boolean): this
```

Marks the menu reply as visible only to the invoking user. Defaults to `true` when called with no argument — pass `false` to explicitly opt out of ephemeral.

For **async** menu factories, also pass `entryEphemeral` to `handleInteraction()` — the framework must `deferReply()` before running the factory and cannot read `setEphemeral()` in time. For sync factories, this method alone is sufficient.

See [Behavior System — Ephemeral menus](/docs/core-concepts/behavior-system#ephemeral-menus).

### `.setMessageCleanup(mode, options?)`

```ts
setMessageCleanup(mode: 'edit' | 'postAndStrip'): this
setMessageCleanup(mode: 'postAndDelete', options?: { ephemeralFallback?: 'strip' | 'replace'; closedMessage?: string }): this
setMessageCleanup(mode: 'postAndReplace', options?: { closedMessage?: string }): this
```

Controls how the current message is handled on the next render cycle.

| Mode | Behaviour |
|---|---|
| `'edit'` | Edit the existing message in place (framework default) |
| `'postAndStrip'` | Post a new message; strip interactive components from the old one |
| `'postAndDelete'` | Post a new message; delete the old one. Use `ephemeralFallback` to control what happens when the old message is ephemeral (`'strip'` or `'replace'`; defaults to `'strip'`) |
| `'postAndReplace'` | Post a new message; replace the old one with `closedMessage` |

`closedMessage` defaults to `'*Menu closed*'`. Applies to both `'postAndReplace'` mode and the `'replace'` ephemeral fallback.

See [Behavior System — Message cleanup modes](/docs/core-concepts/behavior-system#message-cleanup-modes).

### `.setTimeoutMessage(message)`

```ts
setTimeoutMessage(message: string): this
```

Sets the message shown when the session ends due to inactivity. Overrides the framework default (`'*This interaction has timed out.*'`) and any session or global default, but yields to session and global overrides — like all menu-explicit behavior declarations.

```ts
.setTimeoutMessage('*This menu expired — run /shop to start over.*')
```

On timeout, the menu's content, embeds, and components are replaced with this message.

---

## Subclass API (protected)

These methods are only intended for use inside `MenuBuilder` subclass constructors. They allow a reusable builder to declare opinionated behavior defaults or overrides for all menus it produces.

### `_setDefaultBehavior(config)`

```ts
protected _setDefaultBehavior(config: BehaviorConfig): void
```

Sets class-level behavior defaults. Applied when no more-specific level (menu-explicit, session, or global) has declared a value. Has the lowest class-level priority — easily overridden by `setEphemeral()` or `setMessageCleanup()` on the same builder.

```ts
class AdminMenuBuilder extends MenuBuilder {
  constructor(session: MenuSessionLike, name: string, options?: Record<string, unknown>) {
    super(session, name, options);
    this._setDefaultBehavior({ ephemeral: true });
  }
}
```

### `_setOverrideBehavior(config)`

```ts
protected _setOverrideBehavior(config: BehaviorConfig): void
```

Sets class-level behavior overrides. Wins over the builder's own `setEphemeral()` / `setMessageCleanup()` calls, but still yields to session and global overrides.

```ts
class AdminMenuBuilder extends MenuBuilder {
  constructor(session: MenuSessionLike, name: string, options?: Record<string, unknown>) {
    super(session, name, options);
    this._setOverrideBehavior({ deleteUserMessages: true });
  }
}
```

See [Behavior System — Subclass defaults and overrides](/docs/core-concepts/behavior-system#subclass-defaults-and-overrides).

---

## Pagination

### `.setListPagination(opts)`

```ts
setListPagination(opts: ListPaginationOptions<TCtx>): this
```

Enables list pagination. FlowCord calls `getTotalQuantityItems` before each render and populates `ctx.pagination`.

**`ListPaginationOptions`:**

| Option | Type | Default | Description |
|---|---|---|---|
| `getTotalQuantityItems` | `(ctx) => Awaitable<number>` | Required | Total item count |
| `itemsPerPage` | `number` | `50` | Items per page |
| `stableButtons` | `boolean` | `true` | Always render both nav buttons |
| `labels.next` | `string` | `'Next →'` | Next button label |
| `labels.previous` | `string` | `'← Previous'` | Previous button label |

See [Pagination](/docs/advanced/pagination).

---

## Context extension

### `.extendContext(fn)`

```ts
extendContext<TExtra extends Record<string, unknown>>(
  fn: (baseCtx: MenuContext) => TExtra
): this
```

Adds typed properties to `ctx`. Used by builder subclasses to inject domain helpers.

---

## `fromDefinition(def)`

An alternative to method chaining — configure the builder from an object literal:

```ts
builder.fromDefinition({
  embeds: (ctx) => [/* ... */],
  buttons: (ctx) => [/* ... */],
  setup: (ctx) => { /* ... */ },
  hooks: { onLeave: async (ctx) => { /* ... */ } },
  options: { trackInHistory: true, returnable: true },
});
```

`fromDefinition` merges with any previously set builder options.

---

## `.build()`

```ts
build(): MenuDefinition
```

Validates the builder configuration and returns a `MenuDefinition`. Throws if:

- Neither `.setEmbeds()` nor `.setLayout()` was called
- Both `.setEmbeds()` and `.setLayout()` were called
- `.setSelectMenu()` is combined with button pagination
