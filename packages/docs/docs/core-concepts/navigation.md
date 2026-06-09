---
sidebar_position: 4
---

# Navigation

FlowCord's navigation system lets users move between menus within a session using a LIFO (last-in, first-out) stack. This page covers how to navigate between menus, how history tracking works, and when to use built-in action factories vs inline callbacks.

## Navigation methods

### `ctx.goTo(menuId, options?)`

Navigate to another registered menu. The current menu is left and the target menu opens.

```ts
action: async (ctx) => {
  await ctx.goTo('settings');
}
```

Pass data to the target menu via `options` — available there as `ctx.options`:

```ts
action: async (ctx) => {
  await ctx.goTo('item-detail', { itemId: item.id, readOnly: true });
}
```

### `ctx.goBack(result?)`

Return to the previous menu by popping the navigation stack.

```ts
action: async (ctx) => {
  await ctx.goBack();
}
```

If the stack is empty and the current menu has a fallback configured (via `.setFallbackMenu()`), it navigates there instead. If there's no fallback, the session closes. See [Fallback Menus](/docs/advanced/fallback-menus).

Passing a `result` is used in the [sub-menu continuation pattern](/docs/advanced/sub-menus), where a child menu returns a value to its parent's `onComplete` callback.

### `ctx.close()`

End the session immediately. The message components are disabled.

```ts
action: async (ctx) => {
  await ctx.close();
}
```

### `ctx.hardRefresh()`

Re-run the menu factory and `setup()` from scratch before the next render — resetting state and rebuilding the menu instance entirely.

A normal re-render (after any action that doesn't navigate) just re-runs the render callbacks (`setEmbeds`, `setButtons`, etc.) with the current state intact. `hardRefresh()` goes further: the factory function re-executes and `setup()` runs again, as if the menu was opened for the first time.

Use it when the menu's structure depends on external data that has changed and a state mutation alone isn't enough to reflect the update:

```ts
action: async (ctx) => {
  await db.deleteItem(ctx.state.get('itemId'));
  await ctx.hardRefresh(); // Re-run setup() to reload the item list from DB
}
```

For most state-driven UI changes, a plain state mutation and auto-render is sufficient. Reach for `hardRefresh()` only when you need the factory to re-execute.

## History tracking

The navigation stack only records menus that opt in. Call `.setTrackedInHistory()` on any menu that should be pushable — when you navigate *away* from that menu via `goTo()`, it is pushed onto the stack, allowing `goBack()` to return to it.

```ts
flowcord.registerMenu('pokemon-list', (session) =>
  new MenuBuilder(session, 'pokemon-list')
    .setTrackedInHistory()   // Pushed to stack when user navigates away
    .setButtons((ctx) => [
      { label: 'View Pikachu', action: goTo('pokemon-detail', { id: 'pikachu' }) },
    ])
    .build()
);

flowcord.registerMenu('pokemon-detail', (session) =>
  new MenuBuilder(session, 'pokemon-detail')
    .setTrackedInHistory()   // Pushed to stack when user navigates to a sub-page
    .setReturnable()         // Adds the ← Back button
    .build()
);
```

:::note
`setTrackedInHistory()` affects the menu you're **leaving**, not the one you're entering. When a user clicks a button that calls `goTo('pokemon-detail')`, the *current* menu (`pokemon-list`) is pushed to the stack — if it has `setTrackedInHistory()` set.
:::

### Pass-through menus

Menus without `.setTrackedInHistory()` are not pushed to the stack. This is useful for confirmation dialogs, transient loading states, or any menu that shouldn't appear in the back-navigation path:

```ts
// Confirmation menu — not tracked, so Back skips over it to the previous real menu
flowcord.registerMenu('confirm-delete', (session) =>
  new MenuBuilder(session, 'confirm-delete')
    // No setTrackedInHistory() — pressing Back from the next menu returns to
    // wherever was on the stack before, skipping this confirmation entirely
    .setButtons(() => [
      { label: 'Confirm', style: ButtonStyle.Danger, action: async (ctx) => { /* ... */ await ctx.goTo('result') } },
      { label: 'Cancel', style: ButtonStyle.Secondary, action: goBack() },
    ])
    .build()
);
```

## Built-in action factories

For common navigation patterns, FlowCord exports action factory functions you can assign directly to a button's `action` field instead of writing an inline async callback:

```ts
import { goTo, goBack, closeMenu, openModal } from '@flowcord/core';
```

| Factory | Equivalent to | Usage |
|---|---|---|
| `goTo(menuId, options?)` | `async (ctx) => ctx.goTo(menuId, options)` | Navigate to another menu |
| `goBack(result?)` | `async (ctx) => ctx.goBack(result)` | Return to previous menu |
| `closeMenu()` | `async (ctx) => ctx.close()` | End the session |
| `openModal(id?)` | Opens the modal with the given ID | Trigger a modal |

```ts
.setButtons(() => [
  { label: 'Settings', style: ButtonStyle.Secondary, action: goTo('settings') },
  { label: 'Done',     style: ButtonStyle.Primary,   action: closeMenu() },
])
```

Use factories when the action is purely navigational. Use an inline async callback when you need to do work before or after navigating:

```ts
// Inline: save state, then navigate conditionally
action: async (ctx) => {
  const result = await db.save(ctx.state.get('form'));
  if (result.ok) {
    await ctx.goTo('success');
  } else {
    ctx.state.set('error', result.message);
    // No navigation — menu re-renders with the error state
  }
}
```

## Navigation tracing

During development, you can enable tracing to log every menu transition to the console:

```ts
const flowcord = new FlowCord({ client, enableTracing: true });
```

This prints each `goTo`, `goBack`, and `close` call with the session ID, source menu, and destination. See [Tracing & Debugging](/docs/advanced/tracing-and-debugging) for details on reading trace output.
