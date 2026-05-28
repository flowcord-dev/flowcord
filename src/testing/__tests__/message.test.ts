import { ButtonStyle } from 'discord.js';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { closeMenu } from '../../action';
import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuHarness } from '../MenuHarness';

describe('message-collection menus', () => {
  it('message handler receives the message content', async () => {
    let captured: string | null = null;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setMessageHandler(async (ctx, response) => {
          captured = response;
          await closeMenu()(ctx);
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    // sendMessage waits for next render; closeMenu() sends a terminal payload
    // which also wakes up render listeners, so this resolves cleanly.
    await sim.sendMessage('hello world');

    expect(captured).toBe('hello world');
  });

  it('message handler is called on each message', async () => {
    const received: string[] = [];
    let callCount = 0;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setMessageHandler(async (ctx, response) => {
          received.push(response);
          callCount++;
          if (callCount >= 2) {
            await closeMenu()(ctx);
          }
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.sendMessage('first');
    await sim.sendMessage('second');

    expect(received).toEqual(['first', 'second']);
  });
});

describe('mixed interaction menus (buttons + message handler)', () => {
  it('message wins the race — handler is called', async () => {
    let msgHandled: string | null = null;
    let btnClicked = false;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Action',
            style: ButtonStyle.Primary,
            action: async () => {
              btnClicked = true;
            },
          },
        ])
        .setMessageHandler(async (ctx, response) => {
          msgHandled = response;
          await closeMenu()(ctx);
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.sendMessage('typed text');

    expect(msgHandled).toBe('typed text');
    expect(btnClicked).toBe(false);
  });

  it('button wins the race — action is called, not message handler', async () => {
    let msgHandled: string | null = null;
    let btnClicked = false;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Action',
            style: ButtonStyle.Primary,
            action: async () => {
              btnClicked = true;
            },
          },
        ])
        .setMessageHandler(async (_ctx, response) => {
          msgHandled = response;
        })
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.click('Action');

    expect(btnClicked).toBe(true);
    expect(msgHandled).toBeNull();

    await sim.end();
  });
});
