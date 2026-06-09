---
sidebar_position: 1
---

# FlowCord

The main entry point for the framework. Manages menu registration, interaction handling, and active session lifecycle.

```ts
import { FlowCord } from '@flowcord/core';
```

## Constructor

```ts
new FlowCord(config: FlowCordConfig)
```

### `FlowCordConfig`

| Option | Type | Default | Description |
|---|---|---|---|
| `client` | `Client<true>` | Required | A logged-in Discord.js client |
| `timeout` | `number` | `120000` | Session timeout in milliseconds |
| `enableTracing` | `boolean` | `false` | Enable navigation event recording via `NavigationTracer` |
| `onError` | `(session, error) => Promise<void>` | Built-in error embed | Custom error handler for unhandled session errors |
| `behavior` | `BehaviorPolicy` | — | Global behavior defaults and overrides. See [Behavior System](/docs/core-concepts/behavior-system) |

**Example:**

```ts
const flowcord = new FlowCord({
  client,
  timeout: 60_000,
  enableTracing: process.env.NODE_ENV === 'development',
  onError: async (session, error) => {
    console.error(`[${session.id}]`, error);
  },
});
```

---

## Methods

### `registerMenu(name, factory)`

```ts
registerMenu(name: string, factory: CreateMenuDefinitionFn): void
```

Registers a menu definition factory under the given name. The factory is called each time a new session opens that menu.

```ts
flowcord.registerMenu('settings', (session) =>
  new MenuBuilder(session, 'settings')
    .setEmbeds(/* ... */)
    .setButtons(/* ... */)
    .build()
);
```

---

### `handleInteraction(interaction, menuName, commandOptions?, interactionOptions?)`

```ts
handleInteraction(
  interaction: ChatInputCommandInteraction,
  menuName: string,
  commandOptions?: Record<string, unknown>,
  interactionOptions?: HandleInteractionOptions
): Promise<void>
```

Creates a new session for the slash command interaction and opens the specified menu. `commandOptions` are passed as `ctx.options` in the menu's callbacks.

**`HandleInteractionOptions`:**

| Option | Type | Default | Description |
|---|---|---|---|
| `behavior` | `BehaviorPolicy` | — | Session-level behavior policy. See [Behavior System](/docs/core-concepts/behavior-system) |
| `entryEphemeral` | `boolean` | — | Ephemeral flag for the initial `deferReply`. Required when the menu factory is **async** and calls `setEphemeral()` — the framework must defer before running the factory and cannot read `setEphemeral()` in time. For sync factories, `setEphemeral()` alone is sufficient |

```ts
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await flowcord.handleInteraction(interaction, interaction.commandName);
});
```

---

### `routeComponentInteraction(interaction)`

```ts
routeComponentInteraction(interaction: MessageComponentInteraction): boolean
```

Routes a component interaction to the correct active session. Returns `true` if the interaction was matched to a session, `false` otherwise.

---

### `isFlowCordInteraction(customId)`

```ts
isFlowCordInteraction(customId: string): boolean
```

Returns `true` if the custom ID belongs to an active FlowCord session. Useful for conditional routing in the `interactionCreate` handler.

---

### `getSession(sessionId)`

```ts
getSession(sessionId: string): MenuSession | undefined
```

Returns the active session with the given ID, or `undefined` if not found. Primarily for debugging and testing.

---

## Properties

### `engine`

```ts
readonly engine: MenuEngine
```

The underlying `MenuEngine` instance. Exposes `menuRegistry`, `hookRegistry`, `actionRegistry`, and `tracer` for advanced use.

```ts
// Register a global hook
flowcord.engine.hookRegistry.register('onEnter', async (ctx) => {
  console.log(`Entered: ${ctx.menu.name}`);
});

// Access navigation tracer
const events = flowcord.engine.tracer.events;
```

### `activeSessionCount`

```ts
readonly activeSessionCount: number
```

Number of currently active sessions.

### `client`

```ts
readonly client: Client<true>
```

The Discord.js client passed in the config.
