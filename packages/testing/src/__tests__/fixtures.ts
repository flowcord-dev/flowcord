/**
 * Shared menu factories for the MenuHarness test suite. Not a test file — jest's
 * testMatch only picks up `*.test.ts`, and `__tests__` is excluded from coverage.
 */
import {
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import {
  closeMenu,
  goTo,
  MenuBuilder,
  type MenuSessionLike,
} from '@flowcord/core';

export const MODAL_ID = 'my-modal';

export function buildSelect(): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId('my-select')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Option A')
        .setValue('a'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Option B')
        .setValue('b'),
    );
}

export function buildModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle('Test Modal')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Your Name')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('name-field')
            .setStyle(TextInputStyle.Short),
        ),
    );
}

/** Main menu: lifecycle hooks, an embed, two buttons, tracked in history. */
export const mockMainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setup(() => {})
    .onEnter(() => {})
    .beforeRender(() => {})
    .afterRender(() => {})
    .onLeave(() => {})
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('Main Menu')
        .setDescription('Welcome to the main menu')
        .addFields({
          name: 'Status',
          value: 'Active',
          inline: false,
        }),
    ])
    .setButtons(() => [
      {
        label: 'Go to Detail',
        style: ButtonStyle.Primary,
        action: goTo('detail'),
      },
      {
        label: 'Close',
        style: ButtonStyle.Danger,
        action: closeMenu(),
      },
    ])
    .setTrackedInHistory()
    .build();

/** Detail menu: a single identified button, returnable to main. */
export const mockDetailMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'detail')
    .onEnter(() => {})
    .setEmbeds(() => [
      new EmbedBuilder().setDescription('Detail page content'),
    ])
    .setButtons(() => [
      {
        id: 'noop-button',
        label: 'Noop',
        style: ButtonStyle.Secondary,
        action: async () => {},
      },
    ])
    .setReturnable()
    .setFallbackMenu('main')
    .build();

/** Plain menu with a no-op select for finder tests. */
export const mockSelectMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
    .setSelectMenu(() => ({
      builder: buildSelect(),
      onSelect: async () => {},
    }))
    .build();

/** Select menu that records picked values into state. */
export const mockSelectCaptureMenu = (session: MenuSessionLike) =>
  new MenuBuilder<{ picks: string[] }>(session, 'main')
    .setup((ctx) => {
      ctx.state.set('picks', []);
    })
    .setEmbeds((ctx) => [
      new EmbedBuilder().setDescription(
        `Picks: ${ctx.state.get('picks').join(', ')}`,
      ),
    ])
    .setSelectMenu(() => ({
      builder: buildSelect(),
      onSelect: async (ctx, values) => {
        ctx.state.set('picks', [...ctx.state.get('picks'), ...values]);
      },
    }))
    .build();

/** Menu with an embed but no interactive components. */
export const mockPlainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [
      new EmbedBuilder().setDescription('No components here'),
    ])
    .build();

/** Menu that echoes the most recent collected message. */
export const mockMessageMenu = (session: MenuSessionLike) =>
  new MenuBuilder<{ last: string }>(session, 'main')
    .setup((ctx) => {
      ctx.state.set('last', '');
    })
    .setEmbeds((ctx) => [
      new EmbedBuilder().setDescription(
        `Message: ${ctx.state.get('last')}`,
      ),
    ])
    .setMessageHandler(async (ctx, response) => {
      ctx.state.set('last', response);
    })
    .build();

/** Menu with a button that opens a modal writing its field into state. */
export const mockModalMenu = (session: MenuSessionLike) =>
  new MenuBuilder<{ name: string }>(session, 'main')
    .setEmbeds((ctx) => [
      new EmbedBuilder().setDescription(
        `Name: ${ctx.state.get('name')}`,
      ),
    ])
    .setButtons(() => [
      {
        label: 'Open Modal',
        style: ButtonStyle.Primary,
        id: 'open-modal',
        opensModal: MODAL_ID,
      },
    ])
    .setModal(() => [
      {
        id: MODAL_ID,
        builder: buildModal(),
        onSubmit: async (ctx, fields) => {
          ctx.state.set(
            'name',
            fields.getField('name-field', ComponentType.TextInput)
              .value,
          );
        },
      },
    ])
    .build();

/** Menu with list pagination over 20 items, 10 per page. */
export const mockPaginatedMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setListPagination({
      getTotalQuantityItems: () => 20,
      itemsPerPage: 10,
    })
    .setEmbeds((ctx) => {
      if (!ctx.pagination) return [];
      return [
        new EmbedBuilder().setDescription(
          `Page ${ctx.pagination.currentPage + 1} of ${ctx.pagination.totalPages}`,
        ),
      ];
    })
    .build();

/** Menu that injects the reserved Cancel button. */
export const mockCancellableMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [
      new EmbedBuilder().setDescription('Cancellable'),
    ])
    .setCancellable()
    .build();

/** Menu that renders a value read from seeded session state. */
export const mockRoleMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds((ctx) => [
      new EmbedBuilder().setDescription(
        `Role: ${ctx.sessionState.get('role')}`,
      ),
    ])
    .build();

/** Layout (Components V2) menu with a text display and a nested button. */
export const mockLayoutMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setLayout(() => [
      { type: 'text_display', content: 'Layout heading' },
      {
        type: 'action_row',
        children: [
          {
            type: 'button' as const,
            label: 'Layout Action',
            style: ButtonStyle.Primary,
            action: async () => {},
          },
        ],
      },
    ])
    .build();
