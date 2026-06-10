---
sidebar_position: 13
---

# Behavior Subclass

**Slash commands:** `/private-default`, `/private-forced`

Demonstrates how a `MenuBuilder` subclass can set class-level ephemeral behavior via `_setDefaultBehavior()` and `_setOverrideBehavior()`. Two subclasses are compared: one where `setEphemeral(false)` on the builder can still override the class default, and one where the class override wins over any explicit declaration.

**Concepts:** [behavior system](/docs/core-concepts/behavior-system), [`_setDefaultBehavior()`](/docs/api-reference/menu-builder#_setdefaultbehaviorconfig), [`_setOverrideBehavior()`](/docs/api-reference/menu-builder#_setoverridebehaviorconfig), [resolution hierarchy](/docs/core-concepts/behavior-system#resolution-hierarchy)

---

```ts
import { EmbedBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import {
  type FlowCord,
  type MenuSessionLike,
  MenuBuilder,
  closeMenu,
} from '@flowcord/core';

// Subclass A — classDefault: ephemeral=true
//
// Menus built with PrivateMenuBuilder are ephemeral by default, but callers
// can override with .setEphemeral(false), or the bot owner can force public
// via a session/global override policy.
class PrivateMenuBuilder extends MenuBuilder {
  constructor(session: MenuSessionLike, name: string) {
    super(session, name);
    this._setDefaultBehavior({ ephemeral: true });
  }
}

// Subclass B — classOverride: ephemeral=true
//
// Menus built with AlwaysPrivateMenuBuilder are always ephemeral regardless
// of .setEphemeral(false). Only a session or global override policy can
// force them public.
class AlwaysPrivateMenuBuilder extends MenuBuilder {
  constructor(session: MenuSessionLike, name: string) {
    super(session, name);
    this._setOverrideBehavior({ ephemeral: true });
  }
}

export const commands = [
  new SlashCommandBuilder()
    .setName('private-default')
    .setDescription('Ephemeral by default — .setEphemeral(false) can make it public')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('private-forced')
    .setDescription('Always ephemeral — classOverride wins over .setEphemeral(false)')
    .toJSON(),
];

export function register(flowcord: FlowCord): void {
  // Menu 1: classDefault ephemeral
  //
  // .setEphemeral(false) here wins because explicit > classDefault → reply is public.
  // Remove .setEphemeral(false) and the reply goes back to ephemeral.
  flowcord.registerMenu('private-default', (session) =>
    new PrivateMenuBuilder(session, 'private-default')
      .setEphemeral(false) // explicit=false beats classDefault=true → public
      .setEmbeds(() => [
        new EmbedBuilder()
          .setTitle('Default-Ephemeral Menu')
          .setDescription(
            'This builder defaults to ephemeral, but `.setEphemeral(false)` made it public.\n\n' +
              'Try removing `.setEphemeral(false)` from the registration — it will go back to ephemeral.',
          )
          .setColor(0x5865f2),
      ])
      .setButtons(() => [
        { label: 'Close', style: ButtonStyle.Secondary, action: closeMenu() },
      ])
      .build(),
  );

  // Menu 2: classOverride ephemeral
  //
  // classOverride=true wins over explicit=false → reply is always ephemeral.
  // Only a session/global override policy with ephemeral:false can make it public.
  flowcord.registerMenu('private-forced', (session) =>
    new AlwaysPrivateMenuBuilder(session, 'private-forced')
      .setEphemeral(false) // explicit=false, but classOverride=true wins → still ephemeral
      .setEmbeds(() => [
        new EmbedBuilder()
          .setTitle('Override-Ephemeral Menu')
          .setDescription(
            'This builder uses `_setOverrideBehavior`, so `.setEphemeral(false)` has no effect.\n\n' +
              'The reply is always ephemeral unless the engine is configured with a ' +
              'session or global override policy that forces `ephemeral: false`.',
          )
          .setColor(0xed4245),
      ])
      .setButtons(() => [
        { label: 'Close', style: ButtonStyle.Secondary, action: closeMenu() },
      ])
      .build(),
  );
}
```

---

## Key things to notice

- **`_setDefaultBehavior()` is the lowest-priority class setting.** Calling `setEphemeral(false)` on a `PrivateMenuBuilder` instance overrides the class default — `explicit` wins over `classDefault`. Remove the `setEphemeral(false)` call and the menu returns to ephemeral.
- **`_setOverrideBehavior()` beats explicit declarations.** On `AlwaysPrivateMenuBuilder`, `classOverride=true` wins over the `setEphemeral(false)` call on the same builder — the reply is still ephemeral.
- **Session and global overrides can still win over `classOverride`.** Pass `interactionOptions: { behavior: { override: { ephemeral: false } } }` to `handleInteraction()` and the `AlwaysPrivateMenuBuilder` menu becomes public. Class overrides sit below session and global overrides in the hierarchy.
- **Both subclasses call `super()` first.** The `_setDefaultBehavior()` / `_setOverrideBehavior()` calls in the constructor run after `super()` initializes the base builder. This is the intended usage pattern.
- **The subclass pattern is reusable across all menus.** Any menu registered with `new PrivateMenuBuilder(session, name)` inherits the class behavior automatically — there is no need to call `setEphemeral()` on each menu individually.

### Hierarchy reference for this example

```
globalOverride → sessionOverride → classOverride (AlwaysPrivateMenuBuilder)
  → explicit (setEphemeral(false))
  → classDefault (PrivateMenuBuilder)
  → sessionDefault → globalDefault → false (framework default)
```
