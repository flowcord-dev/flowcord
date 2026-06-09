---
sidebar_position: 4
---

# Layout Mode

Layout mode uses Discord's Components v2 system, which allows richer, more flexible message layouts using display components alongside interactive elements. It is an alternative to embeds mode and cannot be combined with it on the same menu.

## Bot flag requirement

Components v2 messages require the `IsComponentsV2` message flag. FlowCord sets this flag automatically when a menu is in layout mode — no additional intents or manual flags needed.

## Switching to layout mode

Call `.setLayout()` instead of `.setEmbeds()`. This switches the menu to layout mode at compile time — TypeScript will prevent `.setEmbeds()`, `.setButtons()`, and `.setSelectMenu()` from being called on the same builder.

```ts
import { text, section, separator, button, actionRow } from '@flowcord/core';
import { ButtonStyle } from 'discord.js';

new MenuBuilder(session, 'profile')
  .setLayout((ctx) => [
    text(`## ${ctx.state.get('username')}`),
    separator(),
    section({
      text: [text(`Rank: **${ctx.state.get('rank')}**`)],
      accessory: thumbnail({ url: ctx.state.get('avatarUrl') as string }),
    }),
    actionRow([
      button({ label: 'Edit Profile', style: ButtonStyle.Primary, action: goTo('edit-profile') }),
    ]),
  ])
  .build();
```

## Display component helpers

Import helpers from `@flowcord/core`. These return framework component configs — not Discord.js builders. The renderer converts them to Discord API payloads at send time.

### `text(content)`

Renders a text block. Supports markdown.

```ts
text('## Section Title')
text('Some **bold** and _italic_ text.')
```

### `section(opts)`

A section with text content and an accessory (button or thumbnail). **`accessory` is required.**

```ts
section({
  text: [text('Item name'), text('Item description')],
  accessory: thumbnail({ url: 'https://...' }),
})

section({
  text: [text('Confirm this action?')],
  accessory: button({ label: 'Yes', style: ButtonStyle.Success, action: async (ctx) => { /* ... */ } }),
})
```

### `container(opts)`

Groups components together with an optional accent color and spoiler toggle.

```ts
container({
  accentColor: 0x5865f2,
  children: [
    text('Some grouped content'),
    separator(),
    actionRow([/* ... */]),
  ],
})
```

### `separator(opts?)`

A visual divider between components.

```ts
separator()
separator({ divider: true, spacing: 'large' })
```

### `thumbnail(opts)`

An image used as a section accessory.

```ts
thumbnail({ url: 'https://example.com/image.png', description: 'Alt text' })
```

### `mediaGallery(items)`

A media gallery with one or more images or videos.

```ts
mediaGallery([
  { url: 'https://example.com/a.png', description: 'Image A' },
  { url: 'https://example.com/b.png', description: 'Image B' },
])
```

### `file(opts)`

A file attachment display.

```ts
file({ url: 'attachment://report.pdf' })
```

### `actionRow(children)`

A row of buttons and/or select menus. Interactive components must be inside an action row.

```ts
actionRow([
  button({ label: 'Accept', style: ButtonStyle.Success, action: async (ctx) => { /* ... */ } }),
  button({ label: 'Decline', style: ButtonStyle.Danger, action: closeMenu() }),
])
```

### `button(opts)` and `select(opts)`

The `button()` and `select()` helpers create interactive components for use inside `actionRow()` in layout mode. They accept the same properties as their embeds-mode counterparts, minus `fixedPosition` (not applicable in layout mode).

### `paginatedGroup(buttons, options?)`

Marks a set of buttons for framework-managed pagination. The renderer slices the button array per page and creates action rows automatically. Only one `paginatedGroup` per layout is supported.

```ts
paginatedGroup(
  items.map((item) => button({
    label: item.name,
    style: ButtonStyle.Secondary,
    action: async (ctx) => { ctx.state.set('selected', item.id); },
  })),
  { perPage: 10 }
)
```

List pagination via `.setListPagination()` also works in layout mode — `ctx.pagination` is available in the `.setLayout()` callback in the same way as in embeds mode.

## What is unavailable in layout mode

| Feature | Available in layout mode? |
|---|---|
| `.setEmbeds()` | No — use `text()`, `section()`, etc. instead |
| `.setButtons()` | No — use `actionRow([button(...)])` inside `.setLayout()` |
| `.setSelectMenu()` | No — use `actionRow([select(...)])` inside `.setLayout()` |
| `fixedPosition` on buttons | No |
| `.setModal()` | Yes |
| `.setMessageHandler()` | Yes |
| Lifecycle hooks | Yes — all hooks work in layout mode |
| List pagination | Yes |
| Button pagination via `paginatedGroup` | Yes |
| `ctx.pagination` | Yes |
