<p align="center">
  <a href="https://github.com/flowcord-dev/flowcord/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/flowcord-dev/flowcord/ci.yml?branch=develop&style=flat-square&label=CI" alt="CI status" /></a>
  <a href="https://www.npmjs.com/package/@flowcord/core"><img src="https://img.shields.io/npm/v/@flowcord/core?style=flat-square&label=%40flowcord%2Fcore" alt="@flowcord/core npm version" /></a>
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white" alt="discord.js v14" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-green?style=flat-square" alt="license" /></a>
</p>

# FlowCord

**Lifecycle-driven interactive menu framework for Discord.js**

FlowCord replaces the boilerplate of managing component collectors, interaction state, and multi-step flows with a declarative, builder-based API. Define menus as self-contained units with embeds, buttons, selects, and modals — FlowCord handles the interaction loop, navigation stack, pagination, and session lifecycle automatically.

- **Declarative menus** — a fluent, fully typed `MenuBuilder` API; no manual collectors, no `message.edit()` choreography
- **Navigation built in** — `goTo()` / `goBack()` with a history stack, sub-menu continuations, and pagination
- **Typed state** — per-menu and session-wide state stores with full TypeScript inference
- **Lifecycle & behavior control** — hooks at every stage, plus a policy system for ephemeral replies, message cleanup, and timeouts at global, session, menu, and per-interaction levels

```ts
flowcord.registerMenu('hello', (session) =>
  new MenuBuilder(session, 'hello')
    .setEmbeds(() => [new EmbedBuilder().setTitle('👋 Hello!')])
    .setButtons(() => [
      { label: 'Say Hi', style: ButtonStyle.Primary, action: async (ctx) => ctx.state.set('greeted', true) },
      { label: 'Close', style: ButtonStyle.Danger, action: closeMenu() },
    ])
    .build(),
);
```

## Getting started

```bash
npm install @flowcord/core@next discord.js
```

Head to the **[Quick Start guide](https://flowcord.dev/docs/getting-started/quick-start)** to get a bot with an interactive menu running in under five minutes, or browse the [runnable examples](https://flowcord.dev/docs/examples/).

> FlowCord is currently in **alpha** — the API may change between releases.

## Packages

| Package | Version | Description |
|---|---|---|
| [`@flowcord/core`](packages/core) | [![npm](https://img.shields.io/npm/v/@flowcord/core?style=flat-square)](https://www.npmjs.com/package/@flowcord/core) | The menu framework. Test mocks ship under the `@flowcord/core/mocks` subpath. |
| [`@flowcord/testing`](packages/testing) | [![npm](https://img.shields.io/npm/v/@flowcord/testing?style=flat-square)](https://www.npmjs.com/package/@flowcord/testing) | Headless test harness — drive menu sessions in-process, no Discord connection. Version-locked with core. |
| `@flowcord/core-integration` | private | Behavior tests that exercise core through the harness. Not published. |
| `@flowcord/docs` | private | The [flowcord.dev](https://flowcord.dev) documentation site (Docusaurus). |

## Documentation

- **[flowcord.dev](https://flowcord.dev)** — guides, core concepts, and the full API reference
- **[Examples](https://flowcord.dev/docs/examples/)** — thirteen runnable example bots, from quickstart to advanced patterns
- **[ARCHITECTURE.md](packages/core/ARCHITECTURE.md)** — a deep dive into FlowCord's internals

## Contributing

Contributions are welcome — FlowCord follows an issue-first workflow. See [CONTRIBUTING.md](CONTRIBUTING.md) for the process, code standards, and how to work in the monorepo.

## License

[Apache 2.0](LICENSE)
