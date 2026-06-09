import { EmbedBuilder } from 'discord.js';

import { EventLog, MenuBuilder, MenuEngine } from '@flowcord/core';
import type { MenuSessionLike } from '@flowcord/core';
import { createTestSession, SimulatedAdapter } from '@flowcord/testing';

describe('createTestSession', () => {
  it('exposes the adapter, event log, and engine, and runs the session loop', async () => {
    expect.assertions(5);

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [
          new EmbedBuilder().setDescription('Hello from main'),
        ])
        .build();

    const handle = createTestSession({ main: mockMainMenu });

    expect(handle.engine).toBeInstanceOf(MenuEngine);
    expect(handle.eventLog).toBeInstanceOf(EventLog);
    expect(handle.adapter).toBeInstanceOf(SimulatedAdapter);

    const done = handle.startSession('main');
    await Promise.race([handle.adapter.waitForNextRender(), done]);

    expect(handle.adapter.renderCount).toBeGreaterThan(0);

    // Force-terminate the parked session loop (no close button needed).
    handle.adapter.clearQueues();
    await done.catch(() => {});

    expect(handle.adapter.terminals).toHaveLength(1);
  });

  it('seeds initialSessionState before the first menu initializes', async () => {
    expect.assertions(2);

    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `Role: ${ctx.sessionState.get('role')}`,
          ),
        ])
        .build();

    const handle = createTestSession(
      { main: mockMainMenu },
      {
        initialSessionState: { role: 'admin' },
        userId: 'user-42',
        safetyTimeout: 1000,
      },
    );

    const done = handle.startSession('main');
    await Promise.race([handle.adapter.waitForNextRender(), done]);

    expect(handle.adapter.lastRender).not.toBeNull();
    expect(JSON.stringify(handle.adapter.lastRender)).toContain('admin');

    handle.adapter.clearQueues();
    await done.catch(() => {});
  });
});
