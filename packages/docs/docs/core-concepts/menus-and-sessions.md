---
sidebar_position: 1
---

# Menus & Sessions

Understanding the relationship between menus and sessions is the foundation of working with FlowCord. Everything else — state, navigation, lifecycle hooks, components — builds on these two concepts.

## What is a session?

A **session** is created when a user invokes a slash command and ends when the menu closes, times out, or is cancelled. It represents one user's interactive conversation with your bot.

Each session:
- Has a unique ID (used internally to namespace component custom IDs)
- Owns a **navigation stack** — the history of menus the user has visited
- Owns **session state** (`ctx.sessionState`) — a key-value store shared across all menus in the session
- Runs an **interaction loop** — continuously rendering, waiting for input, and dispatching actions until the session ends

Sessions are in-memory and process-scoped. See [Session Persistence & Scope](/docs/advanced/session-persistence) for what this means in practice.

## What is a menu?

A **menu** is a self-contained unit of interactive UI — a Discord message with embeds or components that the user can interact with. You define menus using the `MenuBuilder` fluent API and register them with a name:

```ts
flowcord.registerMenu('settings', (session) =>
  new MenuBuilder(session, 'settings')
    .setEmbeds(() => [ /* ... */ ])
    .setButtons(() => [ /* ... */ ])
    .build()
);
```

The function you pass to `registerMenu` is the **menu factory**. It receives the current session and returns a `MenuDefinition`. FlowCord calls this factory each time the menu is opened — when a session starts, when `goTo()` navigates to it, or when `goBack()` returns to it (unless state preservation is configured).

## The registration-then-open pattern

Menus are registered upfront, before any user interactions arrive. When a user runs a command, you open a registered menu by name:

```ts
// At startup — register all menus
flowcord.registerMenu('main', mainMenuFactory);
flowcord.registerMenu('settings', settingsMenuFactory);

// When a command arrives — open a menu by name
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'settings') {
    await flowcord.handleInteraction(interaction, 'settings');
  }
});
```

This separation means your menu definitions are always ready before any user can trigger them.

## The render-await-dispatch cycle

Once a session starts, FlowCord runs a continuous loop for the active menu:

```
┌─────────────────────────────┐
│ 1. Run render callbacks     │  setEmbeds / setButtons / setLayout
│    Send or update message   │
│                             │
│ 2. Await interaction        │  Button click, select, or modal submit
│    (or timeout)             │
│                             │
│ 3. Dispatch action          │  Run the button's action callback
│                             │
│ 4. Check for navigation     │  Did action call goTo / goBack / close?
│    Yes → open new menu      │
│    No  → re-render current  │
└─────────────────────────────┘
```

The key insight: **you never write this loop yourself.** You provide the render callbacks and action handlers; FlowCord manages the loop, the Discord API calls, and the interaction acknowledgements.

## Session lifecycle

```
User runs /command
       │
       ▼
Session created ──── unique session ID generated
       │
       ▼
Menu factory called ─── setup() hook fires
       │
       ▼
Render loop begins ──── onEnter hook fires
       │
  ┌────┴────────────────────────────┐
  │                                 │
  │  Render → Await → Dispatch      │
  │  (repeats until session ends)   │
  │                                 │
  └────┬────────────────────────────┘
       │
       ▼  (one of:)
  ctx.close() called
  Cancel button pressed
  No interaction within timeout
       │
       ▼
onLeave hook fires ──── session removed from memory
```

## Concurrent sessions

Multiple users can have active sessions simultaneously. Each session is independent — its own state, its own navigation stack, its own timeout. FlowCord encodes the session ID into every component's `customId`, so button clicks are always routed to the correct session regardless of how many are active.

## For deeper internals

The render → await → dispatch loop, component ID encoding, and how the interaction is acknowledged at each stage are covered in detail in [ARCHITECTURE.md](https://github.com/flowcord-dev/flowcord-core/blob/master/ARCHITECTURE.md) in the flowcord-core repository.
