import { HookRegistry } from '../HookRegistry';
import { LifecycleManager } from '../../lifecycle/LifecycleManager';
import { mockMenuContext } from '@flowcord/core/mocks';

describe('HookRegistry', () => {
  describe('register / getHooks', () => {
    it('returns an empty array for a lifecycle event with no registered hooks', () => {
      const registry = new HookRegistry();

      expect(registry.getHooks('onEnter')).toStrictEqual([]);
    });

    it('registers and retrieves a single hook', () => {
      const registry = new HookRegistry();
      const hook = jest.fn();

      registry.register('onEnter', hook);

      expect(registry.getHooks('onEnter')).toStrictEqual([hook]);
    });

    it('accumulates multiple hooks for the same lifecycle event', () => {
      const registry = new HookRegistry();
      const hookOne = jest.fn();
      const hookTwo = jest.fn();

      registry.register('onEnter', hookOne);
      registry.register('onEnter', hookTwo);
      const hooks = registry.getHooks('onEnter');

      expect(hooks).toHaveLength(2);
      expect(hooks[0]).toBe(hookOne);
      expect(hooks[1]).toBe(hookTwo);
    });

    it('registers hooks for different events separately', () => {
      const registry = new HookRegistry();
      const enterHook = jest.fn();
      const leaveHook = jest.fn();

      registry.register('onEnter', enterHook);
      registry.register('onLeave', leaveHook);

      expect(registry.getHooks('onEnter')).toStrictEqual([enterHook]);
      expect(registry.getHooks('onLeave')).toStrictEqual([leaveHook]);
    });
  });

  describe('clear', () => {
    it('removes all registered hooks', () => {
      const registry = new HookRegistry();

      registry.register('onEnter', jest.fn());
      registry.register('onLeave', jest.fn());
      registry.register('beforeRender', jest.fn());
      registry.clear();

      expect(registry.getHooks('onEnter')).toStrictEqual([]);
      expect(registry.getHooks('onLeave')).toStrictEqual([]);
      expect(registry.getHooks('beforeRender')).toStrictEqual([]);
    });
  });

  describe('applyTo', () => {
    it('syncs all registered hooks into a LifecycleManager', () => {
      const registry = new HookRegistry();
      const manager = new LifecycleManager();
      const enterHook = jest.fn();
      const leaveHook = jest.fn();

      registry.register('onEnter', enterHook);
      registry.register('onLeave', leaveHook);
      registry.applyTo(manager);

      // Verify by emitting hooks through the manager
      const mockCtx = mockMenuContext();
      manager.emit('onEnter', mockCtx);
      manager.emit('onLeave', mockCtx);

      expect(enterHook).toHaveBeenCalledWith(mockCtx);
      expect(leaveHook).toHaveBeenCalledWith(mockCtx);
    });

    it('applies multiple hooks for the same event in order', async () => {
      const registry = new HookRegistry();
      const manager = new LifecycleManager();
      const callOrder: string[] = [];

      registry.register('onEnter', async () => {
        callOrder.push('first');
      });
      registry.register('onEnter', async () => {
        callOrder.push('second');
      });
      registry.applyTo(manager);

      const mockCtx = mockMenuContext();
      await manager.emit('onEnter', mockCtx);

      expect(callOrder).toStrictEqual(['first', 'second']);
    });
  });
});
