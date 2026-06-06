import { ButtonStyle, EmbedBuilder } from 'discord.js';

import {
  goTo,
  goBack,
  closeMenu,
  guard,
  pipeline,
} from '../../action';
import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { MenuHarness } from '../MenuHarness';

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
    .setButtons(() => [
      {
        label: 'Back',
        style: ButtonStyle.Secondary,
        action: goBack(),
      },
    ])
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
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    expect(sim.lastRender).not.toBeNull();
    expect(sim.renders).toHaveLength(1);
    expect(sim.currentMenu).toBe('main');

    await sim.click('Close');
    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('navigates to detail menu via goTo()', async () => {
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Go to Detail');
    await sim.click('Back');

    expect(sim.renders.map((rdr) => rdr.menuId)).toEqual([
      'main',
      'detail',
      'main',
    ]);

    await sim.click('Close');
    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('goBack() via reserved Back button returns to previous menu', async () => {
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

    await sim.click('Close');
    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('cancel via reserved Cancel button ends session with reason=cancelled', async () => {
    const sim = new MenuHarness({ main: mockCancellableMenu });
    await sim.start('main');

    await sim.cancel();

    expect(sim.terminals[0]?.reason).toBe('cancelled');
  });

  it('closeMenu() action ends session with reason=closed', async () => {
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Close');

    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('endPromise resolves to the terminal reason', async () => {
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Close');

    const reason = await sim.adapter.endPromise;
    expect(reason).toBe('closed');
  });

  it('guard failure does not navigate — menu re-renders on same page', async () => {
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

    await sim.click('Close');
    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('initialSessionState is readable in the first menu render', async () => {
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
    const sim = new MenuHarness({ main: mockAsyncMenu });
    await sim.start('main');

    expect(sim.renders).toHaveLength(1);

    await sim.click('Close');
    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('throws when a sync factory returns a Promise without being declared async', async () => {
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

  it('onComplete receives the result passed to complete()', async () => {
    const onComplete = jest.fn().mockResolvedValue(undefined);

    const mockParentMenu = (session: MenuSessionLike) => {
      return new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Open Sub',
            style: ButtonStyle.Primary,
            action: async (ctx) => {
              await ctx.openSubMenu('sub', { onComplete });
            },
          },
        ])
        .setTrackedInHistory()
        .build();
    };

    const sim = new MenuHarness({
      main: mockParentMenu,
      sub: mockSubMenu,
    });
    await sim.start('main');

    await sim.click('Open Sub');
    await sim.click('Finish');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.anything(),
      'sub-result',
    );
  });

  it('complete() returns the session to the parent menu', async () => {
    const mockParentMenu = (session: MenuSessionLike) => {
      return new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Open Sub',
            style: ButtonStyle.Primary,
            action: async (ctx) => {
              await ctx.openSubMenu('sub', {
                onComplete: async () => {},
              });
            },
          },
        ])
        .setTrackedInHistory()
        .build();
    };

    const sim = new MenuHarness({
      main: mockParentMenu,
      sub: mockSubMenu,
    });
    await sim.start('main');

    await sim.click('Open Sub');
    await sim.click('Finish');

    expect(sim.currentMenu).toBe('main');
    expect(sim.queryButton('Open Sub')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hardRefresh
// ---------------------------------------------------------------------------

describe('hardRefresh', () => {
  it('re-renders the current menu from the factory', async () => {
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
    const mockFallbackDetailMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'detail')
        .setEmbeds(() => [])
        .setReturnable()
        .setFallbackMenu('main')
        .build();

    // Start directly at 'detail' — no history stack entry for 'main'
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockFallbackDetailMenu,
    });
    await sim.start('detail');

    await sim.goBack(); // falls back to main

    expect(sim.currentMenu).toBe('main');
    expect(sim.queryButton('Close')).not.toBeNull();

    await sim.click('Close');
    expect(sim.terminals[0]?.reason).toBe('closed');
  });

  it('goBack() with empty stack and no fallback menu closes the session', async () => {
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
