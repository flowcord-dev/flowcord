---
sidebar_position: 9
---

# Layout Sections

**Slash command:** `/guide`

A getting-started guide page demonstrating `section()` with thumbnail and link button accessories. Shows how to pair display content with a visual element or an inline link.

**Concepts:** [`section()`](/docs/advanced/layout-mode#sectionopts), [`thumbnail()`](/docs/advanced/layout-mode#thumbnaiopts), [`container()`](/docs/advanced/layout-mode#containeropts), [`text()`](/docs/advanced/layout-mode#textcontent), [`separator()`](/docs/advanced/layout-mode#separatoropts)

---

```ts
import { ButtonStyle, SlashCommandBuilder } from 'discord.js';
import {
  type FlowCord,
  MenuBuilder,
  text,
  separator,
  container,
  section,
  thumbnail,
  button,
  actionRow,
} from '@flowcord/core';

type GuideState = { read: boolean };

export const commands = [
  new SlashCommandBuilder()
    .setName('guide')
    .setDescription('Browse the FlowCord getting started guide (layout sections)')
    .toJSON(),
];

export function register(flowcord: FlowCord): void {
  flowcord.registerMenu('guide', (session) =>
    new MenuBuilder<GuideState>(session, 'guide')
      .setLayout((ctx) => {
        const read = ctx.state.get('read') ?? false;

        return [
          // Section with thumbnail accessory
          section({
            text: [
              '## Getting Started with FlowCord',
              'FlowCord is a lifecycle-driven menu framework for Discord.js.',
            ],
            accessory: thumbnail({
              url: 'https://cdn.discordapp.com/embed/avatars/0.png',
              description: 'FlowCord',
            }),
          }),
          separator({ divider: true }),

          // Plain text() inside a container for content without a visual pairing
          container({
            children: [
              text('**Step 1 — Install**'),
              text('`npm install @flowcord/core`'),
              separator({ spacing: 'small' }),
              text('**Step 2 — Register a menu**'),
              text('Call `flowcord.registerMenu()` with a `MenuBuilder`.'),
            ],
          }),
          separator({ spacing: 'small' }),

          // Section with a link button accessory
          section({
            text: [
              '**Step 3 — Read the docs**',
              'Full API reference and guides on the docs site.',
            ],
            accessory: button({
              label: 'Open Docs',
              style: ButtonStyle.Link,
              url: 'https://flowcord-dev.github.io/flowcord-guide/',
            }),
          }),
          separator({ spacing: 'small' }),

          text(
            read
              ? '✅ Marked as read!'
              : "*Mark this guide as read when you're done.*",
          ),
          actionRow([
            button({
              label: read ? 'Unmark' : 'Mark as Read',
              style: read ? ButtonStyle.Secondary : ButtonStyle.Success,
              action: async (ctx) => {
                ctx.state.set('read', !ctx.state.get('read'));
              },
            }),
          ]),
        ];
      })
      .setCancellable()
      .build(),
  );
}
```

---

## Key things to notice

- **`section()` requires an `accessory`.** The `accessory` field is required — Discord's Components v2 spec mandates it. Use `thumbnail()` for an image, or `button()` for an inline interactive or link element.
- **`thumbnail()` accepts a `description` for accessibility.** The `description` is used as alt text for the image.
- **A link button as a `section` accessory** (`ButtonStyle.Link` with a `url`) places a non-interactive link button inline with the section text, letting users open a URL without leaving the Discord client.
- **`container()` without an accent color** is a plain grouping block — useful for visually separating a block of text from surrounding content without adding a colored border.
- **`section` text accepts plain strings or `text()` helper calls.** Both are valid in the `text` array.
