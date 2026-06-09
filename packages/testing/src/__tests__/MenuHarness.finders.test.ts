import { ButtonStyle } from 'discord.js';

import { ComponentIdManager } from '@flowcord/core';

import { MenuHarness } from '../MenuHarness';
import {
  mockDetailMenu,
  mockLayoutMenu,
  mockMainMenu,
  mockPlainMenu,
  mockSelectMenu,
} from './fixtures';

// Read/query methods: locating components, reading content, and render history.
// Interaction drivers live in MenuHarness.interactions.test.ts.

describe('MenuHarness — getButton() / queryButton()', () => {
  it('getButton throws when the label is not found', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(() => sim.getButton('Nonexistent Button')).toThrow(
      'no button with label "Nonexistent Button"',
    );
  });

  it('matches labels exactly (case-sensitive) by default', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(() => sim.getButton('go to detail')).toThrow(
      'no button with label "go to detail"',
    );
  });

  it('supports RegExp for case-insensitive and partial matching', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.getButton(/go to detail/i).label).toBe('Go to Detail');
    expect(sim.getButton(/Detail/).label).toBe('Go to Detail');
  });

  it('queryButton returns null when not found and the button when present', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.queryButton('Does Not Exist')).toBeNull();
    const btn = sim.queryButton('Close');
    expect(btn).not.toBeNull();
    expect(btn?.style).toBe(ButtonStyle.Danger);
  });
});

describe('MenuHarness — getButtonById() / queryButtonById()', () => {
  it('queryButtonById returns null when the id is not found', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.queryButtonById('totally-nonexistent-id')).toBeNull();
  });

  it('getButtonById throws when the id is not found', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(() => sim.getButtonById('totally-nonexistent-id')).toThrow(
      'getButtonById: no button with id "totally-nonexistent-id" found in current render',
    );
  });

  it('resolves a button by its id when present', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');
    await sim.click('Go to Detail');

    expect(sim.queryButtonById('noop-button')).not.toBeNull();
    expect(sim.getButtonById('noop-button').label).toBe('Noop');
  });
});

describe('MenuHarness — getSelect() / querySelect()', () => {
  it('exposes the options defined on the builder', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({ main: mockSelectMenu });
    await sim.start('main');

    const options = sim.getSelect().options;
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ label: 'Option A', value: 'a' });
    expect(options[1]).toEqual({ label: 'Option B', value: 'b' });
  });

  it('locates the select by componentId', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockSelectMenu });
    await sim.start('main');

    // The framework namespaces the select's custom_id, so resolve the actual
    // componentId from the rendered control rather than the builder's raw id.
    const compId =
      ComponentIdManager.parse(sim.getSelect().customId)
        ?.componentId ?? '';

    expect(sim.getSelect(compId).options).toHaveLength(2);
    expect(sim.querySelect(compId)).not.toBeNull();
  });

  it('querySelect returns null and getSelect throws when no select is rendered', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockPlainMenu });
    await sim.start('main');

    expect(sim.querySelect()).toBeNull();
    expect(() => sim.getSelect()).toThrow('no select');
  });
});

describe('MenuHarness — getEmbed() / queryEmbed()', () => {
  it('getEmbed returns the embed at index 0 by default', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.getEmbed().title).toBe('Main Menu');
  });

  it('queryEmbed returns null and getEmbed throws when the index is out of range', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.queryEmbed(99)).toBeNull();
    expect(() => sim.getEmbed(99)).toThrow('no embed at index 99');
  });
});

describe('MenuHarness — hasText() / findText()', () => {
  it('finds text across embed title, description, and fields', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.hasText('Main Menu')).toBe(true);
    expect(sim.hasText('Welcome to the main menu')).toBe(true);
    expect(sim.hasText('Active')).toBe(true);
  });

  it('matches case-sensitively by default and supports RegExp', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.hasText('WELCOME TO THE MAIN MENU')).toBe(false);
    expect(sim.hasText(/welcome to the main menu/i)).toBe(true);
    expect(sim.hasText('absolutely not present xyz')).toBe(false);
  });

  it('findText returns matching fragments for string and RegExp patterns', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({ main: mockMainMenu });
    await sim.start('main');

    expect(sim.findText('Main')).toStrictEqual(['Main Menu']);
    expect(sim.findText(/main/i)).toStrictEqual([
      'Main Menu',
      'Welcome to the main menu',
    ]);
    expect(sim.findText('zzz_no_match_zzz')).toEqual([]);
  });
});

describe('MenuHarness — currentMenu and render history', () => {
  it('currentMenu returns the active menu and updates after navigation', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');
    expect(sim.currentMenu).toBe('main');

    await sim.click('Go to Detail');
    expect(sim.currentMenu).toBe('detail');
  });

  it('renderCount and renders track each render payload', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');
    expect(sim.renderCount).toBe(1);
    expect(sim.renders).toHaveLength(1);

    await sim.click('Go to Detail');
    expect(sim.renderCount).toBe(2);
  });
});

describe('MenuHarness — layout (Components V2) finders', () => {
  it('finds buttons nested in layout action rows', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockLayoutMenu });
    await sim.start('main');

    expect(sim.queryButton('Layout Action')).not.toBeNull();

    await sim.click('Layout Action');
    expect(sim.renderCount).toBe(2);
  });

  it('reads text_display content from layout components', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockLayoutMenu });
    await sim.start('main');

    expect(sim.hasText('Layout heading')).toBe(true);
    expect(sim.findText(/Layout/)).toContain('Layout heading');
  });
});
