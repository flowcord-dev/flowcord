---
sidebar_position: 3
---

# Project Setup

The Quick Start puts everything in a single file, which is fine for learning but not how you'd structure a real bot. This page covers the key integration points FlowCord needs — how you organize the rest of your project is up to you.

:::note
If you already have an established bot structure or are using a bot framework, skip to the sections that apply to you. FlowCord doesn't impose any particular file layout.
:::

## The three integration points

Regardless of how your bot is organized, FlowCord needs three things wired up:

1. **A `FlowCord` instance** — created once, shared wherever menus are registered or interactions are handled
2. **Menu registration** — each menu factory registered before any interactions arrive
3. **Slash command routing** — slash commands routed to `handleInteraction`

```ts
// 1. Create the instance once
const flowcord = new FlowCord({ client });

// 2. Register menus before the bot goes online
flowcord.registerMenu('weather', (session) => new MenuBuilder(session, 'weather')/* ... */.build());

// 3. Route slash commands
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'weather') {
      await flowcord.handleInteraction(interaction, 'weather');
    }
  }
  // Component interactions (buttons, selects) are handled automatically
  // by the active session's collector — no explicit routing needed.
});
```

How you split these across files — whether you co-locate menu factories with slash command handlers, keep them separate, or use a command framework — is your call.

## Slash command registration

Registering commands with Discord is a separate, one-time operation — not part of your bot's startup. Discord caches registered commands globally, so you only need to re-run registration when your command definitions change.

```ts title="register-commands.ts"
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Check the weather in Cerulean City'),
].map((cmd) => cmd.toJSON());

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

rest
  .put(Routes.applicationCommands(process.env.APP_ID!), { body: commands })
  .then(() => console.log(`Registered ${commands.length} commands`))
  .catch(console.error);
```

Run this once with `npx tsx register-commands.ts`. The commands will appear in Discord within a few seconds.

## Environment variables

Your bot needs at minimum:

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Your bot's token from the Discord Developer Portal |
| `APP_ID` | Your application's ID (needed for command registration) |

:::warning
Never commit bot tokens to version control. Add `.env` to your `.gitignore`.
:::

## FlowCord configuration

Beyond the required `client`, the `FlowCord` constructor accepts:

```ts
const flowcord = new FlowCord({
  client,

  // How long (ms) a session stays open without interaction. Default: 120000 (2 min)
  timeout: 60_000,

  // Custom error handler. Default: replies with an ephemeral error message.
  onError: async (session, error) => {
    console.error(`Session ${session.id} failed:`, error);
  },

  // Log every menu transition to the console. Useful during development.
  enableTracing: process.env.NODE_ENV === 'development',
});
```

## Next steps

With FlowCord integrated into your bot, start with [Menus & Sessions](../core-concepts/menus-and-sessions.md) to build a solid mental model before diving into more advanced features.
