---
sidebar_position: 2
---

# Sub-Menus

A sub-menu is a menu opened from within another menu, with a completion callback that fires when the sub-menu finishes. The parent menu waits while the sub-menu runs, then resumes when the sub-menu calls `ctx.complete()`.

This is the right pattern when a menu needs to delegate a decision or multi-step flow to a child menu and then act on the result.

## Opening a sub-menu

```ts
action: async (ctx) => {
  await ctx.openSubMenu('select-item', {
    onComplete: async (ctx, result) => {
      ctx.state.set('selectedItem', result);
      // Parent re-renders automatically after onComplete
    },
  });
},
```

`openSubMenu` pushes the sub-menu onto the navigation stack and navigates to it. The second argument is the `SubMenuOptions` object — any keys beyond `onComplete` are passed as `options` to the sub-menu, accessible via `ctx.options`.

```ts
await ctx.openSubMenu('select-item', {
  onComplete: async (ctx, result) => { /* ... */ },
  category: 'weapons', // passed as ctx.options.category in the sub-menu
});
```

## Completing a sub-menu

The sub-menu calls `ctx.complete(result)` to signal it is done and return a value to the parent:

```ts
// In the sub-menu's button action
action: async (ctx) => {
  const selected = ctx.state.get('selected');
  await ctx.complete(selected);
},
```

`ctx.complete(result)` marks the sub-menu as done, then calls `goBack()` to return to the parent. When the parent receives control, `onComplete` fires with the result.

## `complete()` vs `goBack()`

This distinction matters:

- `ctx.complete(result)` — signals successful completion. `onComplete` **is** called.
- `ctx.goBack()` — navigates back without signaling completion. `onComplete` is **not** called.

This means a sub-menu can be dismissed without completing — for example, if the user clicks a Cancel button that calls `goBack()`. The parent returns to its previous state without the `onComplete` side effect.

```ts
// Sub-menu with a Back button via setReturnable()
new MenuBuilder(session, 'pick-item')
  .setReturnable()   // injects a Back button — calls goBack(), onComplete is NOT called
  .setButtons((ctx) => [
    {
      label: 'Confirm',
      style: ButtonStyle.Success,
      action: async (ctx) => {
        await ctx.complete(ctx.state.get('selected'));
      },
    },
  ])
```

## Typing the result

The `result` parameter in `onComplete` is `unknown` by default. Cast it to the expected type in the callback:

```ts
await ctx.openSubMenu('pick-role', {
  onComplete: async (ctx, result) => {
    const roleId = result as string;
    ctx.state.set('roleId', roleId);
  },
});
```

For a stricter approach, define a shared type and assert it:

```ts
type RolePickResult = { roleId: string; roleName: string };

await ctx.openSubMenu('pick-role', {
  onComplete: async (ctx, result) => {
    const { roleId, roleName } = result as RolePickResult;
    ctx.state.set('role', { roleId, roleName });
  },
});
```

## Stack behavior

Sub-menus participate in the navigation stack the same way as regular menus. When `ctx.complete()` calls `goBack()` internally, the sub-menu is popped and the parent resumes. If the sub-menu itself navigates to other menus before completing, those menus are also on the stack and will be popped as the user navigates back.

The `onComplete` callback fires in the context of the parent menu after it has re-entered. This means `ctx.state` in `onComplete` reflects the parent's state, not the sub-menu's.

## Full example

```ts
// Parent menu
new MenuBuilder<ParentState>(session, 'manage-loadout')
  .setTrackedInHistory()
  .setup((ctx) => {
    ctx.state.set('weapon', null);
  })
  .setEmbeds((ctx) => [
    new EmbedBuilder()
      .setTitle('Manage Loadout')
      .setDescription(`Weapon: ${ctx.state.get('weapon') ?? 'None selected'}`),
  ])
  .setButtons((ctx) => [
    {
      label: 'Choose Weapon',
      style: ButtonStyle.Primary,
      action: async (ctx) => {
        await ctx.openSubMenu('pick-weapon', {
          onComplete: async (ctx, result) => {
            ctx.state.set('weapon', result as string);
          },
        });
      },
    },
    {
      label: 'Save',
      style: ButtonStyle.Success,
      action: async (ctx) => {
        await db.saveLoadout(ctx.interaction.user.id, ctx.state.get('weapon'));
        await ctx.close();
      },
    },
  ])
  .build();

// Sub-menu
new MenuBuilder<SubState>(session, 'pick-weapon')
  .setTrackedInHistory()
  .setReturnable() // Back button calls goBack() — onComplete is NOT called
  .setEmbeds(() => [
    new EmbedBuilder().setTitle('Choose a Weapon'),
  ])
  .setButtons((ctx) => [
    {
      label: 'Sword',
      style: ButtonStyle.Secondary,
      action: async (ctx) => { await ctx.complete('sword'); },
    },
    {
      label: 'Bow',
      style: ButtonStyle.Secondary,
      action: async (ctx) => { await ctx.complete('bow'); },
    },
  ])
  .build();
```
