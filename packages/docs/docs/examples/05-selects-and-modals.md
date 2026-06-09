---
sidebar_position: 6
---

# Select Menus & Modals

**Slash command:** `/event`

An event planner with two menus: the first uses a select menu to pick a theme, the second uses two modals — one to create event details and one to edit them.

**Concepts:** [select menus](/docs/components/select-menus), [modals](/docs/components/modals), [opensModal](/docs/components/buttons#modal-trigger-buttons), [session state](/docs/core-concepts/state-management#session-state--ctxsessionstate)

---

```ts
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  FlowCord,
  MenuBuilder,
  goTo,
  closeMenu,
} from '@flowcord/core';

type ThemePickerState = { selectedTheme: string | null };
type EventSessionState = { eventTheme: string };
type EventDetailsState = {
  name: string | null;
  description: string | null;
  maxGuests: string | null;
  theme: string | null;
};

const themes = [
  { label: '🎃 Halloween Bash', value: 'halloween', color: 0xff6600 },
  { label: '🎄 Winter Wonderland', value: 'winter', color: 0x00bfff },
  { label: '🌴 Tropical Luau', value: 'tropical', color: 0x00cc66 },
  { label: '🚀 Space Odyssey', value: 'space', color: 0x6600cc },
  {
    label: '🎭 Masquerade Ball',
    value: 'masquerade',
    color: 0xcc0066,
  },
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Menu 1: Theme Picker (Select Menu)
// ---------------------------------------------------------------------------
flowcord.registerMenu('event', (session) =>
  new MenuBuilder<ThemePickerState, EventSessionState>(
    session,
    'event',
  )
    .setup((ctx) => {
      ctx.state.set('selectedTheme', null);
    })

    .setEmbeds((ctx) => {
      const selected = ctx.state.get('selectedTheme');
      const theme = themes.find((t) => t.value === selected);

      return [
        new EmbedBuilder()
          .setTitle('🎉 Event Planner')
          .setDescription(
            selected
              ? `You selected: **${theme?.label}**\n\nPress "Plan Event" to fill in the details.`
              : 'Choose a theme for your event from the dropdown below.',
          )
          .setColor(theme?.color ?? 0x95a5a6),
      ];
    })

    .setSelectMenu(() => ({
      builder: new StringSelectMenuBuilder()
        .setPlaceholder('🎨 Choose a theme...')
        .addOptions(
          themes.map((t) => ({ label: t.label, value: t.value })),
        ),
      onSelect: async (ctx, values) => {
        ctx.state.set('selectedTheme', values[0]);
        // Store in session state so the next menu can read it
        ctx.sessionState.set('eventTheme', values[0]);
        // Menu re-renders automatically after onSelect
      },
    }))

    .setButtons((ctx) => [
      {
        label: 'Plan Event',
        style: ButtonStyle.Primary,
        disabled: !ctx.state.get('selectedTheme'),
        action: goTo('event-details'),
      },
    ])
    .setCancellable()
    .setTrackedInHistory()
    .build(),
);

// ---------------------------------------------------------------------------
// Menu 2: Event Details (Two Modals)
// ---------------------------------------------------------------------------
flowcord.registerMenu('event-details', (session) =>
  new MenuBuilder<EventDetailsState, EventSessionState>(
    session,
    'event-details',
  )
    .setup((ctx) => {
      ctx.state.set('name', null);
      ctx.state.set('description', null);
      ctx.state.set('maxGuests', null);
      // Read theme from session state (set in the previous menu)
      ctx.state.set(
        'theme',
        ctx.sessionState.get('eventTheme') ?? null,
      );
    })

    .setEmbeds((ctx) => {
      const name = ctx.state.get('name');
      const theme = themes.find(
        (t) => t.value === ctx.state.get('theme'),
      );

      if (!name) {
        return [
          new EmbedBuilder()
            .setTitle('📝 Event Details')
            .setDescription(
              `Theme: **${theme?.label ?? 'None'}**\n\nClick "Fill Details" to enter your event information.`,
            )
            .setColor(theme?.color ?? 0x95a5a6),
        ];
      }

      return [
        new EmbedBuilder()
          .setTitle(`🎉 ${name}`)
          .setDescription(
            ctx.state.get('description') ??
              'No description provided.',
          )
          .addFields(
            {
              name: '🎨 Theme',
              value: theme?.label ?? 'None',
              inline: true,
            },
            {
              name: '👥 Max Guests',
              value: ctx.state.get('maxGuests') ?? 'Unlimited',
              inline: true,
            },
          )
          .setColor(theme?.color ?? 0x2ecc71)
          .setFooter({
            text: 'Click "Edit Details" to modify, or "Confirm" to finalize.',
          }),
      ];
    })

    // Two modals — each with a unique id matched by opensModal on the buttons below
    // ModalBuilder.addComponents() setup is omitted below for brevity.
    // See discord.js docs for TextInputBuilder configuration and the full
    // source in flowcord-core/examples/ for a complete runnable version.
    .setModal((ctx) => [
      {
        id: 'create-event',
        builder: new ModalBuilder().setTitle('Create Event'), // + addComponents(...)
        onSubmit: async (ctx, fields) => {
          ctx.state.set(
            'name',
            fields.getTextInputValue('event-name'),
          );
          ctx.state.set(
            'description',
            fields.getTextInputValue('event-description') || null,
          );
          ctx.state.set(
            'maxGuests',
            fields.getTextInputValue('event-max-guests') || null,
          );
          // Menu re-renders automatically after onSubmit
        },
      },
      {
        id: 'edit-event',
        builder: new ModalBuilder().setTitle('Edit Event'), // + addComponents(...)
        onSubmit: async (ctx, fields) => {
          ctx.state.set(
            'name',
            fields.getTextInputValue('event-name'),
          );
          ctx.state.set(
            'description',
            fields.getTextInputValue('event-description') || null,
          );
          ctx.state.set(
            'maxGuests',
            fields.getTextInputValue('event-max-guests') || null,
          );
        },
      },
    ])

    .setButtons((ctx) => {
      const hasName = ctx.state.get('name') !== null;

      if (!hasName) {
        return [
          {
            label: '📝 Fill Details',
            style: ButtonStyle.Primary,
            opensModal: 'create-event', // Matches the modal id above
          },
        ];
      }

      return [
        {
          label: '✏️ Edit Details',
          style: ButtonStyle.Secondary,
          opensModal: 'edit-event', // Opens the second modal
        },
        {
          label: '✅ Confirm Event',
          style: ButtonStyle.Success,
          action: closeMenu(),
        },
      ];
    })

    .setReturnable()
    .build(),
);

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'event') {
      await flowcord.handleInteraction(interaction, 'event');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () =>
  console.log(`Logged in as ${client.user?.tag}`),
);
client.login(process.env.DISCORD_BOT_TOKEN);
```

---

## Key things to notice

- **`onSelect` re-renders automatically.** After the callback returns, FlowCord re-runs `setEmbeds` and `setButtons` — the embed updates to show the chosen theme without any extra navigation.
- **Session state carries the theme forward.** The select menu stores the selection in `ctx.sessionState`. When the user navigates to `event-details`, `setup()` reads it from `ctx.sessionState` into local state, so the embed can display it.
- **Two modals share one `.setModal()` call.** Returning an array with distinct `id` values lets the buttons choose which modal to open via `opensModal: 'create-event'` or `opensModal: 'edit-event'`.
- **Buttons change based on state.** Before the form is filled, only the "Fill Details" button is shown. After, the "Edit Details" and "Confirm" buttons replace it. `setButtons` re-runs on every render cycle, so this conditional logic works naturally.
- **`ModalBuilder` configuration is condensed here** — refer to the [discord.js docs](https://discord.js.org/docs/packages/discord.js/main/ModalBuilder:Class) and the full source in [`examples/05-selects-and-modals.ts`](https://github.com/flowcord-dev/flowcord-core/blob/main/examples/05-selects-and-modals.ts) for the complete input rows.
