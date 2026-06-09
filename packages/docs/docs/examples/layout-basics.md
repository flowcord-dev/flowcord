---
sidebar_position: 8
---

# Layout Basics

**Slash command:** `/panel`

A simple info panel that introduces [layout mode](/docs/core-concepts/render-modes#layout-mode) as an alternative to embeds mode. Demonstrates the core display component helpers and how button interactions work inside a Components v2 message.

**Concepts:** [layout mode](/docs/advanced/layout-mode), [`setLayout()`](/docs/api-reference/menu-builder#setlayoutfn--layout-mode), [`text()`](/docs/advanced/layout-mode#textcontent), [`separator()`](/docs/advanced/layout-mode#separatoropts), [`container()`](/docs/advanced/layout-mode#containeropts), [`actionRow()`](/docs/advanced/layout-mode#actionrowchildren), [`button()`](/docs/advanced/layout-mode#buttonopts-and-selectopts), [`setCancellable()`](/docs/api-reference/menu-builder#setcancellable)

---

```ts
import { ButtonStyle, SlashCommandBuilder } from 'discord.js';
import {
  type FlowCord,
  MenuBuilder,
  text,
  separator,
  container,
  actionRow,
  button,
} from '@flowcord/core';

type PanelState = {
  pings: number;
};

export const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Open the FlowCord example info panel (layout mode)')
    .toJSON(),
];

export function register(flowcord: FlowCord): void {
  flowcord.registerMenu('panel', (session) =>
    new MenuBuilder<PanelState>(session, 'panel')
      .setLayout((ctx) => {
        const pings = ctx.state.get('pings') ?? 0;

        return [
          container({
            accentColor: 0x5865f2,
            children: [
              text('# FlowCord Example Bot'),
              text(
                'A demo bot showcasing the FlowCord menu framework.\n' +
                  'This panel is rendered in **layout mode** (Components v2).',
              ),
              separator({ divider: true }),
              text('**Available example commands:**'),
              text(
                '`/weather`  — Example 01: quickstart (embeds mode)\n' +
                  '`/cookbook` — Example 02: multi-menu navigation\n' +
                  '`/workout`  — Example 03: state & lifecycle\n' +
                  '`/party`    — Example 04: sub-menu continuation\n' +
                  '`/event`    — Example 05: selects & modals\n' +
                  '`/shop`     — Example 06: pagination & guards',
              ),
            ],
          }),
          separator({ spacing: 'small' }),
          text(
            pings === 0
              ? '*Click Ping to test button interactions in layout mode.*'
              : `Pong! You've pinged **${pings}** time${pings === 1 ? '' : 's'}.`,
          ),
          actionRow([
            button({
              label: 'Ping',
              style: ButtonStyle.Primary,
              action: async (ctx) => {
                const prev = ctx.state.get('pings') ?? 0;
                ctx.state.set('pings', prev + 1);
              },
            }),
            button({
              label: 'Reset',
              style: ButtonStyle.Secondary,
              disabled: pings === 0,
              action: async (ctx) => {
                ctx.state.set('pings', 0);
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

- **`setLayout()` replaces both `setEmbeds()` and `setButtons()`.** In layout mode, buttons are composed directly into the layout tree inside `actionRow()`. There is no separate buttons callback.
- **`container()` groups content with an optional accent color.** The accent appears as a colored left border on the message. Any display component can be a child of a container.
- **`separator()` takes an optional `spacing` and `divider` flag.** `divider: true` renders a visible horizontal line; without it, `separator` is a spacing-only gap. `spacing` accepts `'small'` or `'large'`.
- **Button actions work identically to embeds mode.** Mutating `ctx.state` triggers a re-render — the `pings` counter updates on every click without any extra wiring.
- **`setCancellable()` works in layout mode.** FlowCord injects the reserved Cancel button into a separate action row below the layout content.
