---
sidebar_position: 5
---

# State Management

FlowCord provides two distinct state containers, each with a different scope and lifetime. Understanding which to use — and when — is key to building menus that behave correctly.

## Menu state — `ctx.state`

`StateAccessor<TState>` is scoped to the current menu instance. It is created fresh each time the menu opens and is discarded when the menu is left (unless state preservation is configured).

```ts
type CounterState = { count: number; lastAction: string };

new MenuBuilder<CounterState>(session, 'counter')
  .setup((ctx) => {
    // Initialize state here — ctx.state starts as an empty object
    ctx.state.set('count', 0);
    ctx.state.set('lastAction', 'none');
  })
  .setEmbeds((ctx) => [
    new EmbedBuilder()
      .setTitle(`Count: ${ctx.state.get('count')}`)
      .setDescription(`Last action: ${ctx.state.get('lastAction')}`),
  ])
  .setButtons(() => [
    {
      label: 'Increment',
      action: async (ctx) => {
        ctx.state.set('count', ctx.state.get('count') + 1);
        ctx.state.set('lastAction', 'increment');
      },
    },
  ])
```

### API

```ts
ctx.state.get('key')               // Get a typed value
ctx.state.set('key', value)        // Set a typed value
ctx.state.merge({ key: value })    // Shallow-merge a partial state object
ctx.state.reset(newState)          // Replace the entire state object
ctx.state.current                  // Readonly snapshot of the full state
```

### Initialization

`ctx.state` starts as an empty object `{}`. The `setup()` hook is the right place to initialize it — `setup()` runs once when the menu is first created, before any rendering.

Do not rely on initial values being present in `setEmbeds()` or `setButtons()` without first setting them in `setup()`.

### State on navigation

By default, menu state is recreated from scratch each time the menu opens — whether it's being opened for the first time or returned to via `goBack()`. `setup()` runs again and state starts empty.

If you want state to be preserved when the user navigates away and returns, call `.setPreserveStateOnReturn()` on the builder. FlowCord will snapshot the state and pagination position when the user leaves, and restore them when `goBack()` returns to the menu — skipping `setup()` entirely.

```ts
new MenuBuilder<BrowseState>(session, 'browse')
  .setPreserveStateOnReturn() // State and pagination restored on goBack()
  .setTrackedInHistory()
  .setup((ctx) => {
    ctx.state.set('filter', 'all');
    ctx.state.set('sortBy', 'name');
  })
```

## Session state — `ctx.sessionState`

`StateStore<TSessionState>` is scoped to the entire session — shared across all menus and persists until the session ends. Use it for data that needs to travel between menus.

```ts
type SessionState = { selectedItemId: string | null; cart: string[] };

new MenuBuilder<{}, SessionState>(session, 'shop')
  .setup((ctx) => {
    if (!ctx.sessionState.has('cart')) {
      ctx.sessionState.set('cart', []);
    }
  })
  .setButtons((ctx) => [
    {
      label: 'Add to Cart',
      action: async (ctx) => {
        const cart = ctx.sessionState.get('cart') ?? [];
        ctx.sessionState.set('cart', [...cart, ctx.sessionState.get('selectedItemId')]);
      },
    },
    {
      label: 'View Cart',
      action: goTo('cart'),
      // 'cart' menu can read ctx.sessionState.get('cart') directly
    },
  ])
```

### API

```ts
ctx.sessionState.get('key')          // Get a value (undefined if not set)
ctx.sessionState.set('key', value)   // Set a value
ctx.sessionState.has('key')          // Check if a key exists
ctx.sessionState.delete('key')       // Remove a key (returns true if it existed)
ctx.sessionState.clear()             // Remove all keys
ctx.sessionState.keys()              // IterableIterator<string> of all keys
ctx.sessionState.size                // Number of stored entries
```

## Choosing between them

| | `ctx.state` | `ctx.sessionState` |
|---|---|---|
| **Scope** | Current menu instance | Entire session |
| **Lifetime** | Reset on navigation (unless preserved) | Lives until session ends |
| **Typing** | `TState` generic on `MenuBuilder` | `TSessionState` generic on `MenuBuilder` |
| **Best used for** | UI state local to this menu | Data that crosses menu boundaries |

A common pattern: initialize session state in the first menu's `setup()`, then read and update it from any subsequent menu.

## External data and caching

`sessionState` is for inter-menu context — passing data between menus in the same flow. It is not a DB cache.

For DB-backed data, querying directly in render callbacks or action handlers is the simplest approach. An external cache (such as `node-cache`) is worth adding when the same data is read frequently across multiple sessions, or when you need explicit invalidation as records change — this is the same pattern discord.js recommends for autocomplete handlers.

Keep `sessionState` and your cache layer separate:

- **`sessionState`** — ephemeral, session-scoped inter-menu context
- **External cache** — cross-session, explicitly invalidatable, backed by your DB

Sessions are in-memory and do not persist across bot restarts — design your session state accordingly.
