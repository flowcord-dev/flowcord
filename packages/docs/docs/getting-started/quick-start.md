---
sidebar_position: 2
---

# Quick Start

This guide walks through building a working interactive menu from scratch. By the end, you'll have a `/weather` slash command that displays an embed and responds to button clicks.

## What we're building

A menu that shows the current weather for a fictional city. The user can click **Refresh** to get a new reading, or **Close** to dismiss it. The menu updates in-place on every button click — no new messages, no collectors to manage.

## Step 1: Create the bot client and FlowCord instance

```ts
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
} from 'discord.js';
import { FlowCord, MenuBuilder, closeMenu } from '@flowcord/core';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });
```

`FlowCord` takes the discord.js `Client` as its only required config option. It uses it internally to route component interactions back to the right session.

## Step 2: Define a menu

```ts
// Some fake data to display
const weatherConditions = ['☀️ Sunny', '🌧️ Rainy', '⛈️ Stormy', '🌤️ Partly Cloudy', '❄️ Snowy'];

function getRandomWeather() {
  const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const temp = Math.floor(Math.random() * 35) + 5; // 5–40°C
  return { condition, temp };
}

flowcord.registerMenu('weather', (session) =>
  new MenuBuilder(session, 'weather')
    .setup((ctx) => {
      // setup() runs once when the menu is first opened.
      // Use it to initialize state.
      const weather = getRandomWeather();
      ctx.state.set('condition', weather.condition);
      ctx.state.set('temp', weather.temp);
    })
    .setEmbeds((ctx) => [
      // setEmbeds() runs on every render cycle.
      // It reads the current state and builds the Discord embed.
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
          // Mutate state. FlowCord re-renders the menu automatically.
          const weather = getRandomWeather();
          ctx.state.set('condition', weather.condition);
          ctx.state.set('temp', weather.temp);
        },
      },
      {
        label: 'Close',
        style: ButtonStyle.Secondary,
        action: closeMenu(),
      },
    ])
    .setCancellable() // Adds a system-level Cancel button
    .build()
);
```

A few things to notice:

- **`setup()` vs `setEmbeds()`** — `setup()` is a one-time initialization hook. `setEmbeds()` is called on every render. Keep expensive operations in `setup()`, not in the render callback.
- **Auto re-render** — After a button action runs, FlowCord automatically re-renders the menu. You don't call `message.edit()` yourself. Just mutate `ctx.state` and return.
- **`closeMenu()`** — A built-in action factory that ends the session cleanly. You can also call `ctx.close()` inside an async action if you need conditional close logic.

## Step 3: Wire up the interaction handler

```ts
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'weather') {
      // Starts a new FlowCord session for this user
      await flowcord.handleInteraction(interaction, 'weather');
    }
  }
  // Component interactions (buttons, selects) are handled automatically
  // by the active session's collector — no explicit routing needed.
});
```

Only slash commands need to be explicitly routed. When a session starts, FlowCord attaches a collector to the rendered message that listens for component interactions from that user. Button clicks are picked up and processed automatically without any additional handling in your `interactionCreate` listener.

## Step 4: Login

```ts
client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

## Step 5: Register the slash command

Before the `/weather` command appears in Discord, you need to register it with the Discord API. This is a one-time operation — see [Project Setup](./project-setup.md) for how to structure this properly. For now, a quick script:

```ts
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

const commands = [
  new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Check the weather in Cerulean City')
    .toJSON(),
];

rest
  .put(Routes.applicationCommands(process.env.APP_ID!), { body: commands })
  .then(() => console.log('Slash commands registered'))
  .catch(console.error);
```

Run this once with `npx tsx register-commands.ts`, then start your bot. The `/weather` command will appear within a few seconds.

## What you have

At this point you have a fully working interactive menu:

- A Discord embed rendered from typed state
- Buttons that mutate state and trigger re-renders
- Session lifecycle managed automatically (timeout, cleanup)
- A `Cancel` button from `.setCancellable()`

From here, see [Project Setup](./project-setup.md) to learn how to structure a real multi-command bot, or jump into [Core Concepts](../core-concepts/menus-and-sessions.md) to understand the system more deeply.
