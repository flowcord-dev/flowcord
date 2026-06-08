import { MenuRegistry } from '../MenuRegistry';
import type { CreateMenuDefinitionFn } from '../MenuRegistry';

function mockMenuFactory(name: string): CreateMenuDefinitionFn {
  return async () => ({
    name,
    mode: 'embeds' as const,
    hooks: {},
    isTrackedInHistory: true,
    isCancellable: true,
    isReturnable: true,
    behavior: {},
    preserveStateOnReturn: false,
    contextExtensions: [],
  });
}

describe('MenuRegistry', () => {
  describe('register / getFactory', () => {
    it('registers and retrieves a menu factory', () => {
      const registry = new MenuRegistry();
      const factory = mockMenuFactory('main-menu');

      registry.register('main-menu', factory);

      expect(registry.getFactory('main-menu')).toBe(factory);
    });

    it('returns undefined for unregistered menus', () => {
      const registry = new MenuRegistry();

      expect(registry.getFactory('missing')).toBeUndefined();
    });

    it('throws on duplicate registration', () => {
      const registry = new MenuRegistry();

      registry.register('main-menu', mockMenuFactory('main-menu'));

      expect(() => {
        registry.register('main-menu', mockMenuFactory('main-menu'));
      }).toThrow('Menu "main-menu" is already registered');
    });
  });

  describe('has', () => {
    it('returns false for unregistered names', () => {
      const registry = new MenuRegistry();

      expect(registry.has('missing')).toBe(false);
    });

    it('returns true after registration', () => {
      const registry = new MenuRegistry();

      registry.register('settings', mockMenuFactory('settings'));

      expect(registry.has('settings')).toBe(true);
    });
  });

  describe('unregister', () => {
    it('returns true when the menu existed', () => {
      const registry = new MenuRegistry();

      registry.register('settings', mockMenuFactory('settings'));

      expect(registry.unregister('settings')).toBe(true);
    });

    it('returns false when the menu did not exist', () => {
      const registry = new MenuRegistry();

      expect(registry.unregister('nope')).toBe(false);
    });

    it('allows re-registration after unregister', () => {
      const registry = new MenuRegistry();
      const factoryV1 = mockMenuFactory('settings');
      const factoryV2 = mockMenuFactory('settings');

      registry.register('settings', factoryV1);
      registry.unregister('settings');
      registry.register('settings', factoryV2);

      expect(registry.getFactory('settings')).toBe(factoryV2);
    });
  });

  describe('names', () => {
    it('returns an empty array when no menus are registered', () => {
      const registry = new MenuRegistry();

      expect(registry.names).toStrictEqual([]);
    });

    it('returns all registered menu names', () => {
      const registry = new MenuRegistry();

      registry.register('menu-a', mockMenuFactory('menu-a'));
      registry.register('menu-b', mockMenuFactory('menu-b'));
      registry.register('menu-c', mockMenuFactory('menu-c'));

      expect(
        registry.names.sort((a, b) => a.localeCompare(b)),
      ).toStrictEqual(['menu-a', 'menu-b', 'menu-c']);
    });
  });

  describe('clear', () => {
    it('removes all registered menus', () => {
      const registry = new MenuRegistry();

      registry.register('menu-a', mockMenuFactory('menu-a'));
      registry.register('menu-b', mockMenuFactory('menu-b'));
      registry.clear();

      expect(registry.has('menu-a')).toBe(false);
      expect(registry.has('menu-b')).toBe(false);
      expect(registry.names).toStrictEqual([]);
    });
  });
});
