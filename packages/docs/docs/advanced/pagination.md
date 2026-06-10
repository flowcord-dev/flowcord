---
sidebar_position: 1
---

# Pagination

FlowCord provides two distinct pagination modes. **Button pagination** pages through buttons when a menu has more than will fit in Discord's component limits. **List pagination** pages through data — a list of items fetched from a database or cache. They serve different purposes and are configured differently.

## Button pagination

### Auto-activation

Button pagination activates automatically when the total number of buttons passed to `.setButtons()` would exceed what fits in the available action rows, after accounting for any reserved row (Back/Cancel buttons) and select menu row. When auto-pagination triggers, FlowCord splits the buttons into pages and injects Next and Previous buttons into the reserved row.

### Explicit configuration

Pass a `pagination` option to `.setButtons()` to control page size or opt in explicitly before the limit is reached:

```ts
.setButtons((ctx) => [
  /* ... many buttons ... */
], { pagination: { perPage: 10 } })
```

| Option | Type | Default | Description |
|---|---|---|---|
| `perPage` | `number` | `25` | Maximum buttons per page (excluding fixed-position buttons) |
| `stableButtons` | `boolean` | `true` | Always show both Next/Previous buttons — disabled when not applicable |
| `labels.next` | `string` | `'Next →'` | Label for the Next button |
| `labels.previous` | `string` | `'← Previous'` | Label for the Previous button |

### Fixed-position buttons

Buttons with `fixedPosition: 'start'` or `fixedPosition: 'end'` are pinned to every page and do not cycle through pagination. They count toward the total component limit but not toward `perPage`.

```ts
.setButtons((ctx) => [
  {
    label: '← Back',
    style: ButtonStyle.Secondary,
    fixedPosition: 'start',
    action: goBack(),
  },
  // ... paginated buttons ...
  {
    label: 'Done',
    style: ButtonStyle.Primary,
    fixedPosition: 'end',
    action: closeMenu(),
  },
], { pagination: { perPage: 5 } })
```

### Pagination hooks

`onNext` and `onPrevious` fire when the user clicks the injected navigation buttons. `ctx.pagination` reflects the updated page at the time they fire:

```ts
.onNext((ctx) => {
  console.log(`Now on page ${ctx.pagination?.currentPage + 1} of ${ctx.pagination?.totalPages}`);
})
```

:::note
Select menus cannot be combined with button pagination. If you need both, use a string select with its own options list, and keep the paginated buttons in a separate menu.
:::

---

## List pagination

List pagination is for paginating data — when a menu displays a slice of a larger dataset and the user pages through it. Configure it with `.setListPagination()`:

```ts
.setListPagination({
  getTotalQuantityItems: async (ctx) => {
    return await db.countItems({ userId: ctx.interaction.user.id });
  },
  itemsPerPage: 5,
})
```

FlowCord calls `getTotalQuantityItems` before each render cycle and computes `ctx.pagination`. Your render callbacks use `ctx.pagination` to slice the data:

```ts
.setEmbeds(async (ctx) => {
  const { startIndex, endIndex } = ctx.pagination!;
  const items = await db.getItems({
    userId: ctx.interaction.user.id,
    offset: startIndex,
    limit: endIndex - startIndex,
  });

  return [
    new EmbedBuilder()
      .setTitle('Your Items')
      .setDescription(items.map((i) => `• ${i.name}`).join('\n')),
  ];
})
```

### `ctx.pagination` reference

`ctx.pagination` is `PaginationState | null`. It is `null` when no pagination is active.

| Property | Type | Description |
|---|---|---|
| `currentPage` | `number` | Zero-based current page index |
| `totalPages` | `number` | Total number of pages |
| `itemsPerPage` | `number` | Items per page |
| `totalItems` | `number` | Total item count (from `getTotalQuantityItems`) |
| `startIndex` | `number` | Inclusive start offset for the current page |
| `endIndex` | `number` | Exclusive end offset for the current page |

### List pagination options

| Option | Type | Default | Description |
|---|---|---|---|
| `getTotalQuantityItems` | `(ctx) => Awaitable<number>` | Required | Returns the total item count |
| `itemsPerPage` | `number` | `50` | Items per page |
| `stableButtons` | `boolean` | `true` | Always render both nav buttons, disabled when N/A |
| `labels.next` | `string` | `'Next →'` | Next button label |
| `labels.previous` | `string` | `'← Previous'` | Previous button label |

List pagination works in both embeds and layout mode. Next and Previous buttons are injected into the reserved row automatically.

---

## Choosing between them

| | Button pagination | List pagination |
|---|---|---|
| **Use when** | You have many buttons that need to be spread across pages | You're rendering a paginated dataset |
| **Configured via** | `.setButtons(fn, { pagination })` | `.setListPagination(opts)` |
| **`ctx.pagination`** | Available during render | Available during render |
| **Can combine with select menu** | No | Yes |
