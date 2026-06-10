---
sidebar_position: 2
---

# Quick Start

**Slash command:** `/weather`

The minimum code needed to get a FlowCord menu working. A single menu shows fictional weather data and lets the user refresh it.

**Concepts:** [FlowCord class](/docs/api-reference/flowcord-class), [MenuBuilder](/docs/api-reference/menu-builder), [state](/docs/core-concepts/state-management), [lifecycle hooks — setup](/docs/core-concepts/lifecycle-hooks)

---

```ts
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
} from 'discord.js';
import { FlowCord, MenuBuilder, closeMenu } from '@flowcord/core';

// --- Fake data ---
const weatherConditions = ['☀️ Sunny', '🌧️ Rainy', '⛈️ Stormy', '🌤️ Partly Cloudy', '❄️ Snowy'];

function getRandomWeather() {
  const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const temp = Math.floor(Math.random() * 35) + 5;
  return { condition, temp };
}

// --- Bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// --- Register the menu ---
flowcord.registerMenu('weather', (session) =>
  new MenuBuilder(session, 'weather')
    .setup((ctx) => {
      // setup() runs once when the menu is created — initialize state here
      const weather = getRandomWeather();
      ctx.state.set('condition', weather.condition);
      ctx.state.set('temp', weather.temp);
    })
    .setEmbeds((ctx) => [
      new EmbedBuilder()
        .setTitle('🌍 Weather Report — Cerulean City')
        .setDescription(
          `**Condition:** ${ctx.state.get('condition')}\n` +
          `**Temperature:** ${ctx.state.get('temp')}°C`
        )
        .setColor(0x3498db)
        .setFooter({ text: 'Press Refresh to check again' })
        .setTimestamp(),
    ])
    .setButtons(() => [
      {
        label: '🔄 Refresh',
        style: ButtonStyle.Primary,
        action: async (ctx) => {
          const weather = getRandomWeather();
          ctx.state.set('condition', weather.condition);
          ctx.state.set('temp', weather.temp);
          // No navigation — menu re-renders automatically with new state
        },
      },
      {
        label: 'Close',
        style: ButtonStyle.Secondary,
        action: closeMenu(),
      },
    ])
    .setCancellable()
    .build()
);

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'weather') {
      await flowcord.handleInteraction(interaction, 'weather');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.DISCORD_BOT_TOKEN);
```

---

## Key things to notice

- **`setup()` runs once.** State is initialized here and persists across re-renders. The Refresh button mutates state and the menu updates — without any navigation.
- **Returning from an action re-renders.** After `action` completes, FlowCord re-runs `setEmbeds` and `setButtons` automatically. You never need to call render manually.
- **`closeMenu()` is a factory.** It returns an `Action` — the same type as an inline async callback. Both forms are interchangeable.
- **`setCancellable()` injects a Cancel button** into the reserved action row alongside the Refresh and Close buttons.
