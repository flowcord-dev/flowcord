import type { CreateMenuDefinitionFn, MenuSessionLike } from '@flowcord/core';

import { MenuHarness } from '../MenuHarness';
import {
  mockDetailMenu,
  mockMainMenu,
  mockModalMenu,
  mockRoleMenu,
} from './fixtures';

// Lifecycle (start/end) and observability (history accessors) for the harness.
// Interaction drivers live in MenuHarness.interactions.test.ts; read/query
// methods live in MenuHarness.finders.test.ts.

describe('MenuHarness — lifecycle', () => {
  describe('start()', () => {
    it('resolves after the first render fires', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      const render = await sim.start('main');

      expect(sim.renderCount).toBe(1);
      expect(render.menuId).toBe('main');
    });

    it('rejects when the factory throws', async () => {
      expect.assertions(1);
      const mockBrokenMenu = ((_session: MenuSessionLike) => {
        throw new Error('factory boom');
      }) as unknown as CreateMenuDefinitionFn;

      const sim = new MenuHarness({ broken: mockBrokenMenu });
      await expect(sim.start('broken')).rejects.toThrow('factory boom');
    });
  });

  describe('end()', () => {
    it('terminates the session cleanly (terminal reason = timeout)', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      await sim.end();

      expect(sim.terminals).toHaveLength(1);
      expect(sim.terminals[0]?.reason).toBe('timeout');
    });

    it('is a no-op when start() was never called', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });

      await expect(sim.end()).resolves.toBeUndefined();
    });

    it('resolves safely when the session already closed via close button', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      await sim.click('Close');
      await sim.end();

      expect(sim.terminals[0]?.reason).toBe('closed');
    });

    it('adapter.endPromise resolves to the terminal reason', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      await sim.click('Close');

      const reason = await sim.adapter.endPromise;
      expect(reason).toBe('closed');
    });
  });

  describe('initialSessionState', () => {
    it('seeds session state before the first menu initializes', async () => {
      expect.assertions(1);
      const sim = new MenuHarness(
        { main: mockRoleMenu },
        { initialSessionState: { role: 'admin' } },
      );
      await sim.start('main');

      expect(sim.hasText('Role: admin')).toBe(true);
    });
  });
});

describe('MenuHarness — history accessors', () => {
  it('navigationHistory, actionHistory, and lastAction track a navigation', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Go to Detail');

    expect(
      sim.navigationHistory.some((nav) => nav.to === 'detail'),
    ).toBe(true);
    expect(sim.actionHistory.length).toBeGreaterThan(0);
    expect(sim.lastAction?.menuId).toBe('main');
  });

  it('hookHistory records the lifecycle hooks that fired', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.hookHistory.map((hook) => hook.hookName)).toContain(
      'setup',
    );
  });

  it('modalHistory records the shown and submitted events', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockModalMenu });
    await sim.start('main');

    sim.clickModal('Open Modal');
    await sim.submitModal({ 'name-field': 'Bob' });

    const kinds = sim.modalHistory.map((entry) => entry.kind);
    expect(kinds).toContain('shown');
    expect(kinds).toContain('submit');
  });
});
