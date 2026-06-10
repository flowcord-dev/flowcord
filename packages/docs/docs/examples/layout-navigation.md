---
sidebar_position: 10
---

# Layout Navigation

**Slash command:** `/hub`

A two-menu Hub → Category Detail flow demonstrating `goTo()` / `goBack()` navigation in layout mode. The hub lists topic categories; selecting one opens a detail page with a reserved Back button.

**Concepts:** [`setTrackedInHistory()`](/docs/api-reference/menu-builder#settrackedinhistory), [`setReturnable()`](/docs/api-reference/menu-builder#setreturnable), [`goTo()`](/docs/api-reference/built-in-actions), [`goBack()`](/docs/api-reference/context#ctxgobackresult), [`setFallbackMenu()`](/docs/api-reference/menu-builder#setfallbackmenumenuid-options), [`setEphemeral()`](/docs/api-reference/menu-builder#setephemeralephemeral), [navigation](/docs/core-concepts/navigation)

---

```ts
import { ButtonStyle, SlashCommandBuilder } from 'discord.js';
import {
  type FlowCord,
  MenuBuilder,
  goTo,
  text,
  separator,
  container,
  actionRow,
  button,
} from '@flowcord/core';

export const commands = [
  new SlashCommandBuilder()
    .setName('hub')
    .setDescription('Navigate between layout-mode menus')
    .toJSON(),
];

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: number;
  description: string;
  topics: string[];
}

const categories: Category[] = [
  {
    id: 'basics',
    label: 'Basics',
    emoji: '📖',
    color: 0x5865f2,
    description: 'Core FlowCord concepts: menus, sessions, and navigation.',
    topics: [
      'MenuBuilder — define menus with a fluent builder',
      'registerMenu() — attach menus to a FlowCord instance',
      'goTo() / goBack() — navigate the menu stack',
      'setCancellable() — add a reserved Cancel button',
    ],
  },
  {
    id: 'state',
    label: 'State & Hooks',
    emoji: '🔄',
    color: 0x57f287,
    description: 'Per-render state, session state, and lifecycle hooks.',
    topics: [
      'ctx.state — scoped to the current menu render',
      'ctx.session.state — persists across the whole session',
      'onEnter / onLeave — run logic on menu transitions',
      'beforeRender / afterRender — wrap every render cycle',
    ],
  },
  {
    id: 'layout',
    label: 'Layout Mode',
    emoji: '🎨',
    color: 0xfee75c,
    description: 'Components v2 (display components) rendering with rich layout primitives.',
    topics: [
      'setLayout() — replaces setEmbeds() + setButtons()',
      'container() — grouping with optional accent color',
      'section() — text + thumbnail or button accessory',
      'paginatedGroup() — framework-managed button pagination',
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    emoji: '⚙️',
    color: 0xed4245,
    description: 'Guards, behavior policies, and sub-menu continuation.',
    topics: [
      'guard() — conditionally block navigation actions',
      'pipeline() — compose multiple actions in sequence',
      'setPreserveStateOnReturn() — keep state when navigating back',
      'BehaviorConfig — configure ephemeral state and message disposal',
    ],
  },
];

export function register(flowcord: FlowCord): void {
  // Hub — top-level category picker
  flowcord.registerMenu('hub', (session) =>
    new MenuBuilder(session, 'hub')
      .setLayout(() => [
        container({
          accentColor: 0x5865f2,
          children: [
            text('# FlowCord Hub'),
            text(
              'Select a category below to explore FlowCord concepts.\n' +
                'This menu uses **layout mode** with `goTo()` navigation.',
            ),
          ],
        }),
        separator({ divider: true }),
        actionRow(
          categories.map((cat) =>
            button({
              label: `${cat.emoji} ${cat.label}`,
              style: ButtonStyle.Primary,
              action: goTo('hub-detail', { categoryId: cat.id }),
            }),
          ),
        ),
      ])
      .setEphemeral()
      .setCancellable()
      .setTrackedInHistory()
      .build(),
  );

  // Category Detail — shows topics for the selected category
  flowcord.registerMenu('hub-detail', (session, options) => {
    const categoryId = options?.categoryId as string;
    const cat = categories.find((c) => c.id === categoryId)!;

    return new MenuBuilder(session, 'hub-detail')
      .setLayout(() => [
        container({
          accentColor: cat.color,
          children: [
            text(`# ${cat.emoji} ${cat.label}`),
            text(cat.description),
            separator({ divider: true }),
            text('**Topics covered:**'),
            text(cat.topics.map((t) => `• ${t}`).join('\n')),
          ],
        }),
      ])
      .setReturnable()
      .setFallbackMenu('hub')
      .build();
  });
}
```

---

## Key things to notice

- **Navigation works identically in layout mode.** `goTo()`, `goBack()`, `setTrackedInHistory()`, `setReturnable()`, and `setFallbackMenu()` all behave the same way regardless of the render mode.
- **`setTrackedInHistory()` on the hub** means the hub is pushed onto the navigation stack when the user navigates to `hub-detail`. This allows `goBack()` on the detail page to return to it.
- **`setReturnable()` on the detail page** injects the reserved ← Back button. FlowCord places it in a separate action row below the layout content.
- **`setFallbackMenu('hub')` handles direct deep-links.** If `hub-detail` is somehow opened without prior history, Back navigates to `hub` instead of closing the session.
- **`setEphemeral()` on the hub** makes the whole session visible only to the invoking user — since the hub sets this, the ephemeral state carries through to the detail page.
- **`goTo()` as a `button` action** passes `{ categoryId: cat.id }` as options. The target factory reads `options?.categoryId` to know which category to display.
