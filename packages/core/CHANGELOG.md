# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.2] - 2026-06-10

### Added

- Adapter layer for Discord I/O: `FlowCordAdapter` interface, `DiscordAdapter` (the default production adapter), and normalized payload/interaction types (`NormalizedRenderPayload`, `NormalizedTerminalPayload`, `NormalizedComponentInteraction`, `NormalizedModalSubmission`, and more). `createSession()` accepts an optional `adapter` parameter — pass a custom adapter (e.g. the `SimulatedAdapter` from `@flowcord/testing`) to replace Discord I/O entirely
- `setTimeoutMessage()` on `MenuBuilder` and a `timeoutMessage` behavior field, resolved through the standard behavior hierarchy, for customizing the terminal message shown when a session times out (default: `*This interaction has timed out.*`)
- `EventLog` and `SessionEvent` exports for observing session events (renders, interactions, navigation, lifecycle)
- Test mocks (`mockClient`, `mockMenuContext`, and friends) are now published under the `@flowcord/core/mocks` subpath

### Changed

- Sessions that end due to inactivity now always render an explicit terminal timeout message instead of leaving the last menu render in place
- `ActionRegistry` now throws when registering a duplicate action ID instead of silently overwriting the existing action
- Repository moved to the `flowcord` monorepo — the package now lives at `packages/core` of [flowcord-dev/flowcord](https://github.com/flowcord-dev/flowcord)

### Removed

- `ctx.navigateTo()` — use `ctx.goTo()` instead (identical behavior, the alias added an inconsistency)
- `openModal()` built-in action — incompatible with automatic interaction deferral; set `opensModal` on the button config instead. Predicate-based modal opening will return in a future release

### Fixed

- Component validation now runs during rendering — the `ComponentValidator` was never wired into `MenuRenderer`, so invalid component configurations were silently accepted
- `paginated_group` component count validation in layout mode
- `DiscordAdapter` no longer attempts `update()` on deferred or already-replied interactions, and stripped layout components are applied at the correct time when sending payloads
- Modal timeouts now follow the terminal path so the session ends cleanly, and message-collector timeouts are routed to timeout handling instead of generic error handling
- `NavigationTracer.getPathsFrom()` now returns correctly inverted back-paths without duplicates

## [0.1.0-alpha.1] - 2026-04-07

### Added

- Ephemeral menu support with `setEphemeral()` on the builder and `entryEphemeral` in `HandleInteractionOptions` for async factory timing; proper ephemeral message editing via `editReply()` and webhook REST routes
- Behavior policy system with override/default hierarchy at global, session, class, and explicit levels
- `setMessageCleanup()` API with values `'edit'`, `'postAndDelete'`, `'postAndStrip'`, `'postAndReplace'` for controlling message disposal on render
- Per-interaction behavior overrides via `behavior` field on buttons, selects, modals, and message handlers
- Protected `_setDefaultBehavior()` and `_setOverrideBehavior()` for `MenuBuilder` subclasses to establish class-level behavior policies
- Exported behavior types: `BehaviorConfig`, `BehaviorPolicy`, `InteractionBehavior`, `MenuBehavior`, `ResolvedBehavior`
- Seven new examples: layout basics, layout sections, layout navigation, mode transitions, layout paginated group, behavior subclass, behavior policy
- Unified example bot entry point (`examples/bot.ts`) with `.env.example` and npm scripts for running examples locally
- CI workflow for PRs, CODEOWNERS, and bug report issue template

### Changed

- `handleInteraction()` signature: `options` renamed to `commandOptions`; new `interactionOptions` parameter for `entryEphemeral` and session-level `behavior` policy
- Section `accessory` field is now required in layout mode `SectionConfig`
- Layout `display.ts` helpers (`button()`, `select()`, `actionRow()`) are now generic over `TCtx`
- `SelectOptions.onSelect` now uses `SelectAction<TCtx>` instead of `Action`

### Fixed

- Duplicate component custom IDs in layout mode
- Interaction behavior correctly cleared on navigation to prevent stale overrides carrying over
- Reserved button injection skips containers without a placeholder (no unnecessary cloning)

## [0.1.0-alpha.0] - 2026-03-24

### Added

- Core `FlowCord` facade and `MenuEngine` for session management
- `MenuBuilder` fluent API with full TypeScript generics for typed state
- Dual render modes: embeds mode (traditional Discord embeds + buttons) and layout mode (Components v2)
- Lifecycle hook system: `onEnter`, `onLeave`, `beforeRender`, `afterRender`, `onAction`, `onCancel`, `onNext`, `onPrevious`
- Built-in navigation actions: `goTo`, `goBack`, `closeMenu`, `openModal`
- Composable action pipelines with `pipeline()` and `guard()`
- Session-wide `StateStore` and menu-local `StateAccessor` with full type safety
- Navigation history stack (`MenuStack`) with state preservation on return
- Sub-menu continuation pattern via `openSubMenu` / `ctx.complete()`
- Button pagination and list pagination support
- Modal form handling
- Component ID namespacing to prevent cross-session collisions
- Plugin registries: `MenuRegistry`, `ActionRegistry`, `HookRegistry`
- Navigation tracing via `NavigationTracer`
- Six example files covering quickstart through advanced patterns

[Unreleased]: https://github.com/flowcord-dev/flowcord/compare/v0.1.0-alpha.2...HEAD
[0.1.0-alpha.2]: https://github.com/flowcord-dev/flowcord/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/flowcord-dev/flowcord/compare/v0.1.0-alpha.0...v0.1.0-alpha.1
[0.1.0-alpha.0]: https://github.com/flowcord-dev/flowcord/releases/tag/v0.1.0-alpha.0
