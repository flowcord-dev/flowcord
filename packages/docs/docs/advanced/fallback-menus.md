---
sidebar_position: 5
---

# Fallback Menus

By default, calling `goBack()` when the navigation stack is empty closes the session. A fallback menu changes this behaviour: instead of closing, FlowCord navigates to the specified menu.

## When you need a fallback menu

A menu that can be reached directly — via a slash command — has no parent on the navigation stack when the user presses Back. Without a fallback, Back closes the session. With a fallback, it navigates to a known parent instead.

This is common when a menu is reachable via both a direct command and as a child of another menu:

- Via `/settings permissions` → opened directly, no parent
- Via the `Settings` menu → `Permissions` → has a parent on the stack

In both cases, pressing Back from `Permissions` should return to `Settings`. The fallback makes that work regardless of how the user arrived.

## Configuring a fallback menu

Call `.setFallbackMenu(menuId)` on the builder:

```ts
new MenuBuilder(session, 'permissions')
  .setTrackedInHistory()
  .setReturnable()
  .setFallbackMenu('settings') // goBack() with empty stack → go to 'settings'
  .setEmbeds(/* ... */)
  .setButtons(/* ... */)
  .build();
```

Pass options to the fallback menu as the second argument:

```ts
.setFallbackMenu('settings', { tab: 'permissions' })
```

These options are passed as `ctx.options` in the fallback menu, the same as navigation options from `goTo()`.

## How it interacts with the stack

`setFallbackMenu` only activates when `goBack()` is called and the stack is empty. If the user arrived at the menu via normal navigation (i.e., another menu is on the stack), `goBack()` pops the stack as usual and the fallback is not used.

```
User clicks /permissions
  → Stack is empty
  → User clicks Back
  → Stack still empty → navigate to 'settings' (fallback)

User navigates: settings → permissions
  → Stack: ['settings']
  → User clicks Back
  → Stack has 'settings' → pop and return to 'settings' (normal goBack)
```

In both cases the user ends up at `settings`, but via different mechanisms.

:::note
`setFallbackMenu` requires `setReturnable()` to be set as well — otherwise no Back button is rendered and there is no way for the user to trigger the fallback.
:::
