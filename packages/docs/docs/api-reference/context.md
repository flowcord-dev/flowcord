---
sidebar_position: 4
---

# MenuContext

The single typed object passed to every menu callback — render methods, lifecycle hooks, button actions, select handlers, and modal submissions all receive `ctx`.

```ts
import type { MenuContext } from '@flowcord/core';
```

## Generics

```ts
MenuContext<TState, TSessionState, TOptions>
```

| Generic | Default | Description |
|---|---|---|
| `TState` | `Record<string, unknown>` | Menu-local state shape |
| `TSessionState` | `Record<string, unknown>` | Session-wide state shape |
| `TOptions` | `Record<string, unknown>` | Slash command options shape |

These are inferred from the `MenuBuilder` generics — you rarely need to annotate `ctx` directly.

---

## State

### `ctx.state`

```ts
state: StateAccessor<TState>
```

Menu-scoped state. Created fresh when the menu opens, reset on navigation unless `.setPreserveStateOnReturn()` is configured.

| Method | Description |
|---|---|
| `ctx.state.get('key')` | Get a typed value |
| `ctx.state.set('key', value)` | Set a typed value |
| `ctx.state.merge({ key: value })` | Shallow-merge a partial state object |
| `ctx.state.reset(newState)` | Replace the entire state object |
| `ctx.state.current` | Readonly snapshot of the full state |

See [State Management](/docs/core-concepts/state-management).

---

### `ctx.sessionState`

```ts
sessionState: StateStore<TSessionState>
```

Session-scoped state. Shared across all menus in the session, persists until the session ends.

| Method | Description |
|---|---|
| `ctx.sessionState.get('key')` | Get a value (`undefined` if not set) |
| `ctx.sessionState.set('key', value)` | Set a value |
| `ctx.sessionState.has('key')` | Check if a key exists |
| `ctx.sessionState.delete('key')` | Remove a key (returns `true` if it existed) |
| `ctx.sessionState.clear()` | Remove all keys |
| `ctx.sessionState.keys()` | `IterableIterator<string>` of all keys |
| `ctx.sessionState.size` | Number of stored entries |

---

## Navigation

### `ctx.goTo(menuId, options?)`

```ts
goTo(menuId: string, options?: Record<string, unknown>): Promise<void>
```

Navigates to the specified menu. `options` are passed as `ctx.options` in the target menu.

---

### `ctx.goBack(result?)`

```ts
goBack(result?: unknown): Promise<void>
```

Pops the navigation stack. If the stack is empty and a fallback menu is configured, navigates there instead. If no fallback, closes the session.

---

### `ctx.close()`

```ts
close(): Promise<void>
```

Ends the session entirely.

---

### `ctx.hardRefresh()`

```ts
hardRefresh(): Promise<void>
```

Re-runs the menu factory from scratch — re-executes `setup()` and re-registers all callbacks. Use when the menu's structure (not just its content) needs to change based on data. Typically needed in fewer than 10% of cases.

---

## Sub-menus

### `ctx.openSubMenu(menuId, opts)`

```ts
openSubMenu(menuId: string, opts: SubMenuOptions): Promise<void>
```

Opens a sub-menu with a completion callback. `onComplete` fires when the sub-menu calls `ctx.complete()`.

```ts
interface SubMenuOptions {
  onComplete: (ctx: MenuContext, result?: unknown) => Awaitable<void>;
  [key: string]: unknown; // additional options passed to the sub-menu
}
```

See [Sub-Menus](/docs/advanced/sub-menus).

---

### `ctx.complete(result?)`

```ts
complete(result?: unknown): Promise<void>
```

Marks the current sub-menu as complete and calls `goBack()`. The parent's `onComplete` callback fires with `result`. Has no effect if called outside a sub-menu context.

---

## Discord

### `ctx.client`

```ts
client: Client<true>
```

The logged-in Discord.js client.

---

### `ctx.interaction`

```ts
interaction: Interaction
```

The current interaction. On first render this is the `ChatInputCommandInteraction` that opened the session. It updates to the most recent component interaction as the user interacts with the menu.

---

### `ctx.options`

```ts
options: TOptions
```

Options passed to `handleInteraction()` or `goTo()`. Type-safe when `TOptions` is provided as a generic.

---

## Menu metadata

### `ctx.menu`

```ts
menu: MenuInstanceLike
```

| Property | Type | Description |
|---|---|---|
| `ctx.menu.name` | `string` | The menu's registered name |
| `ctx.menu.mode` | `'embeds' \| 'layout'` | The render mode |

---

### `ctx.session`

```ts
session: MenuSessionLike
```

| Property | Type | Description |
|---|---|---|
| `ctx.session.id` | `string` | Unique session identifier |
| `ctx.session.isCancelled` | `boolean` | Whether the session was cancelled |
| `ctx.session.isCompleted` | `boolean` | Whether the session has ended (closed, timed out, or cancelled) |
| `ctx.session.canGoBack` | `boolean` | Whether the navigation stack has entries |
| `ctx.session.sessionState` | `StateStore` | Same as `ctx.sessionState` |

---

### `ctx.pagination`

```ts
pagination: PaginationState | null
```

`null` when no pagination is active. Populated during render when list pagination or button pagination is active.

| Property | Type | Description |
|---|---|---|
| `currentPage` | `number` | Zero-based current page index |
| `totalPages` | `number` | Total number of pages |
| `itemsPerPage` | `number` | Items per page |
| `totalItems` | `number` | Total item count |
| `startIndex` | `number` | Inclusive start offset for the current page |
| `endIndex` | `number` | Exclusive end offset for the current page |

See [Pagination](/docs/advanced/pagination).
