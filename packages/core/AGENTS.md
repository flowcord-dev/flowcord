# @flowcord/core — Agent Context

The framework package: everything that runs a menu session, from
interaction dispatch to rendering. Key classes: `FlowCord`
(facade), `MenuEngine` + `MenuSession` (session loop),
`MenuBuilder` / `MenuInstance` / `MenuRenderer` (menu definition
and rendering), `MenuStack` + `StateStore` (navigation and state),
`ComponentIdManager` (component identity).

**Critical invariant:** sessions are in-memory and process-scoped
(default 120s inactivity timeout). FlowCord is a presentation
layer — durable state belongs in the consumer's own database, not
in session state. Don't design features that assume sessions
survive restarts.

## Source map (`src/`)

| Path                | Contents                                              |
| ------------------- | ------------------------------------------------------ |
| `FlowCord.ts`       | Public facade / entry point                            |
| `FlowCordClient.ts` | Discord client wiring                                  |
| `engine/`           | `MenuEngine`, `MenuSession` — the session loop         |
| `menu/`             | `MenuBuilder`, `MenuInstance`, `MenuRenderer`          |
| `adapter/`          | `FlowCordAdapter` interface + `DiscordAdapter`         |
| `action/`           | Action type, built-ins (`goTo`, `closeMenu`, …), `pipeline` |
| `context/`          | `MenuContext` passed to handlers                       |
| `lifecycle/`        | `LifecycleManager`, hook definitions                   |
| `registry/`         | Menu / action / hook registries                        |
| `state/`            | `StateStore`, `StateAccessor`, `MenuStack`             |
| `components/`       | `ComponentIdManager`, validation, reserved buttons     |
| `tracing/`          | `EventLog`, `NavigationTracer`                         |
| `types/`            | Shared types (behavior, discord, environment, common)  |
| `mocks/`            | Discord.js stubs, published at `@flowcord/core/mocks`  |

## Domain index → ARCHITECTURE.md

[ARCHITECTURE.md](./ARCHITECTURE.md) (~700 lines) is the canonical
deep-dive. **Do not read it end-to-end.** Before changing one of
these areas, grep the heading below and read only that section:

| Domain                                  | Section heading                  |
| --------------------------------------- | -------------------------------- |
| Class relationships, big picture        | `## High-Level Overview`         |
| Session creation, states, timeouts      | `## Session Lifecycle`           |
| Interaction dispatch and routing        | `## The Interaction Loop`        |
| Custom ID format and collision rules    | `## Component ID Management`     |
| Embeds vs layout mode, button rows      | `## Rendering Pipeline`          |
| goTo/goBack, history, fallback menus    | `## Navigation System`           |
| Ephemeral/disposal/edit policy levels   | `## Behavior Policy Resolution`  |
| sessionState / menuState / stack state  | `## State Architecture`          |
| Modal open/submit flow                  | `## Modal Handling`              |
| Hook ordering, global vs menu hooks     | `## Lifecycle Hook Execution`    |
| Sub-menus and continuations             | `## Sub-Menu & Continuation System` |
| Button and list pagination              | `## Pagination System`           |
| Guard/action errors, timeout behavior   | `## Error Handling`              |
| In-memory scope, external-DB pattern    | `## Session Persistence & Scope` |

## Package conventions

- Unit tests colocate in `src/**/__tests__/*.test.ts` and use the
  stubs from `src/mocks/`. Behavior tests do NOT go here — they
  live in `packages/core-integration` (see its AGENTS.md).
- `index.ts` barrels are re-export-only and excluded from
  coverage; don't put logic in them.
- Exported API gets JSDoc with `@example` blocks — they feed the
  docs site.
- Anything added to the public surface must be exported through
  `src/index.ts` (or the `mocks` subpath for test stubs).
