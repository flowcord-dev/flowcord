import {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

import { MenuBuilder, type MenuSessionLike } from '@flowcord/core';
import { MenuHarness } from '@flowcord/testing';

function buildSelectMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId('my-select')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Option A')
        .setValue('a'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Option B')
        .setValue('b'),
    );
}

// Reusable factory for tests that only need a plain select menu with a no-op handler.
const mockMainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
    .setSelectMenu(() => ({
      builder: buildSelectMenu(),
      onSelect: async () => {},
    }))
    .build();

const mockCaptureMenu = (session: MenuSessionLike) =>
  new MenuBuilder<{ selections: string[] }>(session, 'main')
    .setup((ctx) => {
      ctx.state.set('selections', []);
    })
    .setEmbeds((ctx) => [
      new EmbedBuilder().setDescription(
        `Selections: ${ctx.state.get('selections').join(', ')}`,
      ),
    ])
    .setSelectMenu(() => ({
      builder: buildSelectMenu(),
      onSelect: async (ctx, values) => {
        const currentValues = ctx.state.get('selections');
        ctx.state.set('selections', [...currentValues, ...values]);
      },
    }))
    .build();

describe('select menu', () => {
  it('onSelect receives the selected values', async () => {
    expect.assertions(2);

    const sim = new MenuHarness({ capture: mockCaptureMenu });
    await sim.start('capture');

    await sim.select(sim.getSelect(), ['a']);

    expect(sim.hasText('Selections: a')).toBe(true);
    expect(sim.renderCount).toBe(2);
  });

  it('select can be used multiple times', async () => {
    expect.assertions(1);

    const sim = new MenuHarness({ capture: mockCaptureMenu });
    await sim.start('capture');

    for (const vals of [['a'], ['b'], ['a', 'b']]) {
      await sim.select(sim.getSelect(), vals);
    }

    expect(sim.hasText('Selections: a, b, a, b')).toBe(true);
  });

  it('select custom_id is namespaced in the payload', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    // TODO: This doesn't actually use the custom ID right now since the framework only
    // suports one select menu per menu. This test should eventually be updated to include
    // the actual customId instead of __select
    expect(sim.getSelect().customId).toContain(':main:__select');
  });
});
