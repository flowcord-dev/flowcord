import {
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

import { closeMenu, goTo } from '@flowcord/core';
import type { MenuSessionLike } from '@flowcord/core';
import { MenuBuilder } from '@flowcord/core';
import type { CreateMenuDefinitionFn } from '@flowcord/core';
import { MenuHarness } from '@flowcord/testing';

// ---------------------------------------------------------------------------
// Menu factories
// ---------------------------------------------------------------------------

const mockMainMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('Main Menu')
        .setDescription('Welcome to the main menu')
        .addFields({
          name: 'Status',
          value: 'Active',
          inline: false,
        }),
    ])
    .setButtons(() => [
      {
        label: 'Go to Detail',
        style: ButtonStyle.Primary,
        action: goTo('detail'),
      },
      {
        label: 'Close',
        style: ButtonStyle.Danger,
        action: closeMenu(),
      },
    ])
    .setTrackedInHistory()
    .build();

const mockDetailMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'detail')
    .setEmbeds(() => [
      new EmbedBuilder().setDescription('Detail page content'),
    ])
    .setButtons(() => [
      {
        id: 'noop-button',
        label: 'Noop',
        style: ButtonStyle.Secondary,
        action: async () => {},
      },
    ])
    .setReturnable()
    .setFallbackMenu('main')
    .build();

const mockSelectMenu = (session: MenuSessionLike) =>
  new MenuBuilder(session, 'main')
    .setEmbeds(() => [])
    .setSelectMenu(() => ({
      builder: new StringSelectMenuBuilder()
        .setCustomId('my-select')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Option A')
            .setValue('a'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Option B')
            .setValue('b'),
        ),
      onSelect: async () => {},
    }))
    .build();

// ---------------------------------------------------------------------------
// Unit tests: MenuHarness class behaviour
// ---------------------------------------------------------------------------

describe('MenuHarness', () => {
  describe('start()', () => {
    it('resolves after the first render fires', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      const render = await sim.start('main');

      expect(sim.renderCount).toBe(1);
      expect(render.menuId).toBe('main');
    });

    it('rejects when the factory throws', async () => {
      expect.assertions(1);
      const makeBrokenMenu = ((_session: MenuSessionLike) => {
        throw new Error('factory boom');
      }) as unknown as CreateMenuDefinitionFn;

      const sim = new MenuHarness({ broken: makeBrokenMenu });
      await expect(sim.start('broken')).rejects.toThrow(
        'factory boom',
      );
    });
  });

  describe('click(label)', () => {
    it('finds button by label and triggers a new render', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');

      await sim.click('Go to Detail');

      expect(sim.renderCount).toBe(2);
      expect(sim.currentMenu).toBe('detail');
    });

    it('accepts a ButtonResult from getButton instead of a string', async () => {
      expect.assertions(4);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');

      const btn = sim.getButton('Go to Detail');

      expect(btn.label).toBe('Go to Detail');
      expect(btn.style).toBe(ButtonStyle.Primary);

      await sim.click(btn);

      expect(sim.renderCount).toBe(2);
      expect(sim.currentMenu).toBe('detail');
    });
  });

  describe('getButton()', () => {
    it('throws when label is not found', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(() => sim.getButton('Nonexistent Button')).toThrow(
        'no button with label "Nonexistent Button"',
      );
    });

    it('matches exactly by default (case-sensitive)', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');
      expect(() => sim.getButton('go to detail')).toThrow(
        'no button with label "go to detail"',
      );
    });

    it('supports RegExp for case-insensitive matching', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');
      const btn = sim.getButton(/go to detail/i);
      expect(btn.label).toBe('Go to Detail');
    });

    it('supports RegExp for partial matching', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');
      const btn = sim.getButton(/Detail/);
      expect(btn.label).toBe('Go to Detail');
    });
  });

  describe('queryButton()', () => {
    it('returns null when label is not found', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.queryButton('Does Not Exist')).toBeNull();
    });

    it('returns the button when found', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const btn = sim.queryButton('Close');
      expect(btn).not.toBeNull();
      expect(btn?.style).toBe(ButtonStyle.Danger);
    });
  });

  describe('getButtonById() / queryButtonById()', () => {
    it('queryButtonById returns null when id is not found', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(
        sim.queryButtonById('totally-nonexistent-id'),
      ).toBeNull();
    });

    it('getButtonById throws when id is not found', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(() =>
        sim.getButtonById('totally-nonexistent-id'),
      ).toThrow(
        'getButtonById: no button with id "totally-nonexistent-id" found in current render',
      );
    });

    it('queryButtonById returns the button when id is found', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');
      await sim.click('Go to Detail');

      const btn = sim.queryButtonById('noop-button');
      expect(btn).not.toBeNull();
      expect(btn?.label).toBe('Noop');
    });

    it('getButtonById returns the button when id is found', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');
      await sim.click('Go to Detail');

      const btn = sim.getButtonById('noop-button');
      expect(btn.label).toBe('Noop');
    });
  });

  describe('end()', () => {
    it('terminates the session cleanly (terminal reason = timeout)', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      await sim.end();

      expect(sim.terminals).toHaveLength(1);
      expect(sim.terminals[0]?.reason).toBe('timeout');
    });

    it('is a no-op when start() was never called', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });

      await expect(sim.end()).resolves.toBeUndefined();
    });

    it('resolves safely when session already closed via close button', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      await sim.click('Close');

      // Session is already over; end() should still resolve safely
      await sim.end();

      expect(sim.terminals[0]?.reason).toBe('closed');
    });

    it('adapter.endPromise resolves to the terminal reason', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      await sim.click('Close');

      const reason = await sim.adapter.endPromise;
      expect(reason).toBe('closed');
    });
  });

  describe('hasText()', () => {
    it('finds text in embed description', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('Welcome to the main menu')).toBe(true);
    });

    it('matches exactly by default (case-sensitive)', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('WELCOME TO THE MAIN MENU')).toBe(false);
    });

    it('supports RegExp for custom matching', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText(/welcome to the main menu/i)).toBe(true);
    });

    it('finds text in embed title', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('Main Menu')).toBe(true);
    });

    it('finds text in embed fields', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('Active')).toBe(true);
    });

    it('returns false when text is absent', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('absolutely not present xyz')).toBe(false);
    });
  });

  describe('findText()', () => {
    it('returns matching fragments for a string pattern', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const results = sim.findText('Main');
      expect(results).toStrictEqual(['Main Menu']);
    });

    it('returns matching fragments for a RegExp', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const results = sim.findText(/main/i);
      expect(results).toStrictEqual([
        'Main Menu',
        'Welcome to the main menu',
      ]);
    });

    it('returns empty array when nothing matches', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.findText('zzz_no_match_zzz')).toEqual([]);
    });
  });

  describe('currentMenu', () => {
    it('returns the active menu name', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');

      expect(sim.currentMenu).toBe('main');
    });

    it('updates after navigation', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');

      await sim.click('Go to Detail');

      expect(sim.currentMenu).toBe('detail');
    });
  });

  describe('getEmbed() / queryEmbed()', () => {
    it('getEmbed returns embed at index 0 by default', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const embed = sim.getEmbed();
      expect(embed.title).toBe('Main Menu');
    });

    it('queryEmbed returns null when index is out of range', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.queryEmbed(99)).toBeNull();
    });

    it('getEmbed throws when index is out of range', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(() => sim.getEmbed(99)).toThrow('no embed at index 99');
    });
  });

  describe('renders / renderCount / lastRender', () => {
    it('renderCount increments with each render', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');
      expect(sim.renderCount).toBe(1);

      await sim.click('Go to Detail');
      expect(sim.renderCount).toBe(2);
    });

    it('renders array contains all render payloads', async () => {
      expect.assertions(1);
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');
      expect(sim.renders).toHaveLength(1);
    });
  });

  describe('getSelect()', () => {
    it('exposes the options defined on the builder', async () => {
      expect.assertions(3);
      const sim = new MenuHarness({ main: mockSelectMenu });
      await sim.start('main');

      const options = sim.getSelect().options;
      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({ label: 'Option A', value: 'a' });
      expect(options[1]).toEqual({ label: 'Option B', value: 'b' });
    });
  });

  describe('reserved button shortcuts', () => {
    it('goBack() navigates back using the __reserved_back button', async () => {
      expect.assertions(2);
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');

      await sim.click('Go to Detail');
      expect(sim.currentMenu).toBe('detail');

      await sim.goBack();
      expect(sim.currentMenu).toBe('main');
    });
  });
});
