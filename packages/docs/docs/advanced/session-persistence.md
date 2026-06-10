---
sidebar_position: 7
---

# Session Persistence & Scope

FlowCord sessions are **entirely in-memory and process-scoped**. This is an intentional design boundary, not a missing feature.

## What this means in practice

All session state — `StateStore`, `StateAccessor`, the `MenuStack`, navigation history — lives in memory for the lifetime of the process. If the bot restarts (deployment, crash, host migration), all active sessions are lost. Users with open menus will see their interactions fail or time out silently.

Timeouts are backed by Discord.js's collector mechanism and are not stored anywhere durable. They reset on every restart.

## What FlowCord is designed for

FlowCord is optimized for **short-lived, synchronous interactive flows** — things that complete in one sitting:

- Multi-step setup wizards
- Confirmation dialogs
- Paginated lists and selection menus
- Inline forms with modals

Bot applications with longer lifecycles, such as gameplay or commerce bots, can also thrive with FlowCord — assuming that user data is backed in a database.

The default timeout (5 minutes) reflects this. Even with a custom timeout, sessions should be treated as transient UI shells, not durable state containers.

## What FlowCord is NOT designed for

Avoid using FlowCord sessions as the source of truth for anything that needs to survive across bot restarts or extended time periods (hours, days).

A **multi-day poll** is a poor fit for a FlowCord session. Each vote is a discrete, stateless interaction — there is no ongoing session to maintain. The appropriate architecture stores votes in a database, handles each button click independently, and uses a scheduled task to close the poll after the deadline.

## Recommended pattern: externally-backed state

The resilient pattern is to treat FlowCord as a **presentation layer only**, with meaningful state living in a database:

```
User triggers /command
        │
        ▼
FlowCord session starts  ←── ephemeral, process-scoped
        │
        ▼
Render callbacks read from ──► external cache (e.g. node-cache)
  cache or DB directly              │
                                    │ invalidated when data changes,
                                    │ shared across all sessions
        │
        ▼
Button action fires
        │
        ├── Update ctx.state       (immediate UI feedback)
        ├── Write to DB            (durable — survives restarts)
        └── Invalidate cache       (keeps other sessions consistent)
        │
        ▼
If session is interrupted, user re-runs /command
        │
        ▼
Render reads from cache/DB ──► user picks up where they left off
```

With this separation, FlowCord handles the interactive UX and Discord API concerns, your database owns persistent state, and your cache layer manages read performance and consistency. A process restart is a minor inconvenience — the user re-opens the menu — rather than data loss.

## `sessionState` vs. an external cache

These serve different purposes and should not be conflated:

|                   | `sessionState`                              | External cache (e.g. node-cache) |
| ----------------- | ------------------------------------------- | -------------------------------- |
| **Scope**         | Single session                              | Shared across all sessions       |
| **Lifetime**      | Dies with the session                       | Independent of any session       |
| **Invalidation**  | Not possible externally                     | Explicit, on your terms          |
| **Best used for** | Passing context between menus within a flow | DB query results, shared lookups |

Use `sessionState` for ephemeral inter-menu context — data that only makes sense within the current flow (e.g. a selection made in one menu that a later menu needs to act on). For DB-backed data, querying directly in render callbacks or action handlers is the simplest starting point. An external cache is an optional optimization worth adding when the same data is read frequently across multiple sessions, when you need explicit invalidation as records change, or when response latency matters.
