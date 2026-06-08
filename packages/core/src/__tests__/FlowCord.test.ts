import { FlowCord } from '../FlowCord';
import { MenuBuilder } from '../menu/MenuBuilder';
import {
  mockClient,
  mockCommandInteraction,
  mockComponentInteraction,
} from '../testing';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

describe('configuration', () => {
  it('client returns the configured Discord.js client', () => {
    const client = mockClient();
    const flowcord = new FlowCord({ client });
    expect(flowcord.client).toBe(client);
  });

  it('activeSessionCount starts at zero', () => {
    const flowcord = new FlowCord({ client: mockClient() });
    expect(flowcord.activeSessionCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// registerMenu / handleInteraction
// ---------------------------------------------------------------------------

describe('registerMenu', () => {
  it('does not call onError when handleInteraction is invoked with the registered menu name', async () => {
    const client = mockClient();
    const onError = jest.fn().mockResolvedValue(undefined);
    const flowcord = new FlowCord({ client, onError });

    flowcord.registerMenu('my-menu', (session) =>
      new MenuBuilder(session, 'my-menu')
        .setEmbeds(() => [])
        .setButtons(() => [])
        .onEnter(async (ctx) => {
          await ctx.close();
        })
        .build(),
    );

    await flowcord.handleInteraction(
      mockCommandInteraction({ client }),
      'my-menu',
    );

    expect(onError).not.toHaveBeenCalled();
  });

  it('calls the configured onError handler when initialization throws', async () => {
    const client = mockClient();
    const onError = jest.fn().mockResolvedValue(undefined);
    const flowcord = new FlowCord({ client, onError });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await flowcord.handleInteraction(
      mockCommandInteraction({ client }),
      'not-registered',
    );

    expect(onError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe('getSession', () => {
  it('returns undefined for an unknown session ID', () => {
    const flowcord = new FlowCord({ client: mockClient() });

    expect(flowcord.getSession('ghost-sess')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// routeComponentInteraction
// ---------------------------------------------------------------------------

describe('routeComponentInteraction', () => {
  it('returns false when the customId has no FlowCord session prefix', () => {
    const flowcord = new FlowCord({ client: mockClient() });
    const result = flowcord.routeComponentInteraction(
      mockComponentInteraction({ customId: 'plain-btn' }),
    );

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFlowCordInteraction
// ---------------------------------------------------------------------------

describe('isFlowCordInteraction', () => {
  it('returns false when the customId has no colon separators', () => {
    const flowcord = new FlowCord({ client: mockClient() });
    expect(flowcord.isFlowCordInteraction('plain-btn')).toBe(false);
  });
});
