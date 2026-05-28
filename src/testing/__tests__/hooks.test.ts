import { ButtonStyle } from 'discord.js';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { goTo, goBack } from '../../action';
import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuHarness } from '../MenuHarness';

describe('hook lifecycle', () => {
  it('fires setup → onEnter → beforeRender → afterRender on initial render', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setup(() => {})
        .onEnter(() => {})
        .beforeRender(() => {})
        .afterRender(() => {})
        .setEmbeds(() => [])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.hookHistory.map((hook) => hook.hookName)).toEqual([
      'setup',
      'onEnter',
      'beforeRender',
      'afterRender',
    ]);

    await sim.end();
  });

  it('fires onLeave on the departing menu before onEnter on the arriving menu', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .onLeave(() => {})
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Go Detail',
            style: ButtonStyle.Primary,
            action: goTo('detail'),
          },
        ])
        .setTrackedInHistory()
        .build();

    const mockDetailMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'detail')
        .onEnter(() => {})
        .setEmbeds(() => [])
        .build();

    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    const hookCountBeforeNav = sim.hookHistory.length;
    await sim.click('Go Detail');

    const navigationHooks = sim.hookHistory
      .slice(hookCountBeforeNav)
      .filter(
        (hook) =>
          hook.hookName === 'onLeave' || hook.hookName === 'onEnter',
      )
      .map((hook) => `${hook.menuId}:${hook.hookName}`);

    expect(navigationHooks).toEqual([
      'main:onLeave',
      'detail:onEnter',
    ]);

    await sim.end();
  });

  it('fires beforeRender and afterRender on every render cycle', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .beforeRender(() => {})
        .afterRender(() => {})
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Noop',
            style: ButtonStyle.Secondary,
            action: async () => {},
          },
        ])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    const renderHooks = () =>
      sim.hookHistory
        .filter(
          (hook) =>
            hook.hookName === 'beforeRender' ||
            hook.hookName === 'afterRender',
        )
        .map((hook) => hook.hookName);

    expect(renderHooks()).toEqual(['beforeRender', 'afterRender']);

    await sim.click('Noop');

    expect(renderHooks()).toEqual([
      'beforeRender',
      'afterRender',
      'beforeRender',
      'afterRender',
    ]);

    await sim.end();
  });

  it('async hooks are awaited before proceeding', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .onEnter(async () => {
          await new Promise<void>((res) => setTimeout(res, 10));
        })
        .afterRender(() => {})
        .setEmbeds(() => [])
        .build();

    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    // If onEnter were not awaited, afterRender would fire before it completes.
    // hookHistory ordering proves sequencing was respected.
    const order = sim.hookHistory
      .filter(
        (hook) =>
          hook.hookName === 'onEnter' ||
          hook.hookName === 'afterRender',
      )
      .map((hook) => hook.hookName);

    expect(order).toEqual(['onEnter', 'afterRender']);

    await sim.end();
  });

  it('onEnter fires again on goBack() return', async () => {
    const mockMainMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .onEnter(() => {})
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Go Detail',
            style: ButtonStyle.Primary,
            action: goTo('detail'),
          },
        ])
        .setTrackedInHistory()
        .build();

    const mockDetailMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'detail')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Back',
            style: ButtonStyle.Secondary,
            action: goBack(),
          },
        ])
        .setReturnable()
        .setFallbackMenu('main')
        .build();

    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    await sim.click('Go Detail');
    await sim.click('Back');

    const mainEnters = sim.hookHistory.filter(
      (hook) => hook.hookName === 'onEnter' && hook.menuId === 'main',
    );
    expect(mainEnters).toHaveLength(2);

    await sim.end();
  });
});
