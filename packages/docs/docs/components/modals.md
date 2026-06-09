---
sidebar_position: 3
---

# Modals

Modals are defined via `.setModal()` on the builder and triggered by buttons with `opensModal` set. When the user submits the modal, the `onSubmit` callback fires and the menu re-renders automatically.

The `builder` field accepts a standard Discord.js [`ModalBuilder`](https://discord.js.org/docs/packages/discord.js/main/ModalBuilder:Class) — refer to the discord.js documentation for supported components and builder configuration.

## Modal config properties

| Property   | Type                               | Required | Description                                          |
| ---------- | ---------------------------------- | -------- | ---------------------------------------------------- |
| `builder`  | `ModalBuilder`                     | Yes      | Discord.js modal builder with text inputs configured |
| `onSubmit` | `(ctx, fields) => Awaitable<void>` | No       | Callback fired on submission                         |
| `id`       | `string`                           | No       | Required when the menu has more than one modal       |
| `behavior` | `InteractionBehavior`              | No       | Overrides behavior for the single render cycle triggered by this modal submission. See [Behavior System](/docs/core-concepts/behavior-system) |

Behavior overrides are consumed after the render cycle — they do not persist to subsequent interactions.

## Single modal

When a menu has one modal, omit `id` and set `opensModal: true` on the trigger button:

```ts
import { ModalBuilder } from 'discord.js';

.setModal(() => ({
  builder: new ModalBuilder()
    .setTitle('Submit Feedback')
    .addComponents(/* ... */),
  onSubmit: async (ctx, fields) => {
    const feedback = fields.getTextInputValue('feedback');
    ctx.state.set('feedback', feedback);
  },
}))
.setButtons(() => [
  {
    label: 'Open Form',
    style: ButtonStyle.Primary,
    opensModal: true,
  },
])
```

## Multiple modals

When a menu has more than one modal, give each an `id` and use that ID in `opensModal` on the trigger button:

```ts
.setModal(() => [
  {
    id: 'edit-name',
    builder: new ModalBuilder()
      .setTitle('Edit Name')
      .addComponents(/* ... */),
    onSubmit: async (ctx, fields) => {
      ctx.state.set('name', fields.getTextInputValue('name'));
    },
  },
  {
    id: 'edit-bio',
    builder: new ModalBuilder()
      .setTitle('Edit Bio')
      .addComponents(/* ... */),
    onSubmit: async (ctx, fields) => {
      ctx.state.set('bio', fields.getTextInputValue('bio'));
    },
  },
])
.setButtons(() => [
  { label: 'Edit Name', style: ButtonStyle.Secondary, opensModal: 'edit-name' },
  { label: 'Edit Bio',  style: ButtonStyle.Secondary, opensModal: 'edit-bio'  },
])
```

## The `onSubmit` callback

```ts
onSubmit: (ctx: MenuContext, fields: ModalSubmitFields) =>
  Awaitable<void>;
```

`fields` is Discord.js's [`ModalSubmitFields`](https://discord.js.org/docs/packages/discord.js/main/ModalSubmitFields:Class) — refer to the discord.js documentation for the full access API. Example:

```ts
onSubmit: async (ctx, fields) => {
  const value = fields.getTextInputValue('your-input-custom-id');
  ctx.state.set('result', value);
  // Menu re-renders automatically after onSubmit completes
},
```

## Button configuration

See [Buttons — Modal trigger buttons](./buttons#modal-trigger-buttons) for the `opensModal` property on button configs.

:::note
`opensModal` buttons must not be deferred before the modal is shown. FlowCord handles this automatically — do not set `action` alongside `opensModal` expecting both to run. If both are present, `opensModal` takes precedence.
:::
