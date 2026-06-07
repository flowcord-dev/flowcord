import type { MenuSessionLike } from '../../context/MenuContext';
import { StateStore } from '../../state/StateStore';

/**
 * Build a minimal MenuSessionLike stub for unit tests.
 * Pass overrides to replace individual fields.
 */
export function mockMenuSessionLike(
  overrides: Partial<MenuSessionLike> = {},
): MenuSessionLike {
  return {
    id: 'test-session',
    sessionState: new StateStore(),
    isCancelled: false,
    isCompleted: false,
    canGoBack: false,
    ...overrides,
  };
}
