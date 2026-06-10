---
sidebar_position: 14
---

# Behavior Policy

**Slash command:** `/behavior-hub`

A comprehensive testbed for all four `messageCleanup` modes, `deleteUserMessages`, ephemeral fallback behavior, and per-interaction behavior overrides. Each mode is a separate menu reachable from a hub, so you can observe the exact behavior difference in a live Discord session.

**Concepts:** [behavior system](/docs/core-concepts/behavior-system), [`setMessageCleanup()`](/docs/api-reference/menu-builder#setmessagecleanupmode-options), [`setEphemeral()`](/docs/api-reference/menu-builder#setephemeralephemeral), [`setMessageHandler()`](/docs/api-reference/menu-builder#setmessagehandlerfn-options), [per-interaction overrides](/docs/core-concepts/behavior-system#per-interaction-one-render-cycle), [behavior types](/docs/api-reference/behavior-types)

---

```ts
import { EmbedBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import {
  type FlowCord,
  MenuBuilder,
  goTo,
  closeMenu,
} from '@flowcord/core';

export const commands = [
  new SlashCommandBuilder()
    .setName('behavior-hub')
    .setDescription('Interactive testbed for behavior policy settings')
    .toJSON(),
];

export function register(flowcord: FlowCord): void {
  // Hub — entry point
  flowcord.registerMenu('behavior-hub', (session) =>
    new MenuBuilder(session, 'behavior-hub')
      .setTrackedInHistory()
      .setEmbeds(() => [
        new EmbedBuilder()
          .setTitle('Behavior Policy Testbed')
          .setDescription(
            'Choose a demo below.\n\n' +
              '**postAndDelete** — each click deletes the previous message and reposts\n' +
              '**postAndReplace** — each click replaces the previous message with a closed notice\n' +
              '**postAndStrip** — each click strips components from the previous message\n' +
              '**Collect (edit)** — type a reply; your message is deleted, bot message updates in place\n' +
              '**Collect (postAndStrip)** — type a reply; your message is deleted, bot message is stripped and reposted\n' +
              '**Ephemeral + fallback** — ephemeral postAndDelete; delete falls back to replace\n' +
              '**Interaction overrides** — per-button behavior; one button reposts, one reveals an ephemeral message',
          )
          .setColor(0x5865f2),
      ])
      .setButtons(() => [
        { label: 'postAndDelete',       style: ButtonStyle.Primary,    action: goTo('behavior-postnew-delete') },
        { label: 'postAndReplace',      style: ButtonStyle.Primary,    action: goTo('behavior-postnew-replace') },
        { label: 'postAndStrip',        style: ButtonStyle.Primary,    action: goTo('behavior-postnew-strip') },
        { label: 'Collect (edit)',      style: ButtonStyle.Success,    action: goTo('behavior-collect-edit') },
        { label: 'Collect (postAndStrip)', style: ButtonStyle.Success, action: goTo('behavior-collect-postnew') },
        { label: 'Ephemeral + fallback',style: ButtonStyle.Secondary,  action: goTo('behavior-ephemeral-fb') },
        { label: 'Interaction overrides',style: ButtonStyle.Secondary, action: goTo('behavior-interaction-override') },
        { label: 'Close',              style: ButtonStyle.Danger,      action: closeMenu() },
      ])
      .build(),
  );

  // Demo 1 — postAndDelete
  // Each click posts a new message and deletes the previous one.
  flowcord.registerMenu('behavior-postnew-delete', (session) =>
    new MenuBuilder<{ count: number }>(session, 'behavior-postnew-delete')
      .setMessageCleanup('postAndDelete')
      .setup((ctx) => ctx.state.set('count', 0))
      .setEmbeds((ctx) => [
        new EmbedBuilder()
          .setTitle('postAndDelete')
          .setDescription(
            `Clicks: **${ctx.state.get('count')}**\n\n` +
              'Each click should DELETE the previous message and post a new one here.',
          )
          .setColor(0xed4245),
      ])
      .setButtons((ctx) => [
        {
          label: `Click me (${ctx.state.get('count')})`,
          style: ButtonStyle.Danger,
          action: async (ctx) => ctx.state.set('count', ctx.state.get('count') + 1),
        },
      ])
      .setReturnable()
      .build(),
  );

  // Demo 2 — postAndReplace + closedMessage
  // Each click posts a new message and replaces the old one with a custom string.
  flowcord.registerMenu('behavior-postnew-replace', (session) =>
    new MenuBuilder<{ count: number }>(session, 'behavior-postnew-replace')
      .setMessageCleanup('postAndReplace', {
        closedMessage: '📦 This menu was replaced.',
      })
      .setup((ctx) => ctx.state.set('count', 0))
      .setEmbeds((ctx) => [
        new EmbedBuilder()
          .setTitle('postAndReplace')
          .setDescription(
            `Clicks: **${ctx.state.get('count')}**\n\n` +
              'Each click should replace the previous message with "📦 This menu was replaced."',
          )
          .setColor(0xfee75c),
      ])
      .setButtons((ctx) => [
        {
          label: `Click me (${ctx.state.get('count')})`,
          style: ButtonStyle.Primary,
          action: async (ctx) => ctx.state.set('count', ctx.state.get('count') + 1),
        },
      ])
      .setReturnable()
      .build(),
  );

  // Demo 3 — postAndStrip (explicit)
  // Each click posts a new message and strips components from the old one.
  flowcord.registerMenu('behavior-postnew-strip', (session) =>
    new MenuBuilder<{ count: number }>(session, 'behavior-postnew-strip')
      .setMessageCleanup('postAndStrip')
      .setup((ctx) => ctx.state.set('count', 0))
      .setEmbeds((ctx) => [
        new EmbedBuilder()
          .setTitle('postAndStrip')
          .setDescription(
            `Clicks: **${ctx.state.get('count')}**\n\n` +
              'Each click should strip buttons from the previous message (content stays).',
          )
          .setColor(0x57f287),
      ])
      .setButtons((ctx) => [
        {
          label: `Click me (${ctx.state.get('count')})`,
          style: ButtonStyle.Success,
          action: async (ctx) => ctx.state.set('count', ctx.state.get('count') + 1),
        },
      ])
      .setReturnable()
      .build(),
  );

  // Demo 4a — message collection, edit in place
  // deleteUserMessages:true deletes the user's message; the bot message edits in place.
  flowcord.registerMenu('behavior-collect-edit', (session) =>
    new MenuBuilder<{ collected: string | null }>(session, 'behavior-collect-edit')
      .setMessageCleanup('edit')
      .setup((ctx) => ctx.state.set('collected', null))
      .setEmbeds((ctx) => {
        const collected = ctx.state.get('collected');
        return [
          new EmbedBuilder()
            .setTitle('Collect — edit in place')
            .setDescription(
              collected === null
                ? '**Type anything in this channel.**\n\nYour message will be deleted. This bot message will update in place.'
                : `**You sent:** ${collected}\n\nYour message was deleted. This message was edited in place.`,
            )
            .setColor(0xeb459e),
        ];
      })
      .setMessageHandler(
        async (ctx, text) => { ctx.state.set('collected', text); },
        { behavior: { deleteUserMessages: true } },
      )
      .setReturnable()
      .build(),
  );

  // Demo 4b — message collection, postAndStrip
  // deleteUserMessages:true deletes the user's message; the bot strips the old
  // message and posts a new one at the bottom.
  flowcord.registerMenu('behavior-collect-postnew', (session) =>
    new MenuBuilder<{ collected: string | null }>(session, 'behavior-collect-postnew')
      .setMessageCleanup('postAndStrip')
      .setup((ctx) => ctx.state.set('collected', null))
      .setEmbeds((ctx) => {
        const collected = ctx.state.get('collected');
        return [
          new EmbedBuilder()
            .setTitle('Collect — postAndStrip')
            .setDescription(
              collected === null
                ? '**Type anything in this channel.**\n\nYour message will be deleted. The bot will strip this message and repost at the bottom.'
                : `**You sent:** ${collected}\n\nYour message was deleted. This is the reposted result.`,
            )
            .setColor(0xfee75c),
        ];
      })
      .setMessageHandler(
        async (ctx, text) => { ctx.state.set('collected', text); },
        { behavior: { deleteUserMessages: true } },
      )
      .setReturnable()
      .build(),
  );

  // Demo 5 — ephemeral + postAndDelete + ephemeralFallbackDisposal
  // Discord does not allow bots to delete ephemeral messages, so the
  // ephemeralFallback fires and replaces the old message with a string instead.
  flowcord.registerMenu('behavior-ephemeral-fb', (session) =>
    new MenuBuilder<{ count: number }>(session, 'behavior-ephemeral-fb')
      .setEphemeral()
      .setMessageCleanup('postAndDelete', {
        ephemeralFallback: 'replace',
        closedMessage: '🔒 Ephemeral — cannot delete.',
      })
      .setup((ctx) => ctx.state.set('count', 0))
      .setEmbeds((ctx) => [
        new EmbedBuilder()
          .setTitle('Ephemeral + ephemeralFallback')
          .setDescription(
            `Clicks: **${ctx.state.get('count')}**\n\n` +
              'Disposal is set to `postAndDelete`, but this menu is ephemeral.\n' +
              'Discord does not allow deleting ephemeral messages, so the **ephemeralFallback** fires:\n' +
              'the old message should show **"🔒 Ephemeral — cannot delete."** instead.',
          )
          .setColor(0xfee75c),
      ])
      .setButtons((ctx) => [
        {
          label: `Click me (${ctx.state.get('count')})`,
          style: ButtonStyle.Primary,
          action: async (ctx) => ctx.state.set('count', ctx.state.get('count') + 1),
        },
      ])
      .setReturnable()
      .build(),
  );

  // Demo 6 — Per-interaction behavior overrides
  // The menu has no explicit messageCleanup (defaults to 'edit').
  // Individual buttons carry a behavior override for just their click:
  //   - Normal: edits in place (no override)
  //   - postAndDelete: deletes old message and reposts — reverts on next click
  //   - Reveal secret: posts ONE ephemeral message — reverts to public on next click
  flowcord.registerMenu('behavior-interaction-override', (session) =>
    new MenuBuilder<{ count: number }>(session, 'behavior-interaction-override')
      .setup((ctx) => ctx.state.set('count', 0))
      .setEmbeds((ctx) => [
        new EmbedBuilder()
          .setTitle('Interaction-Level Overrides')
          .setDescription(
            `Clicks: **${ctx.state.get('count')}**\n\n` +
              '**Normal** — edits in place (menu default).\n' +
              '**postAndDelete** — deletes old message and reposts (per-button override, reverts after).\n' +
              '**Reveal secret** — one-shot ephemeral postAndStrip (reverts to public on next click).',
          )
          .setColor(0x5865f2),
      ])
      .setButtons((ctx) => [
        {
          label: `Normal (${ctx.state.get('count')})`,
          style: ButtonStyle.Secondary,
          // No override — uses framework default (edit in place).
          action: async (ctx) => ctx.state.set('count', ctx.state.get('count') + 1),
        },
        {
          label: `postAndDelete (${ctx.state.get('count')})`,
          style: ButtonStyle.Primary,
          // Per-button: only this click deletes + reposts. Next click reverts to edit.
          behavior: { messageCleanup: 'postAndDelete' },
          action: async (ctx) => ctx.state.set('count', ctx.state.get('count') + 1),
        },
        {
          label: '🔍 Reveal secret',
          style: ButtonStyle.Success,
          // Per-button: posts ONE ephemeral message. Next interaction reverts to public.
          behavior: { ephemeral: true, messageCleanup: 'postAndStrip' },
          action: async (ctx) => ctx.state.set('count', ctx.state.get('count') + 1),
        },
      ])
      .setReturnable()
      .build(),
  );
}
```

---

## Key things to notice

- **All four `messageCleanup` modes have distinct visible effects.** Run each demo in a real Discord session to see the difference — `postAndDelete` removes the old message entirely, `postAndReplace` swaps it with a string, and `postAndStrip` leaves the embed but removes the buttons.
- **`ephemeralFallbackDisposal` only fires for `postAndDelete` on ephemeral messages.** Discord's API prevents bots from deleting ephemeral messages. When `ephemeralFallback: 'replace'` is set and the message is ephemeral, the framework falls back to replacing it with `closedMessage` instead of deleting it.
- **`deleteUserMessages` is set on the message handler's `behavior` option, not on the builder.** The behavior override on `setMessageHandler` applies to the render cycle that fires after collecting the message — this is where `deleteUserMessages` is read. Set it in `{ behavior: { deleteUserMessages: true } }`.
- **Per-interaction overrides are consumed after one render cycle.** The "postAndDelete" button and "Reveal secret" button both revert to the menu's default behavior on the very next click. There is no persistent state change — each override is scoped to the single interaction that triggered it.
- **Transient ephemeral via `behavior: { ephemeral: true }` on a button** is a pattern for revealing private information on an otherwise-public menu. The one-shot ephemeral message is only visible to the user who clicked; the next render returns to the public default.
- **The hub uses `setTrackedInHistory()`** so the Back button on each demo menu returns to it rather than closing the session.
