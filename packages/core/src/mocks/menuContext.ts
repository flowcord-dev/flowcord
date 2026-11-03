import type {
  MenuContext,
  MenuInstanceLike,
  MenuSessionLike,
} from '../context/MenuContext';
import { StateAccessor } from '../state/StateAccessor';
import { StateStore } from '../state/StateStore';
import { mockClient, mockCommandInteraction } from './discordjs';

interface MockMenuContextOverrides<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TSessionState extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> extends Partial<
  Omit<
    MenuContext<TState, TSessionState, TOptions>,
    'session' | 'menu'
  >
> {
  session?: Partial<MenuSessionLike>;
  menu?: Partial<MenuInstanceLike>;
}

/**
 * Build a fully typed MenuContext for unit tests with sensible defaults.
 * Individual fields can be overridden without repeated unsafe casts.
 */
export function mockMenuContext<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TSessionState extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(
  overrides: MockMenuContextOverrides<
    TState,
    TSessionState,
    TOptions
  > = {},
): MenuContext<TState, TSessionState, TOptions> {
  const client = overrides.client ?? mockClient();
  const state =
    overrides.state ?? new StateAccessor<TState>({} as TState);
  const sessionState =
    overrides.sessionState ?? new StateStore<TSessionState>();

  const defaultSession: MenuSessionLike = {
    id: 'test-session',
    sessionState,
    isCancelled: false,
    isCompleted: false,
    canGoBack: false,
  };

  const defaultMenu: MenuInstanceLike = {
    name: 'test-menu',
    mode: 'embeds',
  };

  return {
    session: { ...defaultSession, ...overrides.session },
    menu: { ...defaultMenu, ...overrides.menu },
    state,
    sessionState,
    client,
    interaction:
      overrides.interaction ??
      mockCommandInteraction({
        client,
        user: {
          id: 'test-user',
          displayName: 'TestUser',
          displayAvatarURL: () => '',
        },
      }),
    options: overrides.options ?? ({} as TOptions),
    pagination: overrides.pagination ?? null,
    env: overrides.env ?? 'test',
    goTo: overrides.goTo ?? (async () => {}),
    goBack: overrides.goBack ?? (async () => {}),
    close: overrides.close ?? (async () => {}),
    updateOptions: overrides.updateOptions ?? (async () => {}),
    hardRefresh: overrides.hardRefresh ?? (async () => {}),
    openSubMenu: overrides.openSubMenu ?? (async () => {}),
    complete: overrides.complete ?? (async () => {}),
  };
}
