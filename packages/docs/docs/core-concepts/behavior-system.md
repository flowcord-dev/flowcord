---
sidebar_position: 7
---

# Behavior System

The behavior system controls how FlowCord renders and manages messages — whether a menu reply is visible only to the invoking user, how the old message is handled when the menu updates, and whether the user's typed message is deleted after a message handler collects it.

Each behavior field has a default value the framework falls back to when nothing more specific is declared. You can override these defaults at multiple levels of granularity.

## What it controls

| Behavior | Type | Framework default | Description |
|---|---|---|---|
| `ephemeral` | `boolean` | `false` | Whether the menu reply is visible only to the invoking user |
| `messageCleanup` | `'edit' \| 'postAndStrip' \| 'postAndDelete' \| 'postAndReplace'` | `'edit'` | How the current message is handled on the next render cycle |
| `ephemeralFallbackDisposal` | `'strip' \| 'replace'` | `'strip'` | Fallback when `messageCleanup` is `'postAndDelete'` but the message is ephemeral |
| `closedMessage` | `string` | `'*Menu closed*'` | Content shown when `messageCleanup` is `'postAndReplace'` or when `ephemeralFallbackDisposal` is `'replace'` |
| `deleteUserMessages` | `boolean` | `false` | Whether to delete the user's typed message after a message handler collects it |

:::note
Message handler cycles default to `messageCleanup: 'postAndStrip'` — not `'edit'` — to prevent the menu from being buried under the user's message in chat.
:::

## Message cleanup modes

### `'edit'` (default)

Edits the existing message in place. No new message is posted.

### `'postAndStrip'`

Posts a new message with the updated content. Strips interactive components (buttons, select menus) from the old message but leaves its display content (embeds, text) intact.

### `'postAndDelete'`

Posts a new message and deletes the old one. When the old message is ephemeral — which Discord does not allow bots to delete — the `ephemeralFallbackDisposal` setting applies:
- `'strip'` (default): strip components from the old message
- `'replace'`: replace the old message with `closedMessage`

### `'postAndReplace'`

Posts a new message and replaces the old one with `closedMessage`.

---

## Resolution hierarchy

When FlowCord resolves the effective behavior for a render cycle, it walks this hierarchy from highest to lowest priority. The first level that has declared a value wins.

```
globalOverride → sessionOverride → classOverride
  → interactionExplicit
  → menuExplicit
  → interactionTypeDefault → classDefault → sessionDefault → globalDefault → framework default
```

### Levels explained

| Level | Where it's set | Priority |
|---|---|---|
| `globalOverride` | `FlowCordConfig.behavior.override` | Highest — wins over everything |
| `sessionOverride` | `handleInteraction(..., { behavior: { override: ... } })` | Wins over class and below |
| `classOverride` | `_setOverrideBehavior()` in a `MenuBuilder` subclass | Wins over the builder's own explicit declarations |
| `interactionExplicit` | `behavior` field on a button/select/modal config | Wins for that one render cycle only |
| `menuExplicit` | `setEphemeral()`, `setMessageCleanup()` on the builder | The menu's own declaration |
| `interactionTypeDefault` | Framework internal (e.g. message handlers default to `postAndStrip`) | Below menu-level |
| `classDefault` | `_setDefaultBehavior()` in a `MenuBuilder` subclass | Below session defaults |
| `sessionDefault` | `handleInteraction(..., { behavior: { default: ... } })` | Below global default |
| `globalDefault` | `FlowCordConfig.behavior.default` | Falls through to framework default |
| Framework default | Hard-coded in `resolveBehavior()` | Lowest |

---

## Setting behavior

### Global (all menus, all sessions)

Pass `behavior` to `FlowCordConfig`:

```ts
const flowcord = new FlowCord({
  client,
  behavior: {
    default: { messageCleanup: 'postAndStrip' }, // applies when nothing more specific is set
    override: { deleteUserMessages: true },       // applies regardless of what menus declare
  },
});
```

### Session-level (one invocation)

Pass `interactionOptions` to `handleInteraction()`:

```ts
await flowcord.handleInteraction(interaction, 'admin-panel', {}, {
  behavior: {
    default: { ephemeral: true },
  },
});
```

### Menu-level (one menu)

Use `setEphemeral()` and `setMessageCleanup()` on the builder:

```ts
new MenuBuilder(session, 'confirm-delete')
  .setEphemeral()
  .setMessageCleanup('postAndDelete')
  // ...
  .build()
```

### Per-interaction (one render cycle)

Set `behavior` on a button, select, or modal config. The override applies only for the single render cycle triggered by that interaction and is discarded afterward:

```ts
.setButtons((ctx) => [
  {
    label: 'Show Private Info',
    style: ButtonStyle.Secondary,
    // This one click renders ephemeral; the next render returns to public
    behavior: { ephemeral: true },
    action: async (ctx) => {
      ctx.state.set('revealed', true);
    },
  },
])
```

---

## Ephemeral menus

`setEphemeral()` marks the menu reply as visible only to the invoking user.

```ts
new MenuBuilder(session, 'my-settings')
  .setEphemeral()
  // ...
  .build()
```

**Async factory note:** When a menu factory is `async`, the framework must `deferReply()` before running the factory. At that point, `setEphemeral()` hasn't been called yet. Pass `entryEphemeral` to `handleInteraction()` to set the ephemeral flag for the initial defer:

```ts
// Async factory — must pass entryEphemeral
flowcord.registerMenu('my-settings', async (session) => {
  const data = await db.fetch();
  return new MenuBuilder(session, 'my-settings')
    .setEphemeral()
    // ...
    .build();
});

// In the command handler
await flowcord.handleInteraction(interaction, 'my-settings', {}, {
  entryEphemeral: true,
});
```

For sync factories, `setEphemeral()` alone is sufficient.

---

## Subclass defaults and overrides

`MenuBuilder` subclasses can set class-level behavior that applies to all menus built with the subclass. This is the pattern for building a reusable builder with opinionated defaults — for example, an `AdminMenuBuilder` that defaults all menus to ephemeral:

```ts
class AdminMenuBuilder extends MenuBuilder {
  constructor(session: MenuSessionLike, name: string, options?: Record<string, unknown>) {
    super(session, name, options);
    // All menus built with AdminMenuBuilder are ephemeral by default...
    this._setDefaultBehavior({ ephemeral: true });
    // ...and always delete user messages, regardless of per-menu declarations
    this._setOverrideBehavior({ deleteUserMessages: true });
  }
}
```

- `_setDefaultBehavior(config)` — lowest-priority class setting. Individual menus can override it with `setEphemeral(false)`.
- `_setOverrideBehavior(config)` — wins over the builder's own `setEphemeral()` calls, but still yields to session and global overrides.

See [Examples — Behavior Subclass](/docs/examples/behavior-subclass) for a full walkthrough.

---

## API reference

See [Behavior Types](/docs/api-reference/behavior-types) for the full type documentation.

**Related MenuBuilder methods:** [`setEphemeral()`](/docs/api-reference/menu-builder#setephemeralephemeral), [`setMessageCleanup()`](/docs/api-reference/menu-builder#setmessagecleanupmode-options), [`_setDefaultBehavior()`](/docs/api-reference/menu-builder#_setdefaultbehaviorconfig), [`_setOverrideBehavior()`](/docs/api-reference/menu-builder#_setoverridebehaviorconfig)
