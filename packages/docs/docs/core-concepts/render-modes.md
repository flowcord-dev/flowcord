---
sidebar_position: 3
---

# Render Modes

Every FlowCord menu renders in one of two modes: **embeds mode** or **layout mode**. The choice is made per menu and is mutually exclusive — you can't mix the two within a single menu definition.

## Embeds mode

The default and most broadly compatible mode. Uses Discord's traditional embed + action row model.

```ts
new MenuBuilder(session, 'profile')
  .setEmbeds((ctx) => [
    new EmbedBuilder()
      .setTitle(ctx.state.get('username'))
      .setDescription('Level 42 Trainer')
      .setColor(0x5865f2),
  ])
  .setButtons((ctx) => [
    { label: 'Edit Bio', style: ButtonStyle.Primary, action: async (ctx) => { /* ... */ } },
    { label: 'View Badges', style: ButtonStyle.Secondary, action: goTo('badges') },
  ])
  .build()
```

**Builder methods available in embeds mode:**
- `setEmbeds(fn)` — one or more `EmbedBuilder` instances per render
- `setButtons(fn, options?)` — buttons with optional pagination
- `setSelectMenu(fn)` — a single select menu (any Discord.js select type)

## Layout mode

Uses [Discord Components v2](https://discord.com/developers/docs/components/overview), which allows richer, more structured layouts using display components like text blocks, sections, containers, and media galleries. Discord sends this with the `IsComponentsV2` message flag.

```ts
import { text, section, container, button, separator } from '@flowcord/core';

new MenuBuilder(session, 'item-shop')
  .setLayout((ctx) => [
    container({
      accentColor: 0x5865f2,
      children: [
        text('## Item Shop'),
        separator({ divider: true }),
        section({
          text: [text('**Iron Sword** — 150 coins')],
          accessory: button({
            label: 'Buy',
            style: ButtonStyle.Success,
            action: async (ctx) => { /* ... */ },
          }),
        }),
      ],
    }),
  ])
  .build()
```

**Builder methods available in layout mode:**
- `setLayout(fn)` — returns an array of component configs built with the display component helpers
- Interactive components (`button()`, `select()`, `actionRow()`, `paginatedGroup()`) are composed directly into the layout tree

See [Layout Mode](/docs/advanced/layout-mode) for the full display component reference.

## Mutual exclusivity

Calling both `setEmbeds()` and `setLayout()` on the same builder is a compile-time error — TypeScript narrows the builder's `TMode` generic when you call either method, making the other unavailable.

```ts
new MenuBuilder(session, 'example')
  .setEmbeds(() => [...])  // TMode narrows to 'embeds'
  .setLayout(() => [...])  // ❌ TypeScript error — setLayout not available in embeds mode
```

If you somehow bypass the type system, `.build()` will throw at runtime as a safety net.

## Choosing a mode

| | Embeds mode | Layout mode |
|---|---|---|
| **Discord client support** | All clients | Newer clients (Components v2) |
| **Embeds** | `EmbedBuilder` | Not available |
| **Buttons** | `setButtons()` with pagination | `button()` composed into layout |
| **Select menus** | `setSelectMenu()` | `select()` composed into layout |
| **Display components** | Not available | `text()`, `section()`, `container()`, `separator()`, `thumbnail()`, `mediaGallery()`, `file()` |
| **Button pagination** | `setButtons(..., { pagination })` | `paginatedGroup()` |
| **List pagination** | `setListPagination()` | `setListPagination()` |
| **Modals** | `setModal()` | `setModal()` |

**Reach for embeds mode when:**
- You want broad Discord client compatibility
- Your UI is primarily information-dense embeds
- You need the button pagination system

**Reach for layout mode when:**
- You want rich structured layouts (sections with accessories, nested containers, media)
- You're comfortable with Components v2's client requirements
- Your UI is more compositional than embed-centric

Both modes support lifecycle hooks, navigation, state, modals, and list pagination identically.
