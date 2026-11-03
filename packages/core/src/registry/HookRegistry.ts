/**
 * HookRegistry — Plugin infrastructure for global lifecycle hooks.
 *
 * Global hooks fire for every menu, before menu-specific hooks.
 * This is the registration surface — LifecycleManager consumes these.
 */
import {
  createHookLists,
  type HookFnFor,
  type HookName,
} from '../lifecycle/hooks';
import type { LifecycleManager } from '../lifecycle/LifecycleManager';

export class HookRegistry {
  private _hooks = createHookLists();

  /** Register a global hook. */
  register<K extends HookName>(name: K, fn: HookFnFor<K>): void {
    this._hooks[name].push(fn);
  }

  /** Get all hooks for a given lifecycle event. */
  getHooks<K extends HookName>(name: K): ReadonlyArray<HookFnFor<K>> {
    return this._hooks[name];
  }

  /** Clear all hooks. */
  clear(): void {
    this._hooks = createHookLists();
  }

  /** Sync all registered hooks into a LifecycleManager. */
  applyTo(lifecycleManager: LifecycleManager): void {
    for (const name of Object.keys(this._hooks) as HookName[]) {
      this._applyHooks(name, lifecycleManager);
    }
  }

  private _applyHooks<K extends HookName>(
    name: K,
    lifecycleManager: LifecycleManager,
  ): void {
    for (const hook of this._hooks[name]) {
      lifecycleManager.registerGlobalHook(name, hook);
    }
  }
}
