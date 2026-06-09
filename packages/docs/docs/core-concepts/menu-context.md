---
sidebar_position: 2
---

# Menu Context

Every callback in FlowCord — `setup`, `setEmbeds`, `setButtons`, `onEnter`, action handlers, and all other hooks — receives a **context object** (`ctx`). It is the single interface through which your code interacts with the running session.

## Full interface

```ts
interface MenuContext<TState, TSessionState, TOptions> {
  // State
  state: StateAccessor<TState>;
  sessionState: StateStore<TSessionState>;

  // Navigation
  goTo(menuId: string, options?: Record<string, unknown>): Promise<void>;
  goBack(result?: unknown): Promise<void>;
  close(): Promise<void>;
  hardRefresh(): Promise<void>;
  openSubMenu(menuId: string, opts: SubMenuOptions): Promise<void>;
  complete(result?: unknown): Promise<void>;

  // Discord
  client: Client<true>;
  interaction: Interaction;

  // Menu info
  menu: MenuInstanceLike;
  session: MenuSessionLike;
  options: TOptions;
  pagination: PaginationState | null;
}
```

## State

### `ctx.state` — `StateAccessor<TState>`

Menu-local state, scoped to the current menu instance. Typed via the `TState` generic on `MenuBuilder`.

```ts
new MenuBuilder<{ count: number }>(session, 'counter')
  .setup((ctx) => {
    ctx.state.set('count', 0);
  })
  .setButtons((ctx) => [
    {
      label: `Clicked ${ctx.state.get('count')} times`,
      action: async (ctx) => {
        ctx.state.set('count', ctx.state.get('count') + 1);
      },
    },
  ])
  // ...
  .build();
```

State is reset when the menu is recreated (e.g. on `goBack()`), unless the menu opts into `.setPreserveStateOnReturn()`. See [State Management](/docs/core-concepts/state-management) for the full picture.

### `ctx.sessionState` — `StateStore<TSessionState>`

Session-wide state shared across all menus in the current session. Typed via the second generic on `MenuBuilder`.

```ts
new MenuBuilder<MyState, { userId: string }>(session, 'profile')
  .setup((ctx) => {
    const userId = ctx.sessionState.get('userId');
  })
```

Unlike `ctx.state`, session state persists across navigation and is not reset when menus change. See [State Management](/docs/core-concepts/state-management).

## Navigation

### `ctx.goTo(menuId, options?)`

Navigate forward to another registered menu.

```ts
action: async (ctx) => {
  await ctx.goTo('settings', { tab: 'notifications' });
}
```

The `options` object is available in the target menu as `ctx.options`.

### `ctx.goBack(result?)`

Pop the navigation stack and return to the previous menu. If the stack is empty and a fallback menu is configured, navigates there instead. If the stack is empty and no fallback exists, closes the session.

Passing `result` is used in the [sub-menu continuation pattern](/docs/advanced/sub-menus) — the parent's `onComplete` callback receives it.

### `ctx.close()`

End the session immediately. The menu message has its components disabled.

### `ctx.hardRefresh()`

Re-run the menu factory from scratch before the next render. Use this when the menu's structure itself needs to change — for example, when the set of buttons depends on data that has changed externally. For simple state-driven UI changes, just mutate `ctx.state` and let the auto-render handle it.

### `ctx.openSubMenu(menuId, opts)` / `ctx.complete(result?)`

The sub-menu pattern — for parent menus that open a child menu and receive a result back. See [Sub-Menus & Continuations](/docs/advanced/sub-menus).

## Discord

### `ctx.client` — `Client<true>`

The logged-in discord.js `Client` instance. Useful for fetching guild members, channels, or other Discord resources during action callbacks.

### `ctx.interaction` — `Interaction`

The most recent Discord interaction associated with this session. This updates on every user action. Useful if you need to inspect the raw interaction — though in most cases `ctx.state` and `ctx.options` are sufficient.

## Menu info

### `ctx.session` — `MenuSessionLike`

Exposes read-only information about the current session:

```ts
interface MenuSessionLike {
  readonly id: string;               // Unique session ID (12-char)
  readonly sessionState: StateStore; // Same as ctx.sessionState
  readonly isCancelled: boolean;     // True if user pressed Cancel
  readonly isCompleted: boolean;     // True if session has ended
}
```

### `ctx.menu` — `MenuInstanceLike`

Exposes information about the current menu:

```ts
interface MenuInstanceLike {
  readonly name: string;              // Menu name as registered
  readonly mode: 'embeds' | 'layout'; // Active render mode
}
```

### `ctx.options` — `TOptions`

The options object passed when this menu was opened — either from `goTo(menuId, options)` or from the third argument to `flowcord.handleInteraction(interaction, menuId, options)`.

```ts
// Opening with options
await ctx.goTo('item-detail', { itemId: '42', readOnly: true });

// Receiving options in the target menu
new MenuBuilder<State, SessionState, { itemId: string; readOnly: boolean }>(session, 'item-detail')
  .setup((ctx) => {
    const { itemId, readOnly } = ctx.options;
  })
```

At runtime `ctx.options` is always `Record<string, unknown>` — the generic `TOptions` gives you compile-time type safety, but no runtime validation is performed.

### `ctx.pagination` — `PaginationState | null`

Pagination state for the current render cycle. `null` when no pagination is configured. When active:

```ts
interface PaginationState {
  currentPage: number;   // 0-indexed
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;    // Use with Array.slice(startIndex, endIndex)
  endIndex: number;      // Exclusive
}
```

Use `startIndex` and `endIndex` to slice your data array in `setEmbeds` or `setLayout`. See [Pagination](/docs/advanced/pagination).

## TypeScript generics

`MenuBuilder` accepts four generic parameters:

```ts
MenuBuilder<
  TState extends Record<string, unknown>,       // ctx.state type
  TSessionState extends Record<string, unknown>, // ctx.sessionState type
  TCtx extends MenuContext<TState, TSessionState>, // ctx type (for builder subclasses)
  TMode extends 'unset' | 'embeds' | 'layout'   // render mode (enforced at compile time)
>
```

In practice you'll usually only specify the first two:

```ts
type MyState = { count: number; label: string };
type MySessionState = { userId: string };

new MenuBuilder<MyState, MySessionState>(session, 'my-menu')
  .setup((ctx) => {
    // ctx.state.get('count') → number
    // ctx.sessionState.get('userId') → string
  })
```

`TCtx` and `TMode` are inferred automatically unless you're building a custom `MenuBuilder` subclass.
