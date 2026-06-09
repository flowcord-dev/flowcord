---
sidebar_position: 1
---

# Buttons

Buttons are defined via `.setButtons()` in embeds mode, or via the `button()` helper in layout mode. Each button is a config object with a label, style, and an action or link.

## Button properties

| Property        | Type                | Required    | Description                                            |
| --------------- | ------------------- | ----------- | ------------------------------------------------------ |
| `label`         | `string`            | Yes         | Text displayed on the button                           |
| `style`         | `ButtonStyle`       | Yes         | Button color (see below)                               |
| `action`        | `Action`            | Conditional | Callback executed on click                             |
| `opensModal`    | `boolean \| string` | Conditional | Trigger a modal instead of running an action           |
| `url`           | `string`            | Conditional | URL for link buttons — requires `ButtonStyle.Link`     |
| `disabled`      | `boolean`           | No          | Renders the button as unclickable                      |
| `emoji`         | `string`            | No          | Emoji displayed on the button                          |
| `id`            | `string`            | No          | Custom component ID — auto-assigned if omitted         |
| `fixedPosition` | `'start' \| 'end'`  | No          | Pins button across pagination pages (embeds mode only) |
| `behavior` | `InteractionBehavior` | No | Overrides behavior for the single render cycle triggered by this button. See [Behavior System](/docs/core-concepts/behavior-system) |

`action` or `opensModal` must be present unless `disabled: true` or the button is a link button.

Behavior overrides are consumed after the render cycle — they do not persist to subsequent interactions.

## Button styles

`ButtonStyle` is imported from `discord.js`:

```ts
import { ButtonStyle } from 'discord.js';
```

| Style                   | Color         | Use                                   |
| ----------------------- | ------------- | ------------------------------------- |
| `ButtonStyle.Primary`   | Blue          | Primary action                        |
| `ButtonStyle.Secondary` | Grey          | Secondary or neutral action           |
| `ButtonStyle.Success`   | Green         | Confirm, save, submit                 |
| `ButtonStyle.Danger`    | Red           | Delete, remove, destructive action    |
| `ButtonStyle.Link`      | No background | URL link — no interaction sent to bot |

## Basic usage

```ts
.setButtons((ctx) => [
  {
    label: 'Confirm',
    style: ButtonStyle.Success,
    action: async (ctx) => {
      await db.save(ctx.state.get('item'));
      await ctx.goTo('confirmation');
    },
  },
  {
    label: 'Cancel',
    style: ButtonStyle.Danger,
    action: closeMenu(),
  },
])
```

## Link buttons

Link buttons navigate the user to a URL without sending an interaction to your bot. They require `ButtonStyle.Link` and a `url` — `action` and `opensModal` cannot be set alongside `url`.

```ts
{
  label: 'View on GitHub',
  style: ButtonStyle.Link,
  url: 'https://github.com/flowcord-dev/flowcord-core',
}
```

## Disabled buttons

Set `disabled: true` to render a button as greyed out and unclickable. Useful for showing unavailable options conditionally:

```ts
{
  label: 'Purchase',
  style: ButtonStyle.Success,
  disabled: ctx.state.get('coins') < item.price,
  action: async (ctx) => { /* ... */ },
}
```

A disabled button does not require `action` or `opensModal` — the validator skips that check when `disabled: true`. You can omit both if the button is purely decorative (e.g., a greyed-out label for context).

## Modal trigger buttons

To open a modal when a button is clicked, set `opensModal` instead of `action`. When both are set, `opensModal` takes precedence.

```ts
// Single modal — opensModal: true
{
  label: 'Fill Out Form',
  style: ButtonStyle.Primary,
  opensModal: true,
}

// Multi-modal — opensModal: 'modal-id'
{
  label: 'Edit Details',
  style: ButtonStyle.Secondary,
  opensModal: 'edit-details',
}
```

See [Modals](./modals) for how to define the modal the button triggers.

## Fixed position buttons (pagination)

Button pagination activates automatically when the total number of buttons would exceed Discord's component limits. FlowCord splits the overflow into pages and injects Next and Previous navigation buttons — no additional configuration required.

When pagination is active, all buttons cycle through pages by default. `fixedPosition` pins a button to the start or end of every page so it's always visible regardless of which page is active.

```ts
.setButtons((ctx) => [
  {
    label: '← Back to Menu',
    style: ButtonStyle.Secondary,
    fixedPosition: 'start', // Always visible, doesn't paginate
    action: goBack(),
  },
  // ... paginated buttons in between ...
  {
    label: 'Done',
    style: ButtonStyle.Primary,
    fixedPosition: 'end', // Always visible at the end
    action: closeMenu(),
  },
], { pagination: { perPage: 5 } })
```

Fixed buttons count toward the total button limit per page.
