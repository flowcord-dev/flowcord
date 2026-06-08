import {
  NavigationTracer,
  type NavigationEvent,
} from '../NavigationTracer';

function mockNavEvent(
  from: string,
  to: string,
  overrides: Partial<NavigationEvent> = {},
): NavigationEvent {
  return {
    from,
    to,
    sessionId: 'session-1',
    userId: 'user-1',
    timestamp: Date.now(),
    direction: 'forward',
    ...overrides,
  };
}

describe('NavigationTracer', () => {
  describe('enable / disable', () => {
    it('is disabled by default', () => {
      const tracer = new NavigationTracer();

      tracer.record(mockNavEvent('menu-a', 'menu-b'));

      expect(tracer.events).toHaveLength(0);
    });

    it('records events when enabled', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));

      expect(tracer.events).toHaveLength(1);
    });

    it('stops recording when disabled after being enabled', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.disable();
      tracer.record(mockNavEvent('menu-b', 'menu-c'));

      expect(tracer.events).toHaveLength(1);
      expect(tracer.events[0].to).toBe('menu-b');
    });
  });

  describe('record / events', () => {
    it('records events in order', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.record(mockNavEvent('menu-b', 'menu-c'));
      tracer.record(mockNavEvent('menu-c', 'menu-d'));

      expect(tracer.events.map((event) => event.from)).toStrictEqual([
        'menu-a',
        'menu-b',
        'menu-c',
      ]);
    });

    it('preserves event details including trigger', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(
        mockNavEvent('menu-a', 'menu-b', {
          trigger: 'button:navigate',
        }),
      );

      expect(tracer.events[0].trigger).toBe('button:navigate');
    });

    it('does not expose internal array (snapshot does not grow after record)', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      const snapshot = tracer.events;
      tracer.record(mockNavEvent('menu-b', 'menu-c'));

      expect(snapshot).toHaveLength(1);
      expect(tracer.events).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('removes all recorded events', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.record(mockNavEvent('menu-b', 'menu-c'));
      tracer.clear();

      expect(tracer.events).toHaveLength(0);
    });
  });

  describe('getPathsFrom', () => {
    it('returns a single path for a linear navigation chain', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.record(mockNavEvent('menu-b', 'menu-c'));

      const paths = tracer.getPathsFrom('menu-a');
      expect(paths).toStrictEqual([['menu-a', 'menu-b', 'menu-c']]);
    });

    it('returns multiple paths for branching navigation', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.record(mockNavEvent('menu-a', 'menu-c'));

      const paths = tracer.getPathsFrom('menu-a');
      expect(paths).toHaveLength(2);
      expect(paths).toContainEqual(['menu-a', 'menu-b']);
      expect(paths).toContainEqual(['menu-a', 'menu-c']);
    });

    it('returns the start node alone when there are no outgoing edges', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));

      const paths = tracer.getPathsFrom('menu-b');
      expect(paths).toStrictEqual([['menu-b']]);
    });

    it('handles cycles without infinite recursion', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.record(mockNavEvent('menu-b', 'menu-a'));

      // Pure cycle with no terminal node — DFS completes without hanging
      // but produces no paths since the leaf condition (no outgoing edges) is never met
      const paths = tracer.getPathsFrom('menu-a');
      expect(paths).toStrictEqual([]);
    });

    it('produces paths when a cycle has an exit edge', () => {
      const tracer = new NavigationTracer();

      tracer.enable();
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.record(mockNavEvent('menu-b', 'menu-a'));
      tracer.record(mockNavEvent('menu-b', 'menu-c'));

      const paths = tracer.getPathsFrom('menu-a');
      expect(paths).toContainEqual(['menu-a', 'menu-b', 'menu-c']);
    });

    it('handles deeper branching with shared destinations', () => {
      const tracer = new NavigationTracer();
      tracer.enable();
      tracer.record(mockNavEvent('root', 'child-a'));
      tracer.record(mockNavEvent('root', 'child-b'));
      tracer.record(mockNavEvent('child-a', 'leaf'));
      tracer.record(mockNavEvent('child-b', 'leaf'));

      const paths = tracer.getPathsFrom('root');
      expect(paths).toHaveLength(2);
      expect(paths).toContainEqual(['root', 'child-a', 'leaf']);
      expect(paths).toContainEqual(['root', 'child-b', 'leaf']);
    });

    it('back navigation is inverted and deduplicates with matching forward edge', () => {
      const tracer = new NavigationTracer();
      tracer.enable();
      // Forward a→b then back b→a — both contribute the same a→b edge after inversion
      tracer.record(mockNavEvent('menu-a', 'menu-b'));
      tracer.record(
        mockNavEvent('menu-b', 'menu-a', { direction: 'back' }),
      );

      // Deduplicates to a single a→b edge — no false cycle
      const paths = tracer.getPathsFrom('menu-a');
      expect(paths).toStrictEqual([['menu-a', 'menu-b']]);
    });

    it('back-only fallback navigation implies the forward path', () => {
      const tracer = new NavigationTracer();
      tracer.enable();
      // Session started at 'settings'; back goes to 'main-menu' as fallback.
      // Inverted: main-menu → settings (implied forward path).
      tracer.record(
        mockNavEvent('settings', 'main-menu', { direction: 'back' }),
      );

      const paths = tracer.getPathsFrom('main-menu');
      expect(paths).toStrictEqual([['main-menu', 'settings']]);
    });
  });
});
