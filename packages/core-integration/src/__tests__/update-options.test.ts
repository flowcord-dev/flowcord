import { ButtonStyle, EmbedBuilder } from 'discord.js';

import {
  goTo,
  MenuBuilder,
  type MenuSessionLike,
  updateOptions,
} from '@flowcord/core';
import { MenuHarness } from '@flowcord/testing';

describe('updateOptions()', () => {
  it('re-renders with new options and fresh state by default', async () => {
    expect.assertions(3);
    const menu = (session: MenuSessionLike, options?: Record<string, unknown>) =>
      new MenuBuilder<{ count: number }>(session, 'menu')
        .setup((ctx) => ctx.state.set('count', 0))
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `${options?.label}:${ctx.state.get('count')}`,
          ),
        ])
        .setButtons(() => [
          {
            label: 'Increment',
            style: ButtonStyle.Primary,
            action: async (ctx) =>
              ctx.state.set('count', ctx.state.get('count') + 1),
          },
          {
            label: 'Update',
            style: ButtonStyle.Secondary,
            action: updateOptions({ label: 'updated' }),
          },
        ])
        .build();

    const sim = new MenuHarness({ menu });
    await sim.start('menu', { label: 'initial' });
    await sim.click('Increment');
    expect(sim.hasText('initial:1')).toBe(true);

    await sim.click('Update');
    expect(sim.hasText('updated:0')).toBe(true);
    expect(sim.renders).toHaveLength(3);
  });

  it('does not push an updated menu to history', async () => {
    expect.assertions(1);
    const parent = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'parent')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Open',
            style: ButtonStyle.Primary,
            action: goTo('child', { page: 1 }),
          },
        ])
        .setTrackedInHistory()
        .build();
    const child = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'child')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Update',
            style: ButtonStyle.Primary,
            action: updateOptions({ page: 2 }),
          },
        ])
        .setReturnable()
        .setFallbackMenu('parent')
        .build();

    const sim = new MenuHarness({ parent, child });
    await sim.start('parent');
    await sim.click('Open');
    await sim.click('Update');
    await sim.goBack();

    expect(sim.renders.map((render) => render.menuId)).toEqual([
      'parent',
      'child',
      'child',
      'parent',
    ]);
  });

  it('preserveState keeps state and skips setup()', async () => {
    expect.assertions(5);
    let setupCount = 0;
    const menu = (session: MenuSessionLike) =>
      new MenuBuilder<{ count: number }>(session, 'menu')
        .setup((ctx) => {
          setupCount++;
          ctx.state.set('count', 1);
        })
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(
            `count:${ctx.state.get('count')}`,
          ),
        ])
        .setButtons(() => [
          {
            label: 'Increment',
            style: ButtonStyle.Secondary,
            action: async (ctx) =>
              ctx.state.set('count', ctx.state.get('count') + 1),
          },
          {
            label: 'Update',
            style: ButtonStyle.Primary,
            action: updateOptions(
              { refreshed: true },
              { preserveState: true },
            ),
          },
        ])
        .build();

    const sim = new MenuHarness({ menu });
    await sim.start('menu');
    expect(setupCount).toBe(1);
    expect(sim.hasText('count:1')).toBe(true);

    await sim.click('Increment');
    expect(sim.hasText('count:2')).toBe(true);

    await sim.click('Update');
    expect(sim.hasText('count:2')).toBe(true);
    expect(setupCount).toBe(1);
  });

  it('fires onUpdateOptions with the context and previous options', async () => {
    expect.assertions(2);
    const hook = jest.fn();
    const menu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'menu')
        .onUpdateOptions(hook)
        .setEmbeds((ctx) => [
          new EmbedBuilder().setDescription(String(ctx.options.value)),
        ])
        .setButtons(() => [
          {
            label: 'Update',
            style: ButtonStyle.Primary,
            action: updateOptions({ value: 2 }),
          },
        ])
        .build();

    const sim = new MenuHarness({ menu });
    await sim.start('menu', { value: 1 });
    await sim.click('Update');

    expect(hook).toHaveBeenCalledTimes(1);
    expect(hook.mock.calls[0][1]).toEqual({ value: 1 });
  });

  it('does not error when onUpdateOptions is not defined', async () => {
    const menu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'menu')
        .setEmbeds(() => [])
        .setButtons(() => [
          {
            label: 'Update',
            style: ButtonStyle.Primary,
            action: updateOptions({ value: 2 }),
          },
        ])
        .build();

    const sim = new MenuHarness({ menu });
    await sim.start('menu', { value: 1 });
    await expect(sim.click('Update')).resolves.toBeUndefined();
  });
});
