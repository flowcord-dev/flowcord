import { ActionRegistry } from '../ActionRegistry';

describe('ActionRegistry', () => {
  describe('register / get', () => {
    it('registers and retrieves an action', () => {
      const registry = new ActionRegistry();
      const action = jest.fn();

      registry.register('greet', action);

      expect(registry.get('greet')).toBe(action);
    });

    it('returns undefined for unregistered actions', () => {
      const registry = new ActionRegistry();

      expect(registry.get('missing')).toBeUndefined();
    });

    it('throws on duplicate registration', () => {
      const registry = new ActionRegistry();

      registry.register('greet', jest.fn());
      expect(() => {
        registry.register('greet', jest.fn());
      }).toThrow('Action "greet" is already registered');
    });

    it('allows re-registration after unregister', () => {
      const registry = new ActionRegistry();
      const first = jest.fn();
      const second = jest.fn();

      registry.register('greet', first);
      registry.unregister('greet');
      registry.register('greet', second);

      expect(registry.get('greet')).toBe(second);
    });
  });

  describe('has', () => {
    it('returns false for unregistered names', () => {
      const registry = new ActionRegistry();

      expect(registry.has('missing')).toBe(false);
    });

    it('returns true after registration', () => {
      const registry = new ActionRegistry();

      registry.register('greet', jest.fn());

      expect(registry.has('greet')).toBe(true);
    });

    it('returns false after unregister', () => {
      const registry = new ActionRegistry();

      registry.register('greet', jest.fn());
      registry.unregister('greet');

      expect(registry.has('greet')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('returns true when the action existed', () => {
      const registry = new ActionRegistry();

      registry.register('greet', jest.fn());

      expect(registry.unregister('greet')).toBe(true);
      expect(registry.get('greet')).toBeUndefined();
    });

    it('returns false when the action did not exist', () => {
      const registry = new ActionRegistry();

      expect(registry.unregister('nope')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all registered actions', () => {
      const registry = new ActionRegistry();

      registry.register('action-a', jest.fn());
      registry.register('action-b', jest.fn());
      registry.clear();

      expect(registry.has('action-a')).toBe(false);
      expect(registry.has('action-b')).toBe(false);
    });
  });
});
