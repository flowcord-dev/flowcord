import { ButtonStyle, EmbedBuilder } from 'discord.js';

import { MenuBuilder, type MenuSessionLike } from '@flowcord/core';
import { MenuHarness } from '@flowcord/testing';

describe('message-collection menus', () => {
  it('message handler receives the message content', async () => {
    expect.assertions(1);

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder<{ lastMessage: string }>(session, 'main')
        .setup((ctx) => {
          ctx.state.set('lastMessage', '');
        })
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `Message: ${ctx.state.get('lastMessage')}`,
          ),
        ])
        .setMessageHandler(async (ctx, response) => {
          ctx.state.set('lastMessage', response);
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.sendMessage('hello world');

    expect(sim.hasText('Message: hello world')).toBe(true);
  });

  it('message handler is called on each message', async () => {
    expect.assertions(2);

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder<{ messages: string[] }>(session, 'main')
        .setup((ctx) => {
          ctx.state.set('messages', []);
        })
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `Messages: ${ctx.state.get('messages').join(', ')}`,
          ),
        ])
        .setMessageHandler(async (ctx, response) => {
          const messages = ctx.state.get('messages');
          ctx.state.set('messages', [...messages, response]);
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.sendMessage('first');
    expect(sim.hasText('Messages: first')).toBe(true);

    await sim.sendMessage('second');
    expect(sim.hasText('Messages: first, second')).toBe(true);
  });
});

describe('mixed interaction menus (buttons + message handler)', () => {
  const mockMainMenu = (session: MenuSessionLike) =>
    new MenuBuilder<{ source: string }>(session, 'main')
      .setup((ctx) => {
        ctx.state.set('source', 'none');
      })
      .setEmbeds((ctx) => [
        new EmbedBuilder().setDescription(
          `Source: ${ctx.state.get('source')}`,
        ),
      ])
      .setButtons(() => [
        {
          label: 'Action',
          style: ButtonStyle.Primary,
          action: async (ctx) => {
            ctx.state.set('source', 'button');
          },
        },
      ])
      .setMessageHandler(async (ctx, response) => {
        ctx.state.set('source', `message:${response}`);
      })
      .build();

  it('message wins the race — handler is called', async () => {
    expect.assertions(2);

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.sendMessage('typed text');

    expect(sim.hasText('Source: message:typed text')).toBe(true);
    expect(sim.hasText('Source: button')).toBe(false);
  });

  it('button wins the race — action is called, not message handler', async () => {
    expect.assertions(2);

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.click('Action');

    expect(sim.hasText('Source: button')).toBe(true);
    expect(sim.hasText('Source: message')).toBe(false);
  });
});
