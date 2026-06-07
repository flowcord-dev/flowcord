import { ButtonStyle } from 'discord.js';

import { goTo, goBack, closeMenu } from '../../action';
import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { MenuHarness } from '../MenuHarness';

describe('layout mode rendering', () => {
  it('layout menu payload has mode=layout and layoutComponents', async () => {
    expect.assertions(6);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setLayout(() => [
          { type: 'text_display', content: 'Hello layout' },
          {
            type: 'action_row',
            children: [
              {
                type: 'button' as const,
                label: 'Action',
                style: ButtonStyle.Primary,
                action: async () => {},
              },
            ],
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.lastRender.payload.mode).toBe('layout');
    expect(sim.lastRender.payload.layoutComponents).toBeDefined();
    expect(
      Array.isArray(sim.lastRender.payload.layoutComponents),
    ).toBe(true);
    expect(sim.lastRender.payload.embeds).toBeUndefined();
    expect(sim.lastRender.payload.components).toBeUndefined();

    expect(sim.queryButton('Action')).not.toBeNull();
  });

  it('buttons inside layout action rows are interactive', async () => {
    expect.assertions(2);
    let clicked = false;

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setLayout(() => [
          { type: 'text_display', content: 'Press the button' },
          {
            type: 'action_row',
            children: [
              {
                type: 'button' as const,
                label: 'Click Me',
                style: ButtonStyle.Primary,
                action: async () => {
                  clicked = true;
                },
              },
            ],
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.queryButton('Click Me')).not.toBeNull();
    await sim.click('Click Me');

    expect(clicked).toBe(true);
  });

  it('layout components include text_display content in the serialized payload', async () => {
    expect.assertions(1);
    const TEXT = 'Unique layout text content';

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setLayout(() => [
          { type: 'text_display', content: TEXT },
          {
            type: 'action_row',
            children: [
              {
                type: 'button' as const,
                label: 'Action',
                style: ButtonStyle.Primary,
                action: async () => {},
              },
            ],
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.hasText(TEXT)).toBe(true);
  });
});

describe('layout mode navigation', () => {
  it('navigates from layout menu to layout menu and back', async () => {
    expect.assertions(4);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setLayout(() => [
          { type: 'text_display', content: 'Main' },
          {
            type: 'action_row',
            children: [
              {
                type: 'button' as const,
                label: 'Go Detail',
                style: ButtonStyle.Primary,
                action: goTo('detail'),
              },
            ],
          },
        ])
        .setTrackedInHistory()
        .build();

    const mockDetailMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'detail')
        .setLayout(() => [
          { type: 'text_display', content: 'Detail' },
          {
            type: 'action_row',
            children: [
              {
                type: 'button' as const,
                label: 'Back',
                style: ButtonStyle.Secondary,
                action: goBack(),
              },
            ],
          },
        ])
        .setFallbackMenu('main')
        .build();

    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    expect(sim.lastRender.payload.mode).toBe('layout');

    await sim.click('Go Detail');

    expect(sim.lastRender.payload.mode).toBe('layout');
    expect(sim.hasText('Detail')).toBe(true);

    await sim.click('Back');

    expect(sim.hasText('Main')).toBe(true);
  });
});

describe('layout mode — cancel button', () => {
  it('setCancellable() injects cancel reserved button; clicking it closes the session', async () => {
    expect.assertions(1);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setLayout(() => [
          { type: 'text_display', content: 'Cancellable menu' },
        ])
        .setCancellable()
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.cancel();

    expect(sim.terminals[0]?.reason).toBe('cancelled');
  });
});

describe('layout mode — close button terminal reason', () => {
  it('closeMenu() in a layout menu ends session with reason=closed', async () => {
    expect.assertions(1);
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setLayout(() => [
          { type: 'text_display', content: 'Closeable menu' },
          {
            type: 'action_row',
            children: [
              {
                type: 'button' as const,
                label: 'Close',
                style: ButtonStyle.Danger,
                action: closeMenu(),
              },
            ],
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    await sim.click('Close');

    expect(sim.terminals[0]?.reason).toBe('closed');
  });
});
