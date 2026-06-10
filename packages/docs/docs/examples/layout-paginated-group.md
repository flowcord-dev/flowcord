---
sidebar_position: 12
---

# Layout Paginated Group

**Slash command:** `/explorer`

A solar system explorer demonstrating `paginatedGroup()` — the layout mode equivalent of button pagination. Ten bodies are spread across three pages at four per page, with Next / Previous buttons injected automatically.

**Concepts:** [`paginatedGroup()`](/docs/advanced/layout-mode#paginatedgroupbuttons-options), [button pagination in layout mode](/docs/advanced/pagination#button-pagination), [`container()`](/docs/advanced/layout-mode#containeropts), [`setCancellable()`](/docs/api-reference/menu-builder#setcancellable)

---

```ts
import { ButtonStyle, SlashCommandBuilder } from 'discord.js';
import {
  type FlowCord,
  MenuBuilder,
  text,
  separator,
  container,
  paginatedGroup,
  button,
} from '@flowcord/core';

type ExplorerState = { selectedId: string | null };

interface Body {
  id: string;
  label: string;
  emoji: string;
  type: string;
  description: string;
}

const bodies: Body[] = [
  { id: 'mercury', label: 'Mercury', emoji: '⚫', type: 'Rocky planet',   description: 'Closest planet to the Sun. Extreme temperature swings with no atmosphere to retain heat.' },
  { id: 'venus',   label: 'Venus',   emoji: '🟡', type: 'Rocky planet',   description: 'Hottest planet in the solar system due to its thick CO₂ atmosphere and greenhouse effect.' },
  { id: 'earth',   label: 'Earth',   emoji: '🌍', type: 'Rocky planet',   description: 'The only known planet to harbour life. 71% of the surface is covered by water.' },
  { id: 'mars',    label: 'Mars',    emoji: '🔴', type: 'Rocky planet',   description: 'The Red Planet. Home to Olympus Mons, the tallest volcano in the solar system.' },
  { id: 'jupiter', label: 'Jupiter', emoji: '🟠', type: 'Gas giant',      description: 'Largest planet in the solar system. The Great Red Spot is a storm larger than Earth.' },
  { id: 'saturn',  label: 'Saturn',  emoji: '🪐', type: 'Gas giant',      description: 'Iconic ring system made of ice and rock. Less dense than water.' },
  { id: 'uranus',  label: 'Uranus',  emoji: '🔵', type: 'Ice giant',      description: 'Rotates on its side with an axial tilt of 98°. Has faint rings and 27 known moons.' },
  { id: 'neptune', label: 'Neptune', emoji: '💙', type: 'Ice giant',      description: 'Farthest planet from the Sun. Fastest winds in the solar system at up to 2,100 km/h.' },
  { id: 'pluto',   label: 'Pluto',   emoji: '⚪', type: 'Dwarf planet',   description: 'Reclassified as a dwarf planet in 2006. Has a heart-shaped nitrogen ice plain.' },
  { id: 'moon',    label: 'Moon',    emoji: '🌕', type: "Earth's moon",   description: "Earth's only natural satellite. Stabilizes Earth's axial tilt and drives ocean tides." },
];

export const commands = [
  new SlashCommandBuilder()
    .setName('explorer')
    .setDescription('Browse solar system bodies (paginatedGroup in layout mode)')
    .toJSON(),
];

export function register(flowcord: FlowCord): void {
  flowcord.registerMenu('explorer', (session) =>
    new MenuBuilder<ExplorerState>(session, 'explorer')
      .setLayout((ctx) => {
        const selectedId = ctx.state.get('selectedId') ?? null;
        const selected = bodies.find((b) => b.id === selectedId) ?? null;

        return [
          container({
            accentColor: 0x5865f2,
            children: [
              text('# 🌌 Solar System Explorer'),
              text(
                'Select a body from the paginated list below to view its details.\n' +
                  'Use the **Next** and **Previous** buttons to page through all 10 entries.',
              ),
            ],
          }),
          separator({ divider: true }),
          paginatedGroup(
            bodies.map((b) =>
              button({
                label: `${b.emoji} ${b.label}`,
                style: selectedId === b.id ? ButtonStyle.Primary : ButtonStyle.Secondary,
                action: async (ctx) => {
                  ctx.state.set('selectedId', b.id);
                },
              }),
            ),
            { perPage: 4, stableButtons: true },
          ),
          separator({ spacing: 'small' }),
          selected
            ? container({
                accentColor: 0x57f287,
                children: [
                  text(`## ${selected.emoji} ${selected.label}`),
                  text(`*${selected.type}*`),
                  text(selected.description),
                ],
              })
            : text('*Select a body above to see its details.*'),
        ];
      })
      .setCancellable()
      .build(),
  );
}
```

---

## Key things to notice

- **`paginatedGroup()` wraps a flat array of buttons.** The framework slices the array into pages of `perPage` items and injects Next / Previous action rows automatically. There is no separate pagination config on the builder — just wrap the buttons.
- **`stableButtons: true`** renders Next and Previous even when they are disabled (first page, last page). This keeps the layout height stable across pages so it doesn't shift as the user paginates.
- **Only one `paginatedGroup` per layout is supported.** If you need multiple paginated lists, consider splitting them into separate menus.
- **The detail panel is conditional on `selectedId`.** Until the user selects something, `text()` renders a placeholder. After selection, a `container()` shows the details. Both branches are valid return values for the layout array position — the renderer handles them correctly.
- **Button `style` reflects selection state.** The selected body's button renders as `Primary` (blue); all others stay `Secondary` (grey). This is recalculated on every render since `setLayout()` runs before each send.
- **`paginatedGroup` and list pagination (`setListPagination()`) serve different purposes.** This example uses `paginatedGroup` because the buttons themselves are the items. For displaying a list in embeds with `ctx.pagination` slice control, use `setListPagination()` instead — see [Pagination & Guards](/docs/examples/pagination-and-guards).
