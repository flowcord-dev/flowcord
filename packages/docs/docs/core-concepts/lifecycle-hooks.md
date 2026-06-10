---
sidebar_position: 6
---

# Lifecycle Hooks

FlowCord exposes hooks at every meaningful stage of a menu session. All hooks receive `ctx` as their only argument and can be sync or async — they are awaited sequentially.

## Execution order

```
Menu opens
    │
    ▼
setup()          ← One-time initialization. Runs before onEnter.
    │
    ▼
onEnter          ← Menu entered. Runs on first open and on every return via goBack().
    │
    ▼
┌─── RENDER LOOP ────────────────────────────────────┐
│       │                                             │
│       ▼                                             │
│   beforeRender  ← Before render callbacks run       │
│       │                                             │
│   (setEmbeds / setButtons / setLayout run)          │
│   (Discord message sent or updated)                 │
│       │                                             │
│       ▼                                             │
│   afterRender   ← After message is sent             │
│       │                                             │
│   (Await user interaction)                          │
│       │                                             │
│       ▼                                             │
│   onAction      ← Before the action callback runs   │
│       │                                             │
│   (Action callback executes)                        │
│       │                                             │
│   onNext / onPrevious  ← On pagination              │
│       │                                             │
│   (No navigation → loop back to beforeRender)       │
└────────────────────────────────────────────────────┘
    │
    ▼ (navigation or close)
onCancel         ← If user pressed Cancel (fires before onLeave)
    │
    ▼
onLeave          ← Menu being exited
```

## Hook reference

### `setup(ctx)`

Runs **once per menu instance creation**, before `onEnter`. Use it to initialize `ctx.state` — state starts as an empty object and `setup()` is the only guaranteed initialization point.

When you navigate away and then `goBack()` to a menu **without** `.setPreserveStateOnReturn()`, the menu factory re-runs and a new instance is created — `setup()` fires again. With `.setPreserveStateOnReturn()`, the existing instance is reused and `setup()` is skipped; state is restored from snapshot instead.

```ts
.setup((ctx) => {
  ctx.state.set('page', 1);
  ctx.state.set('filter', 'all');

  // Initialize session state if this is the first menu in the flow
  if (!ctx.sessionState.has('userId')) {
    ctx.sessionState.set('userId', ctx.interaction.user.id);
  }
})

:::note
`setup()` is defined via `.setup(fn)` on the builder, not `.onEnter()`. Unlike the other hooks, it doesn't fire on every entry — only on creation.
:::

### `onEnter(ctx)`

Runs every time the menu is entered — on first open, and again when `goBack()` returns to it (including after a `setPreserveStateOnReturn()` restore). Good for data that should refresh on each visit.

```ts
.onEnter(async (ctx) => {
  // Refresh data from cache on every visit
  const profile = await cache.get(`profile:${ctx.interaction.user.id}`);
  ctx.state.set('profile', profile);
})
```

### `beforeRender(ctx)`

Runs at the start of each render cycle, before `setEmbeds()` / `setButtons()` / `setLayout()` are called. Use it to compute or transform state that the render callbacks will read.

```ts
.beforeRender((ctx) => {
  const items = ctx.state.get('allItems') ?? [];
  const filtered = items.filter(i => i.active);
  ctx.state.set('visibleItems', filtered);
})
```

### `afterRender(ctx)`

Runs after the Discord message has been sent or updated. Suitable for side effects that should happen after the user can see the new state — analytics, logging, external notifications.

```ts
.afterRender(async (ctx) => {
  await analytics.track('menu_rendered', {
    menu: ctx.menu.name,
    userId: ctx.interaction.user.id,
  });
})
```

Avoid mutating `ctx.state` here — the message has already been rendered and changes won't be visible until the next cycle.

### `onAction(ctx)`

Fires **before** the button or select action callback executes, on every user interaction. Useful for cross-cutting concerns like audit logging or rate limiting.

```ts
.onAction(async (ctx) => {
  await auditLog.record({
    user: ctx.interaction.user.id,
    menu: ctx.menu.name,
    action: ctx.interaction.isMessageComponent() ? ctx.interaction.customId : 'unknown',
  });
})
```

### `onNext(ctx)` / `onPrevious(ctx)`

Fire when the user clicks the Next or Previous pagination button. Receive the same `ctx` as other hooks, with `ctx.pagination` reflecting the updated page.

```ts
.onNext((ctx) => {
  console.log(`Moved to page ${ctx.pagination?.currentPage}`);
})
```

### `onLeave(ctx)`

Runs when the menu is being exited — via `goTo()`, `goBack()`, or `close()`. Use it for cleanup or to persist any final state.

```ts
.onLeave(async (ctx) => {
  // Persist unsaved draft before leaving
  if (ctx.state.get('isDirty')) {
    await db.saveDraft(ctx.state.get('form'));
  }
})
```

### `onCancel(ctx)`

Runs when the user presses the Cancel button (added via `.setCancellable()`), immediately before `onLeave`. Use it to distinguish cancellation from a normal exit.

```ts
.onCancel(async (ctx) => {
  await db.deleteDraft(ctx.interaction.user.id);
})
```

## Global hooks

Register a hook that fires for **every** menu in every session. Useful for logging, analytics, or access control that applies across your entire bot.

```ts
flowcord.engine.hookRegistry.register('onEnter', async (ctx) => {
  console.log(`[${ctx.session.id}] Entered: ${ctx.menu.name}`);
});

flowcord.engine.hookRegistry.register('onAction', async (ctx) => {
  metrics.increment('menu.action');
});
```

Global hooks fire **before** the menu-specific hook of the same name. All hooks are awaited sequentially — a slow global hook will delay the menu-specific one.

The available hook names are: `onEnter`, `onLeave`, `onCancel`, `beforeRender`, `afterRender`, `onAction`, `onNext`, `onPrevious`.

:::note
`setup()` cannot be registered as a global hook — it is always menu-specific.
:::
