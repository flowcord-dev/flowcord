import { ButtonStyle } from 'discord.js';

import {
  goTo,
  goBack,
  closeMenu,
  guard,
  pipeline,
} from '../../action';
import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { createTestSession } from '../createTestSession';
import { click, findButtonId, reservedClick } from './helpers';

// ---------------------------------------------------------------------------
// Menu factories
// ---------------------------------------------------------------------------

function mockMainMenu(session: MenuSessionLike) {
  return new MenuBuilder(session, 'main')
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
}

function mockDetailMenu(session: MenuSessionLike) {
  return new MenuBuilder(session, 'detail')
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
}

function mockCancellableMenu(session: MenuSessionLike) {
  return new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
    .setButtons(() => [])
    .setCancellable()
    .build();
}

function mockGuardedMenu(session: MenuSessionLike) {
  return new MenuBuilder(session, 'main')
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
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('session lifecycle', () => {
  it('renders initial menu on start', async () => {
    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();

    expect(adapter.lastRender).not.toBeNull();
    expect(adapter.renders).toHaveLength(1);

    // Clean up — close the session
    const closeId = findButtonId(adapter.lastRender!, 'Close');
    expect(closeId).not.toBeNull();
    adapter.enqueueComponent(click(closeId!));
    await done;
    expect(adapter.terminals[0]?.reason).toBe('closed');
  });

  it('navigates to detail menu via goTo()', async () => {
    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();

    const goDetailId = findButtonId(
      adapter.lastRender!,
      'Go to Detail',
    );
    expect(goDetailId).not.toBeNull();
    adapter.enqueueComponent(click(goDetailId!));
    await adapter.waitForNextRender();

    expect(adapter.renders).toHaveLength(2);

    // Navigate back via goBack() action button
    const backId = findButtonId(adapter.lastRender!, 'Back');
    expect(backId).not.toBeNull();
    adapter.enqueueComponent(click(backId!));
    await adapter.waitForNextRender();

    expect(adapter.renders).toHaveLength(3);

    // Close from main
    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
    expect(adapter.terminals[0]?.reason).toBe('closed');
  });

  it('goBack() via reserved Back button returns to previous menu', async () => {
    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();

    const goDetailId = findButtonId(
      adapter.lastRender!,
      'Go to Detail',
    );
    adapter.enqueueComponent(click(goDetailId!));
    await adapter.waitForNextRender();

    // Use reserved back button (injected by setReturnable)
    const reservedBack = reservedClick(
      adapter.lastRender!,
      '__reserved_back',
      'detail',
    );
    adapter.enqueueComponent(reservedBack);
    await adapter.waitForNextRender();

    expect(adapter.renders).toHaveLength(3);

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
    expect(adapter.terminals[0]?.reason).toBe('closed');
  });

  it('cancel via reserved Cancel button ends session with reason=cancelled', async () => {
    const { adapter, startSession } = createTestSession({
      main: mockCancellableMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();

    const cancelId = reservedClick(
      adapter.lastRender!,
      '__reserved_cancel',
      'main',
    );
    adapter.enqueueComponent(cancelId);
    await done;

    expect(adapter.terminals[0]?.reason).toBe('cancelled');
  });

  it('closeMenu() action ends session with reason=closed', async () => {
    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;

    expect(adapter.terminals[0]?.reason).toBe('closed');
  });

  it('endPromise resolves to the terminal reason', async () => {
    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));

    const reason = await adapter.endPromise;
    expect(reason).toBe('closed');
    await done;
  });

  it('guard failure does not navigate — menu re-renders on same page', async () => {
    const { adapter, startSession } = createTestSession({
      main: mockGuardedMenu,
      detail: mockDetailMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();
    const renderCountBefore = adapter.renderCount;

    const blockedId = findButtonId(adapter.lastRender!, 'Blocked');
    adapter.enqueueComponent(click(blockedId!));

    // Session should re-render (guard failure re-renders current menu)
    await adapter.waitForNextRender();
    expect(adapter.renderCount).toBe(renderCountBefore + 1);

    // Session should still be on 'main' — it did not navigate to 'detail'
    // (we can verify by checking the 'Blocked' button is still present)
    const stillHasBlocked = findButtonId(
      adapter.lastRender!,
      'Blocked',
    );
    expect(stillHasBlocked).not.toBeNull();

    // Clean up — close the session so the queue doesn't leave open handles
    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
    expect(adapter.terminals[0]?.reason).toBe('closed');
  });

  it('initialSessionState is readable in the first menu render', async () => {
    let capturedValue: unknown;

    function makeReader(session: MenuSessionLike) {
      return new MenuBuilder(session, 'main')
        .setup((ctx) => {
          capturedValue = ctx.sessionState.get('greeting');
        })
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Close',
            style: ButtonStyle.Danger,
            action: closeMenu(),
          },
        ])
        .build();
    }

    const { adapter, startSession } = createTestSession(
      { main: makeReader },
      { initialSessionState: { greeting: 'hello' } },
    );
    const done = startSession('main');
    await adapter.waitForNextRender();

    expect(capturedValue).toBe('hello');

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
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
    const { adapter, startSession } = createTestSession({
      main: mockAsyncMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();

    expect(adapter.renders).toHaveLength(1);

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
    expect(adapter.terminals[0]?.reason).toBe('closed');
  });

  it('throws when a sync factory returns a Promise without being declared async', async () => {
    // Regular (non-async) function that returns a Promise — the framework
    // detects the mismatch at runtime and throws a descriptive error.
    const mockMainMenu = (session: MenuSessionLike) =>
      Promise.resolve(
        new MenuBuilder(session, 'main').setEmbeds(() => []).build(),
      );

    const { startSession } = createTestSession({
      main: mockMainMenu,
    });
    await expect(startSession('main')).rejects.toThrow(
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

    const mockMainMenu = (session: MenuSessionLike) => {
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
          {
            label: 'Close',
            style: ButtonStyle.Danger,
            action: closeMenu(),
          },
        ])
        .setTrackedInHistory()
        .build();
    };

    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      sub: mockSubMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender(); // main menu
    const openId = findButtonId(adapter.lastRender!, 'Open Sub');
    adapter.enqueueComponent(click(openId!));
    await adapter.waitForNextRender(); // sub menu

    const finishId = findButtonId(adapter.lastRender!, 'Finish');
    adapter.enqueueComponent(click(finishId!));
    await adapter.waitForNextRender(); // back to main

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.anything(),
      'sub-result',
    );

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
  });

  it('complete() returns the session to the parent menu', async () => {
    const mockMainMenu = (session: MenuSessionLike) => {
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
          {
            label: 'Close',
            style: ButtonStyle.Danger,
            action: closeMenu(),
          },
        ])
        .setTrackedInHistory()
        .build();
    };

    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      sub: mockSubMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender(); // main menu
    const openId = findButtonId(adapter.lastRender!, 'Open Sub');
    adapter.enqueueComponent(click(openId!));
    await adapter.waitForNextRender(); // sub menu

    const finishId = findButtonId(adapter.lastRender!, 'Finish');
    adapter.enqueueComponent(click(finishId!));
    await adapter.waitForNextRender(); // back to main

    // Parent menu's 'Open Sub' button is visible again
    expect(
      findButtonId(adapter.lastRender!, 'Open Sub'),
    ).not.toBeNull();

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
  });
});

// ---------------------------------------------------------------------------
// hardRefresh
// ---------------------------------------------------------------------------

describe('hardRefresh', () => {
  it('re-renders the current menu from the factory', async () => {
    const mockMainMenu = (session: MenuSessionLike) => {
      return new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Refresh',
            style: ButtonStyle.Secondary,
            action: async (ctx) => {
              await ctx.hardRefresh();
            },
          },
          {
            label: 'Close',
            style: ButtonStyle.Danger,
            action: closeMenu(),
          },
        ])
        .build();
    };

    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
    });
    const done = startSession('main');

    await adapter.waitForNextRender();
    expect(adapter.renders).toHaveLength(1);

    const refreshId = findButtonId(adapter.lastRender!, 'Refresh');
    adapter.enqueueComponent(click(refreshId!));
    await adapter.waitForNextRender();

    expect(adapter.renders).toHaveLength(2);

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
  });
});

// ---------------------------------------------------------------------------
// Fallback menu (_activateFallbackMenu)
// ---------------------------------------------------------------------------

describe('fallback menu', () => {
  it('goBack() activates the fallback menu when the navigation stack is empty', async () => {
    const mockMainMenu = (session: MenuSessionLike) => {
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

    const mockDetailMenu = (session: MenuSessionLike) => {
      return new MenuBuilder(session, 'detail')
        .setEmbeds(() => [])
        .setButtons(() => [])
        .setReturnable()
        .setFallbackMenu('main')
        .build();
    };

    // Start directly at 'detail' — no history stack entry for 'main'
    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    const done = startSession('detail');

    await adapter.waitForNextRender(); // detail menu

    const backClick = reservedClick(
      adapter.lastRender!,
      '__reserved_back',
      'detail',
    );
    adapter.enqueueComponent(backClick);
    await adapter.waitForNextRender(); // fallback: main menu

    // Main menu's 'Close' button is visible
    expect(findButtonId(adapter.lastRender!, 'Close')).not.toBeNull();

    const closeId = findButtonId(adapter.lastRender!, 'Close');
    adapter.enqueueComponent(click(closeId!));
    await done;
    expect(adapter.terminals[0]?.reason).toBe('closed');
  });

  it('goBack() with empty stack and no fallback menu closes the session', async () => {
    const mockMainMenu = (session: MenuSessionLike) => {
      return new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Go Back',
            style: ButtonStyle.Secondary,
            action: goBack(),
          },
        ])
        .build();
    };

    const { adapter, startSession } = createTestSession({
      main: mockMainMenu,
    });
    const done = startSession('main');
    await adapter.waitForNextRender();

    const backId = findButtonId(adapter.lastRender!, 'Go Back');
    adapter.enqueueComponent(click(backId!));
    await done;

    expect(adapter.terminals[0]?.reason).toBe('closed');
  });
});
