---
sidebar_position: 2
---

# Select Menus

A select menu is added to a menu in embeds mode via `.setSelectMenu()`. Each menu supports one select menu, which renders in its own action row alongside any buttons.

## Select menu types

Discord provides five select menu types, each letting the user choose from a different domain. Import the appropriate builder from `discord.js`:

| Type | Builder | `values` in `onSelect` |
|---|---|---|
| String | `StringSelectMenuBuilder` | Custom string values you define |
| User | `UserSelectMenuBuilder` | Discord user IDs |
| Role | `RoleSelectMenuBuilder` | Discord role IDs |
| Channel | `ChannelSelectMenuBuilder` | Discord channel IDs |
| Mentionable | `MentionableSelectMenuBuilder` | User or role IDs |

## Basic usage

```ts
import { StringSelectMenuBuilder } from 'discord.js';

.setSelectMenu(() => ({
  builder: new StringSelectMenuBuilder()
    .setPlaceholder('Choose a category...')
    .addOptions([
      { label: 'Fire',  value: 'fire',  emoji: '🔥' },
      { label: 'Water', value: 'water', emoji: '💧' },
      { label: 'Grass', value: 'grass', emoji: '🌿' },
    ]),
  onSelect: async (ctx, values) => {
    ctx.state.set('type', values[0]);
    // Menu re-renders automatically after onSelect completes
  },
}))
```

## The `onSelect` callback

```ts
onSelect: (ctx: MenuContext, values: string[]) => Awaitable<void>
```

`values` is always an array of strings — even if the select menu only allows one selection. Access the selection with `values[0]`:

```ts
onSelect: async (ctx, values) => {
  const selectedId = values[0];
  const selectedUser = await ctx.client.users.fetch(selectedId);
  ctx.state.set('targetUser', selectedUser.username);
}
```

## Select menu properties

| Property | Type | Required | Description |
|---|---|---|---|
| `builder` | `AnySelectMenuBuilder` | Yes | Any of the five Discord.js select builders |
| `onSelect` | `(ctx, values) => Awaitable<void>` | No | Callback fired on selection |
| `id` | `string` | No | Custom component ID — auto-assigned if omitted |
| `behavior` | `InteractionBehavior` | No | Overrides behavior for the single render cycle triggered by this selection. See [Behavior System](/docs/core-concepts/behavior-system) |

Behavior overrides are consumed after the render cycle — they do not persist to subsequent interactions.

## Discord select types in practice

**User select** — lets the user pick a Discord member:

```ts
import { UserSelectMenuBuilder } from 'discord.js';

.setSelectMenu(() => ({
  builder: new UserSelectMenuBuilder()
    .setPlaceholder('Choose a player...'),
  onSelect: async (ctx, values) => {
    const userId = values[0]; // Discord user ID snowflake
    ctx.state.set('targetId', userId);
  },
}))
```

**Role select** — lets the user pick a server role:

```ts
import { RoleSelectMenuBuilder } from 'discord.js';

.setSelectMenu(() => ({
  builder: new RoleSelectMenuBuilder()
    .setPlaceholder('Assign a role...'),
  onSelect: async (ctx, values) => {
    const roleId = values[0];
    const guild = ctx.interaction.guild;
    if (!guild) return;
    const member = await guild.members.fetch(ctx.interaction.user.id);
    await member.roles.add(roleId);
  },
}))
```

## Combining with buttons

A menu can have both a select menu and buttons. They render in separate action rows:

```ts
.setEmbeds(() => [ /* ... */ ])
.setButtons(() => [
  { label: 'Confirm', style: ButtonStyle.Success, action: async (ctx) => { /* ... */ } },
  { label: 'Cancel',  style: ButtonStyle.Danger,  action: closeMenu() },
])
.setSelectMenu(() => ({
  builder: new StringSelectMenuBuilder().addOptions([ /* ... */ ]),
  onSelect: async (ctx, values) => { /* ... */ },
}))
```

:::note
Select menus cannot be combined with **button pagination**. If you need paginated options, use a string select with its own options list, or structure the flow so the user picks from the select and the paginated list is a separate menu.
:::
