import {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { MenuBuilder } from '../../menu/MenuBuilder';
import type { MenuSessionLike } from '../../context/MenuContext';
import { MenuHarness } from '../MenuHarness';

const SELECT_ID = 'my-select';

function buildSelectMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
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

describe('select menu', () => {
  it('onSelect receives the selected values', async () => {
    let capturedValues: string[] | null = null;

    const mockCaptureMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setSelectMenu(() => ({
          builder: buildSelectMenu(),
          onSelect: async (_ctx, values) => {
            capturedValues = values;
          },
        }))
        .build();

    const sim = new MenuHarness({ main: mockCaptureMenu });
    await sim.start('main');

    const sel = sim.getSelect();
    await sim.select(sel, ['a']);

    expect(capturedValues).toEqual(['a']);

    await sim.end();
  });

  it('menu re-renders after a selection', async () => {
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');
    const rendersBefore = sim.renderCount;

    await sim.select(sim.getSelect(), ['b']);

    expect(sim.renderCount).toBe(rendersBefore + 1);

    await sim.end();
  });

  it('select can be used multiple times', async () => {
    const allValues: string[][] = [];

    const mockAccumulatorMenu = (session: MenuSessionLike) =>
      new MenuBuilder(session, 'main')
        .setEmbeds(() => [])
        .setSelectMenu(() => ({
          builder: buildSelectMenu(),
          onSelect: async (_ctx, values) => {
            allValues.push(values);
          },
        }))
        .build();

    const sim = new MenuHarness({ main: mockAccumulatorMenu });
    await sim.start('main');

    for (const vals of [['a'], ['b'], ['a', 'b']]) {
      await sim.select(sim.getSelect(), vals);
    }

    expect(allValues).toEqual([['a'], ['b'], ['a', 'b']]);

    await sim.end();
  });

  it('select custom_id is namespaced in the payload', async () => {
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    // Framework assigns its own internal ID and namespaces with session prefix.
    // Namespaced format: sessionId:menuId:componentId
    expect(sim.getSelect().customId).toContain(':');

    await sim.end();
  });

  it('getSelect exposes the options defined on the builder', async () => {
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    const options = sim.getSelect().options;
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ label: 'Option A', value: 'a' });
    expect(options[1]).toEqual({ label: 'Option B', value: 'b' });

    await sim.end();
  });
});
