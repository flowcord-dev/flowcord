---
sidebar_position: 3
---

# Guards & Pipelines

Guards and pipelines give you a composable way to add pre-conditions to button actions. A guard checks a condition and halts execution if it fails. A pipeline sequences multiple actions — including guards — into a single action callback.

## Guards

`guard(predicate, failureMessage)` creates an action that runs a check before the rest of the action executes. If the predicate fails, it throws a `GuardFailedError` with the failure message, which FlowCord catches and displays to the user. The menu re-renders without advancing.

```ts
import { guard } from '@flowcord/core';

const requireNotDeployed = guard(
  async (ctx) => {
    const region = await db.getRegion(ctx.options.regionId as string);
    return !region.deployed;
  },
  'This region is deployed. Undeploy it before making changes.'
);
```

### Predicate return values

The predicate can return:

| Return value | Behavior |
|---|---|
| `true` | Guard passes — execution continues |
| `false` | Guard fails — shows `failureMessage` |
| A non-empty string | Guard fails — shows that string instead of `failureMessage` |

Returning a string lets the guard provide a dynamic failure message based on the data it fetches:

```ts
const requireSufficientFunds = guard(
  async (ctx) => {
    const balance = await db.getBalance(ctx.interaction.user.id);
    const cost = ctx.state.get('itemCost') as number;
    if (balance < cost) {
      return `You need ${cost} coins but only have ${balance}.`;
    }
    return true;
  },
  'Insufficient funds.' // fallback — only used if the predicate returns false
);
```

## Pipelines

`pipeline(...actions)` composes multiple actions into a single sequential action. Each action runs in order. If any action throws a `GuardFailedError`, the pipeline stops and the error is shown to the user — subsequent actions do not run.

```ts
import { pipeline } from '@flowcord/core';

{
  label: 'Deploy Region',
  style: ButtonStyle.Danger,
  action: pipeline(
    requireAdmin,
    requireNotDeployed,
    async (ctx) => {
      await db.deployRegion(ctx.options.regionId as string);
      await ctx.goTo('region-deployed');
    }
  ),
}
```

Other errors (non-`GuardFailedError`) propagate normally and are not swallowed by the pipeline.

## Defining reusable guards

Guards work best as named constants defined outside your menu. This keeps action callbacks clean and lets the same guard be used across multiple menus:

```ts
// guards.ts
import { guard } from '@flowcord/core';

export const requireAdmin = guard(
  (ctx) => ctx.sessionState.get('isAdmin') === true,
  'You must be an administrator to perform this action.'
);

export const requireGuildOwner = guard(
  (ctx) => ctx.interaction.guild?.ownerId === ctx.interaction.user.id,
  'Only the server owner can do this.'
);
```

```ts
// In any menu
import { requireAdmin } from './guards';

action: pipeline(
  requireAdmin,
  async (ctx) => { /* ... */ }
)
```

## Pipeline vs inline async

Use `pipeline` when you have guards or steps that are reused across multiple buttons or menus. For one-off logic that doesn't need to be shared, an inline async callback is simpler:

```ts
// Inline — fine when the logic is only used here
action: async (ctx) => {
  if (ctx.state.get('locked')) {
    // can't really show a guard message here without GuardFailedError
    return;
  }
  await ctx.goTo('next-step');
}

// Pipeline — better when guards are shared
action: pipeline(
  requireUnlocked,
  async (ctx) => { await ctx.goTo('next-step'); }
)
```

:::note
Throwing `GuardFailedError` manually from within an inline callback has the same effect as using `guard()` — FlowCord catches it, displays the message, and re-renders. `guard()` is just a factory that makes this pattern reusable and readable.
:::
