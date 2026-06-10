import { EmbedBuilder } from 'discord.js';

import {
  EventLog,
  MenuBuilder,
  MenuEngine,
  type MenuSessionLike,
} from '@flowcord/core';

import { createTestSession } from '../createTestSession';
import { SimulatedAdapter } from '../SimulatedAdapter';

const mockMainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [
      new EmbedBuilder().setDescription('Hello from main'),
    ])
    .build();

describe('createTestSession', () => {
  it('exposes the adapter, event log, and engine', () => {
    expect.assertions(3);
    const handle = createTestSession({ main: mockMainMenu });

    expect(handle.engine).toBeInstanceOf(MenuEngine);
    expect(handle.eventLog).toBeInstanceOf(EventLog);
    expect(handle.adapter).toBeInstanceOf(SimulatedAdapter);
  });

  it('startSession runs the menu loop and produces a render', async () => {
    expect.assertions(1);
    const handle = createTestSession({ main: mockMainMenu });

    const done = handle.startSession('main');
    await Promise.race([handle.adapter.waitForNextRender(), done]);

    expect(handle.adapter.renderCount).toBeGreaterThan(0);

    handle.adapter.clearQueues();
    await done.catch(() => {});
  });

  it('clearQueues force-terminates the parked session loop', async () => {
    expect.assertions(1);
    const handle = createTestSession({ main: mockMainMenu });

    const done = handle.startSession('main');
    await Promise.race([handle.adapter.waitForNextRender(), done]);

    handle.adapter.clearQueues();
    await done.catch(() => {});

    expect(handle.adapter.terminals).toHaveLength(1);
  });

  it('seeds initialSessionState before the first menu initializes', async () => {
    expect.assertions(1);
    const mockRoleMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `Role: ${ctx.sessionState.get('role')}`,
          ),
        ])
        .build();

    const handle = createTestSession(
      { main: mockRoleMenu },
      { initialSessionState: { role: 'admin' }, userId: 'user-42' },
    );

    const done = handle.startSession('main');
    await Promise.race([handle.adapter.waitForNextRender(), done]);

    expect(JSON.stringify(handle.adapter.lastRender)).toContain(
      'admin',
    );

    handle.adapter.clearQueues();
    await done.catch(() => {});
  });
});
