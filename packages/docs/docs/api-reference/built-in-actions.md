---
sidebar_position: 3
---

# Built-in Actions

Action factories are functions that return an `Action` — they can be used directly as a button or select `action` value without writing an inline async callback.

```ts
import { goTo, goBack, closeMenu, openModal, pipeline, guard } from '@flowcord/core';
```

---

## Navigation

### `goTo(menuId, options?)`

```ts
goTo(menuId: string, options?: Record<string, unknown>): Action
```

Navigates to the specified menu. `options` are passed as `ctx.options` in the target menu.

```ts
action: goTo('settings')
action: goTo('edit-item', { itemId: '123' })
```

Equivalent inline form:

```ts
action: async (ctx) => { await ctx.goTo('settings'); }
```

---

### `goBack(result?)`

```ts
goBack(result?: unknown): Action
```

Pops the navigation stack and returns to the previous menu. Passing `result` makes it available in the parent's `onComplete` callback when used in a sub-menu context.

```ts
action: goBack()
action: goBack({ status: 'cancelled' })
```

---

### `closeMenu()`

```ts
closeMenu(): Action
```

Ends the session entirely. Disables all components on the message.

```ts
action: closeMenu()
```

---

### `openModal(modalId?)`

```ts
openModal(modalId?: string): Action
```

Triggers the modal defined via `.setModal()`. Pass a string ID for multi-modal menus; omit it for single-modal menus.

```ts
action: openModal()
action: openModal('edit-details')
```

:::note
Prefer using `opensModal` on the button config over the `openModal()` action. `opensModal` lets FlowCord call `showModal()` on the raw interaction before it is deferred, which is required by Discord. The `openModal()` action is provided for cases where the modal trigger is determined dynamically.
:::

---

## Composition

### `pipeline(...actions)`

```ts
pipeline<TCtx>(...actions: Action<TCtx>[]): Action<TCtx>
```

Composes multiple actions into a single sequential action. Execution stops if any action throws a `GuardFailedError`.

```ts
action: pipeline(
  requireAdmin,
  requireNotDeployed,
  async (ctx) => {
    await db.deploy(ctx.options.regionId as string);
    await ctx.goTo('deploy-success');
  }
)
```

Non-`GuardFailedError` errors propagate normally and are not swallowed.

---

### `guard(predicate, failureMessage)`

```ts
guard<TCtx>(predicate: GuardFn<TCtx>, failureMessage: string): Action<TCtx>
```

Creates an action that checks a condition. If the predicate returns `false`, throws `GuardFailedError` with `failureMessage`. If the predicate returns a non-empty string, that string is used as the message instead.

```ts
const requireAdmin = guard(
  (ctx) => ctx.sessionState.get('isAdmin') === true,
  'You must be an administrator.'
);

const requireFunds = guard(
  async (ctx) => {
    const balance = await db.getBalance(ctx.interaction.user.id);
    const cost = ctx.state.get('cost') as number;
    if (balance < cost) return `Need ${cost} coins, have ${balance}.`;
    return true;
  },
  'Insufficient funds.'
);
```

**`GuardFn` signature:**

```ts
type GuardFn<TCtx> = (ctx: TCtx) => Awaitable<boolean | string>
```

---

## `GuardFailedError`

```ts
class GuardFailedError extends Error {
  readonly isGuardFailure: true;
}
```

Thrown by `guard()` to halt a pipeline. FlowCord catches this in the session, displays the message to the user, and re-renders the current menu. You can also throw it manually from an inline action for the same effect.

---

## Factory form vs inline callbacks

Use factory actions when:
- The logic is shared across multiple buttons or menus (`guard`, `pipeline`)
- The action is a simple navigation step (`goTo`, `goBack`, `closeMenu`)

Use inline async callbacks when:
- The action reads or mutates state before navigating
- The logic is specific to one button and not reusable

Both forms are interchangeable — factory actions return an `Action`, which is the same type as an inline async callback.
