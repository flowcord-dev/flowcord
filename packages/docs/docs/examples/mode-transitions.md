---
sidebar_position: 11
---

# Mode Transitions

**Slash command:** `/showcase`

A feature showcase demonstrating navigation between an embeds-mode menu and a layout-mode menu in the same session. When FlowCord detects the render mode has changed, it posts a new message of the correct type and deletes the old one.

**Concepts:** [render modes](/docs/core-concepts/render-modes), [embeds mode](/docs/core-concepts/render-modes#embeds-mode), [layout mode](/docs/core-concepts/render-modes#layout-mode), [`setTrackedInHistory()`](/docs/api-reference/menu-builder#settrackedinhistory), [`setReturnable()`](/docs/api-reference/menu-builder#setreturnable)

---

```ts
import { EmbedBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import {
  type FlowCord,
  MenuBuilder,
  goTo,
  text,
  separator,
  container,
  section,
  thumbnail,
  actionRow,
  button,
} from '@flowcord/core';

export const commands = [
  new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('Browse FlowCord features (tests embeds ↔ layout transitions)')
    .toJSON(),
];

interface Feature {
  id: string;
  name: string;
  emoji: string;
  color: number;
  tagline: string;
  description: string;
  highlights: string[];
  thumbnailUrl: string;
}

const features: Feature[] = [
  {
    id: 'navigation',
    name: 'Navigation',
    emoji: '🧭',
    color: 0x5865f2,
    tagline: 'Multi-menu flows with back-stack history',
    description:
      'FlowCord manages a navigation stack so users can move forward and ' +
      'back through menus without you writing any routing logic.',
    highlights: [
      'goTo() pushes a menu onto the session stack',
      'goBack() returns to the previous menu',
      'setTrackedInHistory() / setReturnable() control stack behavior',
      'setFallbackMenu() handles direct deep-links with no prior history',
    ],
    thumbnailUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
  },
  {
    id: 'state',
    name: 'State Management',
    emoji: '💾',
    color: 0x57f287,
    tagline: 'Per-render and per-session typed state',
    description:
      'Two scopes of state let you persist data across a session or keep it local to a single menu render.',
    highlights: [
      'ctx.state — scoped to the current menu, reset on navigation',
      'ctx.session.state — persists for the lifetime of the session',
      'setPreserveStateOnReturn() keeps menu state when navigating back',
      'State is typed via the MenuBuilder TState generic',
    ],
    thumbnailUrl: 'https://cdn.discordapp.com/embed/avatars/1.png',
  },
  {
    id: 'layout',
    name: 'Layout Mode',
    emoji: '🎨',
    color: 0xfee75c,
    tagline: 'Components v2 rendering with display primitives',
    description:
      "setLayout() enables Discord's Components v2 flag and unlocks display components: containers, sections, thumbnails, and more.",
    highlights: [
      'setLayout() replaces setEmbeds() + setButtons()',
      'container(), section(), text(), separator() for rich layouts',
      'section() supports thumbnail or button accessories',
      'paginatedGroup() for framework-managed button pages',
    ],
    thumbnailUrl: 'https://cdn.discordapp.com/embed/avatars/2.png',
  },
  {
    id: 'guards',
    name: 'Guards & Pipelines',
    emoji: '🛡️',
    color: 0xed4245,
    tagline: 'Composable pre-action validation',
    description:
      'guard() lets you block or redirect an action before it runs. pipeline() composes multiple guards and actions into one.',
    highlights: [
      'guard(fn) — throw GuardFailedError to abort with a message',
      'pipeline(guard, action) — compose multiple steps in sequence',
      'Guards receive the full MenuContext for state-aware checks',
      'Pair with ctx.session.state for cross-menu validation',
    ],
    thumbnailUrl: 'https://cdn.discordapp.com/embed/avatars/3.png',
  },
];

export function register(flowcord: FlowCord): void {
  // Menu 1: Feature List — EMBEDS mode
  // Navigating to showcase-detail triggers an embeds → layout transition.
  flowcord.registerMenu('showcase', (session) =>
    new MenuBuilder(session, 'showcase')
      .setEmbeds(() => [
        new EmbedBuilder()
          .setTitle('✨ FlowCord Feature Showcase')
          .setDescription(
            'Select a feature to view its detail page.\n\n' +
              features.map((f) => `**${f.emoji} ${f.name}** — ${f.tagline}`).join('\n'),
          )
          .setColor(0x5865f2)
          .setFooter({ text: 'Detail pages use layout mode (Components v2)' }),
      ])
      .setButtons(() =>
        features.map((f) => ({
          label: `${f.emoji} ${f.name}`,
          style: ButtonStyle.Primary,
          action: goTo('showcase-detail', { featureId: f.id }),
        })),
      )
      .setCancellable()
      .setTrackedInHistory()
      .build(),
  );

  // Menu 2: Feature Detail — LAYOUT mode
  // When the user presses Back, goBack() returns to showcase (embeds mode),
  // triggering the reverse layout → embeds transition.
  flowcord.registerMenu('showcase-detail', (session, options) => {
    const featureId = options?.featureId as string;
    const feature = features.find((f) => f.id === featureId)!;

    return new MenuBuilder(session, 'showcase-detail')
      .setLayout(() => [
        section({
          text: [`# ${feature.emoji} ${feature.name}`, feature.tagline],
          accessory: thumbnail({
            url: feature.thumbnailUrl,
            description: feature.name,
          }),
        }),
        separator({ divider: true }),
        container({
          accentColor: feature.color,
          children: [
            text(feature.description),
            separator({ spacing: 'small' }),
            text('**Highlights:**'),
            ...feature.highlights.map((h) => text(`• ${h}`)),
          ],
        }),
        separator({ spacing: 'small' }),
        actionRow([
          button({
            label: '🔖 Bookmark',
            style: ButtonStyle.Secondary,
            action: async (ctx) => {
              const bookmarks = (ctx.sessionState.get('bookmarks') as string[]) ?? [];
              if (!bookmarks.includes(feature.id)) {
                ctx.sessionState.set('bookmarks', [...bookmarks, feature.id]);
              }
            },
          }),
        ]),
      ])
      .setReturnable()
      .setFallbackMenu('showcase')
      .build();
  });
}
```

---

## Key things to notice

- **FlowCord handles mode transitions automatically.** When navigating from an embeds menu to a layout menu (or vice versa), the renderer detects that the message type must change. It posts a new message of the correct type using `followUp()` on the original command interaction, then deletes the old message.
- **No configuration is required to enable transitions.** Just use `goTo()` / `goBack()` as normal — the framework handles the message swap.
- **The transition is bidirectional.** Pressing Back from the layout detail page returns to the embeds list page. The renderer detects the layout → embeds switch and again posts a new message and deletes the old one.
- **`sessionState` persists across mode transitions.** The Bookmark button on the detail page writes to `ctx.sessionState`. That state is still accessible if the user navigates back and then returns to another detail page in the same session.
- **Spread syntax in layout arrays** — ``...feature.highlights.map((h) => text(`• ${h}`))`` spreads an array of `text()` nodes directly into the container's `children`. Layout arrays accept any mix of component configs.
