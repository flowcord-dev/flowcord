import { mockMenuContext } from '@flowcord/core/mocks';
import type { MenuHooks } from '../hooks';
import { LifecycleManager } from '../LifecycleManager';

describe('LifecycleManager', () => {
  describe('registerGlobalHook / emit', () => {
    it('fires a registered global hook', async () => {
      const manager = new LifecycleManager();
      const mockCtx = mockMenuContext();
      const mockHook = jest.fn();

      manager.registerGlobalHook('onEnter', mockHook);
      await manager.emit('onEnter', mockCtx);

      expect(mockHook).toHaveBeenCalledTimes(1);
      expect(mockHook).toHaveBeenCalledWith(mockCtx);
    });

    it('fires multiple global hooks in registration order', async () => {
      const callOrder: string[] = [];
      const manager = new LifecycleManager();
      const mockCtx = mockMenuContext();

      manager.registerGlobalHook('onEnter', async () => {
        callOrder.push('first');
      });
      manager.registerGlobalHook('onEnter', async () => {
        callOrder.push('second');
      });
      manager.registerGlobalHook('onEnter', async () => {
        callOrder.push('third');
      });
      await manager.emit('onEnter', mockCtx);

      expect(callOrder).toStrictEqual(['first', 'second', 'third']);
    });
  });

  describe('emit with menu-specific hooks', () => {
    it('fires the menu-specific hook after global hooks', async () => {
      const manager = new LifecycleManager();
      const mockCtx = mockMenuContext();
      const callOrder: string[] = [];
      const menuHooks: MenuHooks = {
        onEnter: async () => {
          callOrder.push('menu-specific');
        },
      };

      manager.registerGlobalHook('onEnter', async () => {
        callOrder.push('global');
      });

      await manager.emit('onEnter', mockCtx, menuHooks);

      expect(callOrder).toStrictEqual(['global', 'menu-specific']);
    });

    it('fires only the menu-specific hook when no global hooks exist', async () => {
      const manager = new LifecycleManager();
      const mockCtx = mockMenuContext();
      const mockMenuHook = jest.fn();
      const menuHooks: MenuHooks = { onLeave: mockMenuHook };

      await manager.emit('onLeave', mockCtx, menuHooks);

      expect(mockMenuHook).toHaveBeenCalledTimes(1);
      expect(mockMenuHook).toHaveBeenCalledWith(mockCtx);
    });
  });
});
