/**
 * MenuHooks — the set of lifecycle hooks a menu can register.
 * All hooks receive the MenuContext.
 */
import type { MenuContext } from '../context/MenuContext';
import type { Awaitable } from '../types/common';

/**
 * Lifecycle hook function signature.
 */
export type HookFn<TCtx = MenuContext> = (
  ctx: TCtx,
) => Awaitable<void>;

/**
 * Extra arguments each lifecycle hook receives after the MenuContext.
 * Most hooks receive only the context.
 */
export interface HookArgs {
  onEnter: [];
  onLeave: [];
  onCancel: [];
  beforeRender: [];
  afterRender: [];
  onNext: [];
  onPrevious: [];
  onAction: [];
  onUpdateOptions: [previousOptions: Record<string, unknown>];
}

/**
 * All available lifecycle hook names.
 */
export type HookName = keyof HookArgs;

/**
 * Signature of a specific lifecycle hook.
 */
export type HookFnFor<K extends HookName, TCtx = MenuContext> = (
  ctx: TCtx,
  ...args: HookArgs[K]
) => Awaitable<void>;

export type OnUpdateOptionsHookFn<TCtx = MenuContext> = HookFnFor<
  'onUpdateOptions',
  TCtx
>;

/**
 * Map of hook name → hook function.
 * All hooks are optional.
 */
export type MenuHooks<TCtx = MenuContext> = {
  [K in HookName]?: HookFnFor<K, TCtx>;
};

/**
 * Registered hook functions for every lifecycle hook, keyed by name.
 */
export type HookLists<TCtx = MenuContext> = {
  [K in HookName]: HookFnFor<K, TCtx>[];
};

export function createHookLists<
  TCtx = MenuContext,
>(): HookLists<TCtx> {
  return {
    onEnter: [],
    onLeave: [],
    onCancel: [],
    beforeRender: [],
    afterRender: [],
    onNext: [],
    onPrevious: [],
    onAction: [],
    onUpdateOptions: [],
  };
}
