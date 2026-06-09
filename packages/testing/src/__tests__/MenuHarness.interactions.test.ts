import { ButtonStyle } from 'discord.js';

import { MenuHarness } from '../MenuHarness';
import {
  mockCancellableMenu,
  mockDetailMenu,
  mockMainMenu,
  mockMessageMenu,
  mockModalMenu,
  mockPaginatedMenu,
  mockSelectCaptureMenu,
} from './fixtures';

// Methods that drive the session forward. Read/query methods live in
// MenuHarness.finders.test.ts; lifecycle and history live in MenuHarness.test.ts.

describe('MenuHarness — button clicks', () => {
  it('click(label) finds the button and triggers a new render', async () => {
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

  it('click(ButtonResult) accepts a resolved button instead of a label', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({
      main: mockMainMenu,
      detail: mockDetailMenu,
    });
    await sim.start('main');

    const btn = sim.getButton('Go to Detail');
    expect(btn.style).toBe(ButtonStyle.Primary);

    await sim.click(btn);

    expect(sim.renderCount).toBe(2);
    expect(sim.currentMenu).toBe('detail');
  });
});

describe('MenuHarness — select()', () => {
  it('forwards values to onSelect and re-renders', async () => {
    expect.assertions(2);
    const sim = new MenuHarness({ main: mockSelectCaptureMenu });
    await sim.start('main');

    await sim.select(sim.getSelect(), ['a', 'b']);

    expect(sim.hasText('Picks: a, b')).toBe(true);
    expect(sim.renderCount).toBe(2);
  });
});

describe('MenuHarness — sendMessage()', () => {
  it('routes content to the message handler', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockMessageMenu });
    await sim.start('main');

    await sim.sendMessage('hello world');

    expect(sim.hasText('Message: hello world')).toBe(true);
  });
});

describe('MenuHarness — modal submit', () => {
  it('clickModal() + submitModal() delivers field values to onSubmit', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockModalMenu });
    await sim.start('main');

    sim.clickModal('Open Modal');
    await sim.submitModal({ 'name-field': 'Alice' });

    expect(sim.hasText('Name: Alice')).toBe(true);
  });
});

describe('MenuHarness — reserved navigation buttons', () => {
  it('goBack() returns to the previous tracked menu', async () => {
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

  it('cancel() ends the session via the reserved cancel button', async () => {
    expect.assertions(1);
    const sim = new MenuHarness({ main: mockCancellableMenu });
    await sim.start('main');

    await sim.cancel();

    expect(sim.terminals[0]?.reason).toBe('cancelled');
  });

  it('nextPage() and prevPage() move through the pagination buttons', async () => {
    expect.assertions(3);
    const sim = new MenuHarness({ main: mockPaginatedMenu });
    await sim.start('main');

    expect(sim.hasText('Page 1 of 2')).toBe(true);

    await sim.nextPage();
    expect(sim.hasText('Page 2 of 2')).toBe(true);

    await sim.prevPage();
    expect(sim.hasText('Page 1 of 2')).toBe(true);
  });
});
