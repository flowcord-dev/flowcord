import { ButtonStyle, EmbedBuilder } from 'discord.js';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { goTo, goBack } from '../../action';
import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuHarness } from '../MenuHarness';

// Reusable detail menu: returnable with a Back button and fallback to 'main'.
const mockDetailMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'detail')
    .setEmbeds(() => [])
    .setButtons(() => [
      { label: 'Back', style: ButtonStyle.Secondary, action: goBack() },
    ])
    .setReturnable()
    .setFallbackMenu('main')
    .build();

describe('menu-local state', () => {
  it('state is initialized via setup() and persists across re-renders', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder<{ count: number }>(session, 'main')
        .setup((ctx) => {
          ctx.state.set('count', 0);
        })
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(`Count: ${ctx.state.get('count')}`),
        ])
        .setButtons(() => [
          {
            label: 'Increment',
            style: ButtonStyle.Primary,
            action: async (ctx) => {
              ctx.state.set('count', ctx.state.get('count') + 1);
            },
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.hasText('Count: 0')).toBe(true);

    await sim.click('Increment');
    expect(sim.hasText('Count: 1')).toBe(true);

    await sim.click('Increment');
    expect(sim.hasText('Count: 2')).toBe(true);

    await sim.end();
  });

  it('menu-local state resets when re-entering a menu without setPreserveStateOnReturn()', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder<{ count: number }>(session, 'main')
        .setup((ctx) => {
          ctx.state.set('count', 0);
        })
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(`Count: ${ctx.state.get('count')}`),
        ])
        .setButtons(() => [
          {
            label: 'Increment',
            style: ButtonStyle.Primary,
            action: async (ctx) => {
              ctx.state.set('count', ctx.state.get('count') + 1);
            },
          },
          {
            label: 'Go to Detail',
            style: ButtonStyle.Secondary,
            action: goTo('detail'),
          },
        ])
        .setTrackedInHistory() // tracked but NOT preserveStateOnReturn
        .build();

    const sim = new MenuHarness({ main: mockMainMenu, detail: mockDetailMenu });
    await sim.start('main');

    expect(sim.hasText('Count: 0')).toBe(true);

    // Increment state to 3
    for (let idx = 0; idx < 3; idx++) {
      await sim.click('Increment');
    }

    expect(sim.hasText('Count: 3')).toBe(true);

    // Navigate away and back — state should reset since no preserveStateOnReturn
    await sim.click('Go to Detail');
    await sim.click('Back');

    expect(sim.hasText('Count: 0')).toBe(true);

    await sim.end();
  });

  it('setPreserveStateOnReturn() keeps menu-local state when going back', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder<{ count: number }>(session, 'main')
        .setup((ctx) => {
          ctx.state.set('count', 0);
        })
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(`Count: ${ctx.state.get('count')}`),
        ])
        .setButtons(() => [
          {
            label: 'Increment',
            style: ButtonStyle.Primary,
            action: async (ctx) => {
              ctx.state.set('count', ctx.state.get('count') + 1);
            },
          },
          {
            label: 'Go to Detail',
            style: ButtonStyle.Secondary,
            action: goTo('detail'),
          },
        ])
        .setTrackedInHistory()
        .setPreserveStateOnReturn()
        .build();

    const sim = new MenuHarness({ main: mockMainMenu, detail: mockDetailMenu });
    await sim.start('main');

    expect(sim.hasText('Count: 0')).toBe(true);

    // Increment to 5
    for (let idx = 0; idx < 5; idx++) {
      await sim.click('Increment');
    }

    expect(sim.hasText('Count: 5')).toBe(true);

    // Navigate away and back
    await sim.click('Go to Detail');
    await sim.click('Back');

    expect(sim.hasText('Count: 5')).toBe(true);

    await sim.end();
  });
});

describe('session state', () => {
  it('sessionState is shared across menus within a session', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setup((ctx) => {
          ctx.sessionState.set('shared', 'hello');
        })
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Go to Detail',
            style: ButtonStyle.Primary,
            action: goTo('detail'),
          },
        ])
        .setTrackedInHistory()
        .build();

    const mockDetailMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'detail')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(`Shared: ${ctx.sessionState.get('shared')}`),
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu, detail: mockDetailMenu });
    await sim.start('main');

    await sim.click('Go to Detail');

    expect(sim.hasText('Shared: hello')).toBe(true);

    await sim.end();
  });

  it('initialSessionState is available in setup() of the first menu', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(`Role: ${ctx.sessionState.get('role')}`),
        ])
        .build();

    const sim = new MenuHarness(
      { main: mockMainMenu },
      { initialSessionState: { role: 'admin' } },
    );
    await sim.start('main');

    expect(sim.hasText('Role: admin')).toBe(true);

    await sim.end();
  });

  it('sessionState mutations from one menu are visible in subsequent menus', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Go to Detail',
            style: ButtonStyle.Primary,
            action: async (ctx) => {
              ctx.sessionState.set('step', 'visited-main');
              return goTo('detail')(ctx);
            },
          },
        ])
        .setTrackedInHistory()
        .build();

    const mockDetailMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'detail')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(`Step: ${ctx.sessionState.get('step')}`),
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu, detail: mockDetailMenu });
    await sim.start('main');

    await sim.click('Go to Detail');

    expect(sim.hasText('Step: visited-main')).toBe(true);

    await sim.end();
  });
});
