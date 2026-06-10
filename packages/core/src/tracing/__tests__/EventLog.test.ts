import { EventLog, type SessionEvent } from '../EventLog';

describe('EventLog', () => {
  describe('record / events', () => {
    it('records a single event', () => {
      const log = new EventLog();
      const event: SessionEvent = {
        kind: 'navigation',
        from: null,
        to: 'main-menu',
        timestamp: 1000,
      };

      log.record(event);

      expect(log.events).toHaveLength(1);
      expect(log.events[0]).toStrictEqual(event);
    });

    it('records multiple events in order', () => {
      const log = new EventLog();
      const nav: SessionEvent = {
        kind: 'navigation',
        from: null,
        to: 'main-menu',
        timestamp: 1000,
      };
      const hook: SessionEvent = {
        kind: 'hook',
        menuId: 'main-menu',
        hookName: 'onEnter',
        timestamp: 1001,
      };
      const action: SessionEvent = {
        kind: 'action',
        menuId: 'main-menu',
        componentId: 'btn-start',
        timestamp: 1002,
      };

      log.record(nav);
      log.record(hook);
      log.record(action);

      expect(log.events).toHaveLength(3);
      expect(log.events[0].kind).toBe('navigation');
      expect(log.events[1].kind).toBe('hook');
      expect(log.events[2].kind).toBe('action');
    });

    it('does not expose internal array (snapshot does not grow after record)', () => {
      const log = new EventLog();
      log.record({
        kind: 'navigation',
        from: null,
        to: 'main-menu',
        timestamp: 1000,
      });
      const snapshot = log.events;
      log.record({
        kind: 'action',
        menuId: 'main-menu',
        componentId: 'btn-start',
        timestamp: 1001,
      });

      expect(snapshot).toHaveLength(1);
      expect(log.events).toHaveLength(2);
    });
  });

  describe('filter', () => {
    it('filters events by kind', () => {
      const log = new EventLog();

      log.record({
        kind: 'navigation',
        from: null,
        to: 'main-menu',
        timestamp: 1000,
      });
      log.record({
        kind: 'hook',
        menuId: 'main-menu',
        hookName: 'onEnter',
        timestamp: 1001,
      });
      log.record({
        kind: 'action',
        menuId: 'main-menu',
        componentId: 'btn-start',
        timestamp: 1002,
      });
      log.record({
        kind: 'navigation',
        from: 'main-menu',
        to: 'settings',
        timestamp: 1003,
      });
      const navEvents = log.filter('navigation');

      expect(navEvents).toStrictEqual([
        {
          kind: 'navigation',
          from: null,
          to: 'main-menu',
          timestamp: 1000,
        },
        {
          kind: 'navigation',
          from: 'main-menu',
          to: 'settings',
          timestamp: 1003,
        },
      ]);
    });

    it('returns an empty array when no events match', () => {
      const log = new EventLog();

      log.record({
        kind: 'navigation',
        from: null,
        to: 'main-menu',
        timestamp: 1000,
      });
      log.record({
        kind: 'hook',
        menuId: 'main-menu',
        hookName: 'onEnter',
        timestamp: 1001,
      });
      log.record({
        kind: 'action',
        menuId: 'main-menu',
        componentId: 'btn-start',
        timestamp: 1002,
      });
      log.record({
        kind: 'navigation',
        from: 'main-menu',
        to: 'settings',
        timestamp: 1003,
      });
      const modalEvents = log.filter('modal:shown');

      expect(modalEvents).toStrictEqual([]);
    });
  });

  describe('findLast', () => {
    it('returns the last event matching the given kind', () => {
      const log = new EventLog();

      log.record({
        kind: 'action',
        menuId: 'main',
        componentId: 'btn-a',
        timestamp: 1000,
      });
      log.record({
        kind: 'hook',
        menuId: 'main',
        hookName: 'beforeRender',
        timestamp: 1001,
      });
      log.record({
        kind: 'action',
        menuId: 'main',
        componentId: 'btn-b',
        timestamp: 1002,
      });

      const last = log.findLast('action');

      expect(last).toStrictEqual({
        kind: 'action',
        menuId: 'main',
        componentId: 'btn-b',
        timestamp: 1002,
      });
    });

    it('returns undefined when no events match', () => {
      const log = new EventLog();

      log.record({
        kind: 'hook',
        menuId: 'main',
        hookName: 'onEnter',
        timestamp: 1000,
      });

      expect(log.findLast('action')).toBeUndefined();
    });

    it('returns undefined on an empty log', () => {
      const log = new EventLog();

      expect(log.findLast('navigation')).toBeUndefined();
    });

  });

  describe('clear', () => {
    it('removes all recorded events', () => {
      const log = new EventLog();

      log.record({
        kind: 'navigation',
        from: null,
        to: 'main-menu',
        timestamp: 1000,
      });
      log.record({
        kind: 'hook',
        menuId: 'main-menu',
        hookName: 'onEnter',
        timestamp: 1001,
      });

      expect(log.events).toHaveLength(2);

      log.clear();

      expect(log.events).toHaveLength(0);
    });
  });
});
