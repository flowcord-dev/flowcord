/**
 * LifecycleManager — Ordered hook emission with global + per-menu support.
 *
 * Global hooks (registered via HookRegistry) fire before menu-specific hooks.
 * All hooks are async and executed sequentially.
 */
import type { MenuContext } from '../context/MenuContext';
import {
  createHookLists,
  type HookArgs,
  type HookFnFor,
  type HookName,
  type MenuHooks,
} from './hooks';

export class LifecycleManager {
  /** Global hooks that fire for ALL menus (from HookRegistry / plugins) */
  private readonly _globalHooks = createHookLists();

  /**
   * Register a global hook that fires for every menu.
   */
  registerGlobalHook<K extends HookName>(
    name: K,
    fn: HookFnFor<K>,
  ): void {
    this._globalHooks[name].push(fn);
  }

  /**
   * Emit a lifecycle hook.
   * Fires global hooks first, then the menu-specific hook.
   */
  async emit<K extends HookName>(
    name: K,
    ctx: MenuContext,
    menuHooks?: MenuHooks,
    ...args: HookArgs[K]
  ): Promise<void> {
    // Global hooks fire first
    for (const hook of this._globalHooks[name]) {
      await hook(ctx, ...args);
    }

    // Menu-specific hook
    const menuHook: HookFnFor<K> | undefined = menuHooks?.[name];
    if (menuHook) {
      await menuHook(ctx, ...args);
    }
  }
}
