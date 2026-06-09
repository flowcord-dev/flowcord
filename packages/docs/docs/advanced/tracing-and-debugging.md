---
sidebar_position: 6
---

# Tracing & Debugging

## Navigation tracing

FlowCord includes a `NavigationTracer` that records every menu transition during a session. It is disabled by default and intended for development and debugging.

Enable it in the FlowCord config:

```ts
const flowcord = new FlowCord({
  client,
  enableTracing: true,
});
```

Once enabled, every navigation event is recorded. Access the events via `flowcord.engine.tracer`:

```ts
const events = flowcord.engine.tracer.events;
console.log(events);
// [
//   { from: 'main', to: 'settings', sessionId: '...', userId: '...', timestamp: 1234567890, trigger: 'button:open-settings' },
//   { from: 'settings', to: 'permissions', sessionId: '...', userId: '...', timestamp: 1234567891 },
// ]
```

### `NavigationEvent` shape

| Field | Type | Description |
|---|---|---|
| `from` | `string` | Menu navigated away from |
| `to` | `string` | Menu navigated to |
| `sessionId` | `string` | Session identifier |
| `userId` | `string` | Discord user ID |
| `timestamp` | `number` | Unix timestamp (ms) |
| `trigger` | `string \| undefined` | Component that triggered navigation (e.g. `'button:confirm'`) |

### Querying paths

`tracer.getPathsFrom(menuId)` returns all navigation paths originating from a given menu, as arrays of menu names:

```ts
const paths = flowcord.engine.tracer.getPathsFrom('main');
// [['main', 'settings', 'permissions'], ['main', 'shop', 'cart']]
```

This is useful for verifying that your navigation graph matches your intent.

### Clearing events

```ts
flowcord.engine.tracer.clear();
```

:::note
Navigation tracing is in-memory and process-scoped. Events accumulate for the lifetime of the process. Clear them periodically if running the bot for long sessions or testing many flows.
:::

---

## Error handling

### Default behaviour

If no `onError` handler is configured, FlowCord catches unhandled session errors and sends the user an ephemeral dark-red embed with the error message. If the interaction has already been deferred or replied to, it edits the existing reply instead.

### Custom error handler

Pass `onError` to the FlowCord config to override the default:

```ts
const flowcord = new FlowCord({
  client,
  onError: async (session, error) => {
    console.error(`[session:${session.id}] Error:`, error);

    // Send a custom error message
    const interaction = session.commandInteraction;
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription('Something went wrong. Please try again.');

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed], components: [] });
    } else {
      await interaction.reply({ embeds: [embed], components: [], ephemeral: true });
    }
  },
});
```

`session` is the `MenuSession` instance — you can access `session.id` and other session properties for logging context.

---

## Common errors

**`Menu "x": must call either setEmbeds() or setLayout()`**
The builder's `.build()` was called without setting a render callback. Every menu must have either `.setEmbeds()` or `.setLayout()`.

**`Menu "x": cannot use both setEmbeds() and setLayout()`**
Both render modes were called on the same builder. Pick one — they are mutually exclusive per menu.

**`Menu "x": select menus cannot be used with button pagination`**
`.setSelectMenu()` and `.setButtons(..., { pagination })` were both set. Remove one or restructure the flow.

**`Button "x" is configured as a modal trigger but no matching modal was found`**
A button has `opensModal: 'some-id'` but `.setModal()` does not return a modal config with `id: 'some-id'`. Check that the IDs match exactly.

**`Button "x" used openModal() action after the interaction was deferred`**
The `openModal()` action was used in a button that was already deferred. Use `opensModal` on the button config instead — FlowCord uses it to call `showModal()` before the interaction is deferred.

---

## Session internals

For a deeper look at how sessions work — the render-await-dispatch loop, in-memory session lifecycle, and what that means for bot restarts and scalability — see [ARCHITECTURE.md](https://github.com/flowcord-dev/flowcord-core/blob/main/ARCHITECTURE.md) in the flowcord-core repository.
