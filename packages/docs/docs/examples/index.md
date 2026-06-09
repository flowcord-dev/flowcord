---
sidebar_position: 1
---

# Examples

Each example corresponds to a runnable bot in the `flowcord-core/examples/` directory. The snippets on these pages highlight the key FlowCord patterns and may omit boilerplate for brevity — refer to the source files for complete, runnable code.

Examples are grouped by topic. Later examples assume familiarity with earlier ones within each group, but you can jump directly to the topic that interests you.

## Fundamentals

Core concepts in embeds mode — the best place to start.

| Example | Slash command | What it demonstrates |
|---|---|---|
| [Quick Start](./quickstart) | `/weather` | Minimum setup: one menu, state, buttons |
| [Multi-Menu Navigation](./multi-menu-navigation) | `/cookbook` | Multiple menus, `goTo`, `goBack`, history stack |
| [State & Lifecycle](./state-and-lifecycle) | `/workout` | Typed state, `ctx.state` vs `ctx.sessionState`, all lifecycle hooks |
| [Sub-Menu Continuation](./sub-menu-continuation) | `/party` | `openSubMenu`, `ctx.complete`, returning results to a parent |
| [Select Menus & Modals](./selects-and-modals) | `/event` | `setSelectMenu`, `setModal`, multi-modal, `opensModal` |
| [Pagination & Guards](./pagination-and-guards) | `/shop` | Button pagination, list pagination, `guard`, `pipeline` |

## Layout Mode

Using Discord's Components v2 system with `setLayout()` and display component helpers.

| Example | Slash command | What it demonstrates |
|---|---|---|
| [Layout Basics](./layout-basics) | `/panel` | `setLayout()`, `text()`, `container()`, `actionRow()`, `button()` |
| [Layout Sections](./layout-sections) | `/guide` | `section()` with `thumbnail()` and link button accessories |
| [Layout Navigation](./layout-navigation) | `/hub` | `goTo()`/`goBack()` in layout mode, history stack, `setReturnable()` |
| [Mode Transitions](./mode-transitions) | `/showcase` | Navigating between embeds-mode and layout-mode menus mid-session |
| [Layout Paginated Group](./layout-paginated-group) | `/explorer` | `paginatedGroup()` for automatic button slicing in layout mode |

## Behavior System

Controlling ephemeral state, message cleanup, and per-interaction overrides.

| Example | Slash command | What it demonstrates |
|---|---|---|
| [Behavior Subclass](./behavior-subclass) | `/private-default`, `/private-forced` | `_setDefaultBehavior()` and `_setOverrideBehavior()` in a `MenuBuilder` subclass |
| [Behavior Policy](./behavior-policy) | `/behavior-hub` | All four cleanup modes, ephemeral fallback, `deleteUserMessages`, per-button overrides |

---

## Where to start

**New to FlowCord?** Start with [Quick Start](./quickstart) and work through the Fundamentals group in order. Each example introduces one or two new concepts without re-explaining the basics.

**Looking for something specific?**

- **Navigation patterns** → [Multi-Menu Navigation](./multi-menu-navigation)
- **State across menus** → [State & Lifecycle](./state-and-lifecycle)
- **Parent-child flows** → [Sub-Menu Continuation](./sub-menu-continuation)
- **Form input** → [Select Menus & Modals](./selects-and-modals)
- **Large item lists** → [Pagination & Guards](./pagination-and-guards)
- **Rich layouts (Components v2)** → [Layout Basics](./layout-basics)
- **Sections with thumbnails** → [Layout Sections](./layout-sections)
- **Navigation in layout mode** → [Layout Navigation](./layout-navigation)
- **Mixing embeds and layout menus** → [Mode Transitions](./mode-transitions)
- **Button pagination in layout mode** → [Layout Paginated Group](./layout-paginated-group)
- **Ephemeral menus** → [Layout Navigation](./layout-navigation), [Behavior System](/docs/core-concepts/behavior-system)
- **Message cleanup behavior** → [Behavior Policy](./behavior-policy)
- **Reusable builder subclasses** → [Behavior Subclass](./behavior-subclass)

All source files live in [`flowcord-core/examples/`](https://github.com/flowcord-dev/flowcord-core/tree/main/examples).
