import { ButtonStyle, EmbedBuilder } from 'discord.js';

import {
  goTo,
  goBack,
  closeMenu,
  guard,
  pipeline,
} from '@flowcord/core';
import type { MenuSessionLike } from '@flowcord/core';
import { MenuBuilder } from '@flowcord/core';
import { MenuHarness } from '@flowcord/testing';

// ---------------------------------------------------------------------------
// Menu factories
// ---------------------------------------------------------------------------

const mockMainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
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

const mockDetailMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'detail')
    .setEmbeds(() => [])
    .setReturnable()
    .setFallbackMenu('main')
    .build();

const mockCancellableMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
    .setCancellable()
    .build();

const mockGuardedMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
    .setButtons(() => [
      {
        label: 'Blocked',
        style: ButtonStyle.Primary,
        action: pipeline(
          guard(async () => false, 'Access denied'),
          goTo('detail'),
        ),
      },
      {
        label: 'Close',
        style: ButtonStyle.Danger,
        action: closeMenu(),
      },
    ])
    .build();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('session lifecycle', () => {
  it('renders initial menu on start', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    expect(sim.lastRender.menuId).toBe('main');
    expect(sim.renders).toHaveLength(1);
    expect(sim.currentMenu).toBe('main');
  });

  it('navigates to detail menu via goTo()', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Go to Detail');

    expect(sim.renders.map((rdr) => rdr.menuId)).toEqual([
      'main',
      'detail',
    ]);
  });

  it('goBack() via reserved Back button returns to previous menu', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Go to Detail');
    await sim.goBack();

    expect(sim.renders.map((rdr) => rdr.menuId)).toEqual([
      'main',
      'detail',
      'main',
    ]);
  });

  it('cancel via reserved Cancel button ends session with reason=cancelled', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockCancellableMenu });
    await sim.start('main');

    await sim.cancel();

    expect(sim.terminals[0]?.reason).toBe('cancelled');
  });

  it('closeMenu() action ends session with reason=closed', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Close');

    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('guard failure does not navigate — menu re-renders on same page', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({
      main: mockGuardedMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');
    const renderCountBefore = sim.renderCount;

    await sim.click('Blocked');

    expect(sim.renderCount).toBe(renderCountBefore + 1);
    expect(sim.currentMenu).toBe('main');
    expect(sim.queryButton('Blocked')).not.toBeNull();
  });

  it('initialSessionState is readable in the first menu render', async () => {
    expect.assertions(1);
    const mockReaderMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `Greeting: ${ctx.sessionState.get('greeting')}`,
          ),
        ])
        .build();

    const sim = new MenuHarness(
      { main: mockReaderMenu },
      { initialSessionState: { greeting: 'hello' } },
    );
    await sim.start('main');

    expect(sim.hasText('Greeting: hello')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Async factory initialization
// ---------------------------------------------------------------------------

describe('async factory initialization', () => {
  const mockAsyncMenu = async (session: MenuSessionLike) => {
    return new MenuBuilder(session, 'main')
      .setEmbeds(() => [])
      .setButtons(() => [
        {
          label: 'Close',
          style: ButtonStyle.Danger,
          action: closeMenu(),
        },
      ])
      .build();
  };

  it('renders the initial menu when the factory is async', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockAsyncMenu });
    await sim.start('main');

    expect(sim.renders).toHaveLength(1);
  });

  it('throws when a sync factory returns a Promise without being declared async', async () => {
    expect.assertions(1);
    const mockSyncPromiseMenu = (session: MenuSessionLike) =>
      Promise.resolve(
        new MenuBuilder(session, 'main').setEmbeds(() => []).build(),
      );

    const sim = new MenuHarness({ main: mockSyncPromiseMenu });
    await expect(sim.start('main')).rejects.toThrow(
      'returned a Promise but is not declared async',
    );
  });
});

// ---------------------------------------------------------------------------
// openSubMenu / complete
// ---------------------------------------------------------------------------

describe('openSubMenu and complete', () => {
  const mockParentMenu = (session: MenuSessionLike) => {
    return new MenuBuilder<{ value: string | null }>(session, 'main')
      .setup((ctx) => {
        ctx.state.set('value', null);
      })
      .setEmbeds((ctx) => [
        new EmbedBuilder().setDescription(
          `Returned value: ${ctx.state.get('value') ?? 'none'}`,
        ),
      ])
      .setButtons(() => [
        {
          label: 'Open Sub',
          style: ButtonStyle.Primary,
          action: async (ctx) => {
            await ctx.openSubMenu('sub', {
              onComplete: async (ctx) => {
                ctx.state.set('value', 'sub-result');
              },
            });
          },
        },
      ])
      .setTrackedInHistory()
      .build();
  };

  const mockSubMenu = (session: MenuSessionLike) => {
    return new MenuBuilder(session, 'sub')
      .setEmbeds(() => [])
      .setButtons(() => [
        {
          label: 'Finish',
          style: ButtonStyle.Success,
          action: async (ctx) => {
            await ctx.complete('sub-result');
          },
        },
      ])
      .build();
  };

  it('openSubMenu() opens the sub menu', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({
      main: mockParentMenu,
      sub: mockSubMenu,
    });
    await sim.start('main');

    expect(sim.currentMenu).toBe('main');

    await sim.click('Open Sub');

    expect(sim.currentMenu).toBe('sub');
  });

  it('complete() returns the session to the parent menu with the completed result', async () => {
    expect.assertions(3);

    const sim = new MenuHarness({
      main: mockParentMenu,
      sub: mockSubMenu,
    });
    await sim.start('main');

    expect(sim.hasText('Returned value: none')).toBe(true);

    await sim.click('Open Sub');
    await sim.click('Finish');

    expect(sim.currentMenu).toBe('main');
    expect(sim.hasText('Returned value: sub-result')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hardRefresh
// ---------------------------------------------------------------------------

describe('hardRefresh', () => {
  it('re-renders the current menu from the factory', async () => {
    expect.assertions(2);
    const mockRefreshMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Refresh',
            style: ButtonStyle.Secondary,
            action: async (ctx) => {
              await ctx.hardRefresh();
            },
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockRefreshMenu });
    await sim.start('main');
    expect(sim.renders).toHaveLength(1);

    await sim.click('Refresh');
    expect(sim.renders).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Fallback menu (_activateFallbackMenu)
// ---------------------------------------------------------------------------

describe('fallback menu', () => {
  it('goBack() activates the fallback menu when the navigation stack is empty', async () => {
    expect.assertions(1);

    // Start directly at 'detail' — no history stack entry for 'main'
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('detail');

    await sim.goBack(); // falls back to main

    expect(sim.currentMenu).toBe('main');
  });

  it('goBack() with empty stack and no fallback menu closes the session', async () => {
    expect.assertions(1);
    const mockGoBackMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Go Back',
            style: ButtonStyle.Secondary,
            action: goBack(),
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockGoBackMenu });
    await sim.start('main');

    await sim.click('Go Back');

    expect(sim.terminals[0]?.reason).toBe('closed');
  });
});
