import {
  mockClient,
  mockCommandInteraction,
  mockComponentInteraction,
} from '@flowcord/core/mocks';
import { MenuEngine } from '../MenuEngine';
import { MenuSession } from '../MenuSession';
import { MenuInstance } from '../../menu/MenuInstance';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

describe('configuration', () => {
  it('timeout defaults to 120 000 ms', () => {
    const engine = new MenuEngine({ client: mockClient() });
    expect(engine.timeout).toBe(120_000);
  });

  it('timeout returns the configured value', () => {
    const engine = new MenuEngine({
      client: mockClient(),
      timeout: 30_000,
    });
    expect(engine.timeout).toBe(30_000);
  });

  it('globalBehavior is undefined when not configured', () => {
    const engine = new MenuEngine({ client: mockClient() });
    expect(engine.globalBehavior).toBeUndefined();
  });

  it('globalBehavior returns the configured policy', () => {
    const policy = { default: { ephemeral: true } };
    const engine = new MenuEngine({
      client: mockClient(),
      behavior: policy,
    });
    expect(engine.globalBehavior).toStrictEqual(policy);
  });

  it('enableTracing: true — tracer records emitted events', () => {
    const engine = new MenuEngine({
      client: mockClient(),
      enableTracing: true,
    });
    engine.tracer.record({
      from: 'menu-a',
      to: 'menu-b',
      sessionId: 'sess-1',
      userId: 'usr-1',
      timestamp: 0,
      direction: 'forward',
    });
    expect(engine.tracer.events).toHaveLength(1);
  });

  it('tracer is disabled by default — events are not stored', () => {
    const engine = new MenuEngine({ client: mockClient() });
    engine.tracer.record({
      from: 'menu-a',
      to: 'menu-b',
      sessionId: 'sess-1',
      userId: 'usr-1',
      timestamp: 0,
      direction: 'forward',
    });
    expect(engine.tracer.events).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('registerMenu', () => {
  it('makes the factory retrievable from menuRegistry', () => {
    const engine = new MenuEngine({ client: mockClient() });
    const factory = jest.fn();
    engine.registerMenu('nav-menu', factory);

    expect(engine.menuRegistry.has('nav-menu')).toBe(true);
    expect(engine.menuRegistry.getFactory('nav-menu')).toBe(factory);
  });
});

// ---------------------------------------------------------------------------
// Session tracking
// ---------------------------------------------------------------------------

describe('activeSessionCount', () => {
  it('starts at zero', () => {
    const engine = new MenuEngine({ client: mockClient() });
    expect(engine.activeSessionCount).toBe(0);
  });
});

describe('getSession', () => {
  it('returns undefined for an unknown session ID', () => {
    const engine = new MenuEngine({ client: mockClient() });
    expect(engine.getSession('ghost-sess')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// routeComponentInteraction
// ---------------------------------------------------------------------------

describe('routeComponentInteraction', () => {
  it('returns false when the customId has no FlowCord session prefix', () => {
    const engine = new MenuEngine({ client: mockClient() });
    const result = engine.routeComponentInteraction(
      mockComponentInteraction({
        customId: 'plain-btn',
      }),
    );
    expect(result).toBe(false);
  });

  it('returns false when the parsed sessionId does not match any active session', () => {
    const engine = new MenuEngine({ client: mockClient() });
    const result = engine.routeComponentInteraction(
      mockComponentInteraction({
        customId: 'ghost-sess:main:btn',
      }),
    );
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFlowCordInteraction
// ---------------------------------------------------------------------------

describe('isFlowCordInteraction', () => {
  it('returns false when the customId has no colon separators', () => {
    const engine = new MenuEngine({ client: mockClient() });
    expect(engine.isFlowCordInteraction('plain-btn')).toBe(false);
  });

  it('returns false when the parsed sessionId is not active', () => {
    const engine = new MenuEngine({ client: mockClient() });
    expect(engine.isFlowCordInteraction('ghost-sess:main:btn')).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// handleInteraction — error path
// ---------------------------------------------------------------------------

describe('handleInteraction — error path', () => {
  it('calls the configured onError handler when initialization throws', async () => {
    const client = mockClient();
    const onError = jest.fn().mockResolvedValue(undefined);
    const engine = new MenuEngine({ client, onError });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await engine.handleInteraction(
      mockCommandInteraction({ client }),
      'not-registered',
    );

    expect(onError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it('removes the failed session from the active pool', async () => {
    const client = mockClient();
    const engine = new MenuEngine({
      client,
      onError: jest.fn().mockResolvedValue(undefined),
    });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await engine.handleInteraction(
      mockCommandInteraction({ client }),
      'not-registered',
    );

    expect(engine.activeSessionCount).toBe(0);
    consoleError.mockRestore();
  });
});

describe('updateOptions', () => {
  it('keeps the current MenuInstance when preserveInstance is true', async () => {
    const client = mockClient();
    const interaction = mockCommandInteraction({ client });
    const engine = new MenuEngine({ client });
    const session = new MenuSession(engine as never, interaction as never);

    const initialDefinition = {
      name: 'test-menu',
      mode: 'embeds' as const,
      hooks: {},
      isTrackedInHistory: false,
      isCancellable: false,
      isReturnable: false,
      behavior: {},
      preserveStateOnReturn: false,
      contextExtensions: [],
    };
    const initialInstance = new MenuInstance(
      initialDefinition as never,
      session.id,
    );

    (session as never as { _currentMenu: MenuInstance })._currentMenu =
      initialInstance;
    (session as never as { _currentOptions?: Record<string, unknown> })._currentOptions = {
      categoryId: '1',
    };

    engine.registerMenu('test-menu', async () => ({
      ...initialDefinition,
      hooks: {},
    }));

    await session.updateOptions(
      { categoryId: '2' },
      { preserveInstance: true },
    );

    expect(session.currentMenu).toBe(initialInstance);
  });
});
