import { ButtonStyle, EmbedBuilder } from 'discord.js';
import { MenuBuilder } from '../../menu/MenuBuilder';
import { closeMenu, goTo, goBack } from '../../action';
import type { MenuSessionLike } from '../../context/MenuContext';
import type { CreateMenuDefinitionFn } from '../../registry/MenuRegistry';
import { MenuHarness } from '../MenuHarness';

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
        label: 'Back',
        style: ButtonStyle.Secondary,
        action: goBack(),
      },
    ])
    .setReturnable()
    .setFallbackMenu('main')
    .build();

// ---------------------------------------------------------------------------
// Unit tests: MenuHarness class behaviour
// ---------------------------------------------------------------------------

describe('MenuHarness', () => {
  describe('start()', () => {
    it('resolves after the first render fires', async () => {
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');
      expect(sim.renderCount).toBe(1);
      expect(sim.lastRender).not.toBeNull();
    });

    it('rejects when the factory throws', async () => {
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
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');

      await sim.click('Go to Detail');

      expect(sim.renderCount).toBe(2);
    });

    it('accepts a ButtonResult from getButton instead of a string', async () => {
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
    });
  });

  describe('getButton()', () => {
    it('throws when label is not found', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(() => sim.getButton('Nonexistent Button')).toThrow(
        'no button with label "Nonexistent Button"',
      );
    });

    it('is case-insensitive', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');
      const btn = sim.getButton('go to detail');
      expect(btn.label).toBe('Go to Detail');
    });
  });

  describe('queryButton()', () => {
    it('returns null when label is not found', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.queryButton('Does Not Exist')).toBeNull();
    });

    it('returns the button when found', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const btn = sim.queryButton('Close');
      expect(btn).not.toBeNull();
      expect(btn?.style).toBe(ButtonStyle.Danger);
    });
  });

  describe('getButtonById() / queryButtonById()', () => {
    it('queryButtonById returns null when id is not found', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(
        sim.queryButtonById('totally-nonexistent-id'),
      ).toBeNull();
    });
  });

  describe('end()', () => {
    it('terminates the session cleanly (terminal reason = timeout)', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      await sim.end();

      expect(sim.terminals).toHaveLength(1);
      expect(sim.terminals[0]?.reason).toBe('timeout');
    });

    it('is a no-op when start() was never called', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await expect(sim.end()).resolves.toBeUndefined();
    });

    it('works even after session already closed via close button', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');
      await sim.click('Close');

      // Session is already over; end() should still resolve safely
      await sim.end();

      expect(sim.terminals[0]?.reason).toBe('closed');
    });
  });

  describe('hasText()', () => {
    it('finds text in embed description', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('Welcome to the main menu')).toBe(true);
    });

    it('is case-insensitive', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('WELCOME TO THE MAIN MENU')).toBe(true);
    });

    it('finds text in embed title', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('Main Menu')).toBe(true);
    });

    it('finds text in embed fields', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('Active')).toBe(true);
    });

    it('returns false when text is absent', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.hasText('absolutely not present xyz')).toBe(false);
    });
  });

  describe('findText()', () => {
    it('returns matching fragments for a string pattern', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const results = sim.findText('Main Menu');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns matching fragments for a RegExp', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const results = sim.findText(/main/i);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty array when nothing matches', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.findText('zzz_no_match_zzz')).toEqual([]);
    });
  });

  describe('currentMenu', () => {
    it('returns the active menu name', async () => {
      const sim = new MenuHarness({
        main: mockMainMenu,
        detail: mockDetailMenu,
      });
      await sim.start('main');

      expect(sim.currentMenu).toBe('main');
    });

    it('updates after navigation', async () => {
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
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      const embed = sim.getEmbed();
      expect(embed.title).toBe('Main Menu');
    });

    it('queryEmbed returns null when index is out of range', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(sim.queryEmbed(99)).toBeNull();
    });

    it('getEmbed throws when index is out of range', async () => {
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');

      expect(() => sim.getEmbed(99)).toThrow('no embed at index 99');
    });
  });

  describe('renders / renderCount / lastRender', () => {
    it('renderCount increments with each render', async () => {
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
      const sim = new MenuHarness({ main: mockMainMenu });
      await sim.start('main');
      expect(sim.renders).toHaveLength(1);
    });
  });

  describe('reserved button shortcuts', () => {
    it('goBack() navigates back using the __reserved_back button', async () => {
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
