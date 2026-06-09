---
sidebar_position: 1
---

# Introduction

FlowCord is a lifecycle-driven interactive menu framework for [Discord.js](https://discord.js.org). It provides a declarative, type-safe builder API for creating multi-step interactive flows — menus with buttons, select menus, modals, pagination, and navigation — without managing the Discord interaction loop yourself.

:::caution Alpha
FlowCord is in alpha. The API is functional but may change between releases — check the [changelog](https://github.com/flowcord-dev/flowcord-core/releases) before upgrading.
:::

## The problem it solves

Building interactive Discord bot UIs with raw Discord.js requires a lot of repetitive boilerplate: collecting interactions, routing them to the right handler, re-rendering messages, managing timeouts, and tracking where in a flow the user is. This code is easy to get wrong and hard to maintain as your bot grows.

FlowCord handles all of that. You define *what* your menu looks like and *what happens* when the user interacts with it. FlowCord handles the rest.

## What it looks like

```ts
flowcord.registerMenu('weather', (session) =>
  new MenuBuilder(session, 'weather')
    .setup((ctx) => {
      ctx.state.set('city', 'London');
      ctx.state.set('unit', 'celsius');
    })
    .setEmbeds((ctx) => [
      new EmbedBuilder()
        .setTitle(`Weather in ${ctx.state.get('city')}`)
        .setDescription(`Unit: ${ctx.state.get('unit')}`)
    ])
    .setButtons((ctx) => [
      { label: 'Switch to °F', style: ButtonStyle.Secondary, action: async (ctx) => ctx.state.set('unit', 'fahrenheit') },
      { label: 'Switch to °C', style: ButtonStyle.Secondary, action: async (ctx) => ctx.state.set('unit', 'celsius') },
    ])
    .setCancellable()
    .build()
);
```

A button action mutates state, and FlowCord automatically re-renders the menu. There are no collectors to manage, no `message.edit()` calls to coordinate, no interaction acknowledgement boilerplate.

## Key features

- **Fluent builder API** — define menus with type-safe generics for state, session state, and context
- **Two render modes** — traditional Discord embeds or Discord Components v2 (layout mode)
- **Navigation stack** — `goTo`, `goBack`, sub-menus with typed result passing
- **Full lifecycle** — `setup`, `onEnter`, `beforeRender`, `afterRender`, `onAction`, `onLeave`, and more
- **Pagination** — button pagination and list pagination with automatic Next/Previous injection
- **Guards & pipelines** — composable action middleware for permission checks and validation
- **TypeScript-first** — generics flow through the entire API surface

## Where to go next

If you're new to FlowCord, start with [Installation](./getting-started/installation.md) and work through the [Quick Start](./getting-started/quick-start.md).

If you want to understand how FlowCord works internally — the interaction loop, session lifecycle, component ID encoding — see [ARCHITECTURE.md](https://github.com/flowcord-dev/flowcord-core/blob/HEAD/ARCHITECTURE.md) in the flowcord-core repository.
