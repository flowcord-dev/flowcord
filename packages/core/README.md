<p align="center">
  <img src="https://img.shields.io/npm/v/@flowcord/core?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white" alt="discord.js v14" />
  <img src="https://img.shields.io/badge/license-Apache%202.0-green?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

# FlowCord

**Lifecycle-driven interactive menu framework for Discord.js**

FlowCord replaces the boilerplate of managing component collectors, interaction state, and multi-step flows with a declarative, builder-based API. Define menus as self-contained units with embeds, buttons, selects, and modals — FlowCord handles the interaction loop, navigation stack, pagination, and session lifecycle automatically.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Examples](#examples)
- [Testing](#testing)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Declarative menu definitions** — Use the fluent `MenuBuilder` API to define embeds, buttons, selects, and modals in one place
- **Automatic interaction loop** — FlowCord manages the render → await → dispatch cycle; no manual collectors needed
- **Navigation stack** — Built-in `goTo()`, `goBack()`, and `closeMenu()` with automatic history tracking
- **Typed menu + session state** — Per-menu `StateAccessor<TState>` and strongly-typed `StateStore<TSessionState>` for cross-menu data
- **Lifecycle hooks** — `onEnter`, `onLeave`, `beforeRender`, `afterRender`, `onAction`, `onCancel`, and pagination hooks
- **Button & list pagination** — Automatic page splitting with configurable items per page
- **Sub-menus & continuations** — Parent–child menu patterns with typed result passing via `openSubMenu()` and `complete()`
- **Guards & pipelines** — Composable action middleware for permission checks and validation
- **Modal support** — Single or multiple modals per menu with automatic re-rendering after submission
- **Dual render modes** — Traditional embeds + action rows, or Discord Components v2 layouts via `setLayout()`
- **Ephemeral menu support** — Per-menu or session-wide ephemeral control, with configurable transition handling between ephemeral and non-ephemeral menus
- **Behavior policy system** — Configurable defaults and overrides at global, session, builder, and per-interaction levels for `ephemeral`, `messageCleanup`, and more; extensible to future behaviors
- **Session timeout** — Configurable inactivity timeout with automatic cleanup and a customizable timeout message
- **Navigation tracing** — Optional debug tracing of all menu transitions

---

## Installation

> **This package is currently in alpha.** The API may change between releases.

```bash
npm install @flowcord/core@next discord.js
```

> **Peer dependency**: FlowCord requires **discord.js v14.x** or later.

Once a stable release is published, the `@next` tag will no longer be needed.

---

## Quick Start

Get a bot with an interactive menu running in under 5 minutes.

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

// Register a simple menu
flowcord.registerMenu('hello', (session) =>
  new MenuBuilder(session, 'hello')
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('👋 Hello!')
        .setDescription('Welcome to FlowCord. Click a button below.')
        .setColor(0x5865f2),
    ])
    .setButtons(() => [
      {
        label: 'Say Hi',
        style: ButtonStyle.Primary,
        action: async (ctx) => {
          ctx.state.set('greeted', true);
          // Menu re-renders automatically after action
        },
      },
      {
        label: 'Close',
        style: ButtonStyle.Danger,
        action: closeMenu(),
      },
    ])
    .setCancellable()
    .build(),
);

// Route interactions
client.on('interactionCreate', async (interaction) => {
  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === 'hello'
  ) {
    await flowcord.handleInteraction(interaction, 'hello');
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

That's it! The `/hello` command will display an embed with two buttons. FlowCord handles the interaction collector, re-rendering, and session cleanup automatically.

---

## Documentation

Full guides and the API reference live at **[flowcord.dev](https://flowcord.dev)**.

**Core concepts**

- [Menus & Sessions](https://flowcord.dev/docs/core-concepts/menus-and-sessions) — the `FlowCord` instance, menu factories, and the session lifecycle
- [Menu Context](https://flowcord.dev/docs/core-concepts/menu-context) — the `ctx` object passed to every callback
- [Navigation](https://flowcord.dev/docs/core-concepts/navigation) — `goTo()`, `goBack()`, history tracking, and built-in action factories
- [State Management](https://flowcord.dev/docs/core-concepts/state-management) — typed menu-local and session-wide state
- [Lifecycle Hooks](https://flowcord.dev/docs/core-concepts/lifecycle-hooks) — every hook and when it fires
- [Render Modes](https://flowcord.dev/docs/core-concepts/render-modes) — embeds mode vs Components v2 layout mode
- [Behavior System](https://flowcord.dev/docs/core-concepts/behavior-system) — ephemeral replies, message cleanup, timeout messages, and the resolution hierarchy

**Components** — [Buttons](https://flowcord.dev/docs/components/buttons) · [Select Menus](https://flowcord.dev/docs/components/select-menus) · [Modals](https://flowcord.dev/docs/components/modals)

**Advanced** — [Pagination](https://flowcord.dev/docs/advanced/pagination) · [Sub-Menus](https://flowcord.dev/docs/advanced/sub-menus) · [Guards & Pipelines](https://flowcord.dev/docs/advanced/guards-and-pipelines) · [Fallback Menus](https://flowcord.dev/docs/advanced/fallback-menus) · [Layout Mode](https://flowcord.dev/docs/advanced/layout-mode) · [Session Persistence](https://flowcord.dev/docs/advanced/session-persistence) · [Tracing & Debugging](https://flowcord.dev/docs/advanced/tracing-and-debugging)

**API reference** — [`FlowCord`](https://flowcord.dev/docs/api-reference/flowcord-class) · [`MenuBuilder`](https://flowcord.dev/docs/api-reference/menu-builder) · [`MenuContext`](https://flowcord.dev/docs/api-reference/context) · [Built-in Actions](https://flowcord.dev/docs/api-reference/built-in-actions) · [Behavior Types](https://flowcord.dev/docs/api-reference/behavior-types)

---

## Examples

Thirteen runnable examples — from a bare-bones quickstart to layout mode and behavior policies — are documented at [flowcord.dev/docs/examples](https://flowcord.dev/docs/examples/), with full source in [`examples/`](./examples/).

To run them locally against a real bot:

```bash
git clone https://github.com/flowcord-dev/flowcord.git
cd flowcord
npm install

npm run flow:setup -w @flowcord/core   # copies .env.example → .env
```

Fill in `DISCORD_BOT_TOKEN` and `APP_ID` in `packages/core/.env` (set `DEV_GUILD_ID` too so slash commands register instantly to your dev guild rather than globally), then start the shared example bot:

```bash
npm run flow -w @flowcord/core
```

On startup the bot registers every example's slash command (`/weather`, `/cookbook`, `/workout`, `/party`, `/event`, `/shop`, and the layout/behavior commands) and comes online.

---

## Testing

[`@flowcord/testing`](https://www.npmjs.com/package/@flowcord/testing) provides a headless harness for driving menu sessions in-process — no Discord connection, fully deterministic. Discord.js mocks for unit tests ship with this package under the `@flowcord/core/mocks` subpath.

---

## Architecture

For a deep dive into FlowCord's internals — the interaction loop, session lifecycle, component ID management, and rendering pipeline — see [**ARCHITECTURE.md**](./ARCHITECTURE.md).

---

## Contributing

See [CONTRIBUTING.md](https://github.com/flowcord-dev/flowcord/blob/master/CONTRIBUTING.md) for the full contribution process, including how to propose features, report bugs, and what's required before opening a PR.

---

## License

[Apache 2.0](./LICENSE)
