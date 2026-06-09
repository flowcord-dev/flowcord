---
sidebar_position: 5
---

# Behavior Types

Type reference for the behavior system. See [Behavior System](/docs/core-concepts/behavior-system) for the conceptual overview and usage guidance.

```ts
import type {
  BehaviorConfig,
  BehaviorPolicy,
  MenuBehavior,
  InteractionBehavior,
  ResolvedBehavior,
} from '@flowcord/core';
```

---

## `BehaviorConfig`

The base shape for behavior settings. All fields are optional — unset fields fall through to the next level in the resolution hierarchy.

```ts
interface BehaviorConfig {
  ephemeral?: boolean;
  messageCleanup?: 'edit' | 'postAndDelete' | 'postAndStrip' | 'postAndReplace';
  ephemeralFallbackDisposal?: 'strip' | 'replace';
  closedMessage?: string;
  deleteUserMessages?: boolean;
}
```

| Field | Type | Framework default | Description |
|---|---|---|---|
| `ephemeral` | `boolean` | `false` | Whether the menu reply is visible only to the invoking user |
| `messageCleanup` | `'edit' \| 'postAndDelete' \| 'postAndStrip' \| 'postAndReplace'` | `'edit'` | How the current message is handled on the next render cycle. See [Message cleanup modes](/docs/core-concepts/behavior-system#message-cleanup-modes) |
| `ephemeralFallbackDisposal` | `'strip' \| 'replace'` | `'strip'` | Fallback strategy when `messageCleanup` is `'postAndDelete'` but the message is ephemeral (Discord does not allow bots to delete ephemeral messages). Has no effect when `messageCleanup` is not `'postAndDelete'` |
| `closedMessage` | `string` | `'*Menu closed*'` | Content shown when `messageCleanup` is `'postAndReplace'`, or when `ephemeralFallbackDisposal` is `'replace'` |
| `deleteUserMessages` | `boolean` | `false` | Whether to attempt deleting the user's typed message after `setMessageHandler` collects it. Best-effort — requires the bot to have the `Manage Messages` permission |

---

## `BehaviorPolicy`

A default/override pair used at the global (`FlowCordConfig`) and session (`handleInteraction`) levels.

```ts
interface BehaviorPolicy {
  default?: BehaviorConfig;
  override?: BehaviorConfig;
}
```

| Field | Description |
|---|---|
| `default` | Applied when no more-specific level has declared a value |
| `override` | Applied regardless of what more-specific levels declare. Still yields to higher-level overrides (e.g. a global override wins over a session override) |

---

## `MenuBehavior`

The internal shape of behavior stored on a `MenuBuilder`. Not typically used directly — set via `_setDefaultBehavior()` and `_setOverrideBehavior()` in subclasses, and via `setEphemeral()` / `setMessageCleanup()` for explicit declarations.

```ts
interface MenuBehavior {
  explicit?: BehaviorConfig;    // set by setEphemeral(), setMessageCleanup()
  classDefault?: BehaviorConfig; // set by _setDefaultBehavior()
  classOverride?: BehaviorConfig; // set by _setOverrideBehavior()
}
```

---

## `InteractionBehavior`

A `BehaviorConfig` applied for a single render cycle. Used as the `behavior` field on button, select, and modal configs, and in `setMessageHandler`'s options.

```ts
type InteractionBehavior = BehaviorConfig;
```

Interaction behaviors are consumed after the render cycle they triggered — they do not persist to subsequent interactions unless those interactions also declare an override.

---

## `ResolvedBehavior`

The concrete resolved result after the full hierarchy has been walked. All fields are required (no `undefined`). Not typically used directly — the framework resolves behavior internally before each render.

```ts
interface ResolvedBehavior {
  ephemeral: boolean;
  messageCleanup: 'edit' | 'postAndDelete' | 'postAndStrip' | 'postAndReplace';
  ephemeralFallbackDisposal: 'strip' | 'replace';
  closedMessage: string;
  deleteUserMessages: boolean;
}
```
