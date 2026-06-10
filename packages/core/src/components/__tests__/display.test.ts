import { ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import {
  actionRow,
  button,
  container,
  file,
  mediaGallery,
  paginatedGroup,
  section,
  select,
  separator,
  text,
  thumbnail,
} from '../display';

// ---------------------------------------------------------------------------
// text
// ---------------------------------------------------------------------------

describe('text', () => {
  it('returns a text_display config with the given content', () => {
    expect(text('Hello world')).toEqual({
      type: 'text_display',
      content: 'Hello world',
    });
  });
});

// ---------------------------------------------------------------------------
// button
// ---------------------------------------------------------------------------

describe('button', () => {
  it('returns a button config with required fields', () => {
    const result = button({
      label: 'Click me',
      style: ButtonStyle.Primary,
    });
    expect(result.type).toBe('button');
    expect(result.label).toBe('Click me');
    expect(result.style).toBe(ButtonStyle.Primary);
  });

  it('includes all optional fields when provided', () => {
    const action = jest.fn();
    const result = button({
      label: 'Go',
      style: ButtonStyle.Secondary,
      id: 'my-btn',
      disabled: true,
      emoji: '🎉',
      url: 'https://example.com',
      opensModal: 'my-modal',
      action,
    });

    expect(result).toMatchObject({
      type: 'button',
      id: 'my-btn',
      disabled: true,
      emoji: '🎉',
      url: 'https://example.com',
      opensModal: 'my-modal',
      action,
    });
  });

  it('leaves optional fields undefined when not provided', () => {
    const result = button({ label: 'X', style: ButtonStyle.Danger });
    expect(result.id).toBeUndefined();
    expect(result.disabled).toBeUndefined();
    expect(result.emoji).toBeUndefined();
    expect(result.url).toBeUndefined();
    expect(result.opensModal).toBeUndefined();
    expect(result.action).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// select
// ---------------------------------------------------------------------------

describe('select', () => {
  it('returns a select config with a builder', () => {
    const builder = {} as never;
    const result = select({ builder });
    expect(result.type).toBe('select');
    expect(result.builder).toBe(builder);
  });

  it('includes id and onSelect when provided', () => {
    const onSelect = jest.fn();
    const result = select({
      builder: new StringSelectMenuBuilder(),
      id: 'sel-1',
      onSelect,
    });
    expect(result.id).toBe('sel-1');
    expect(result.onSelect).toBe(onSelect);
  });

  it('leaves optional fields undefined when not provided', () => {
    const result = select({ builder: new StringSelectMenuBuilder() });
    expect(result.id).toBeUndefined();
    expect(result.onSelect).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// actionRow
// ---------------------------------------------------------------------------

describe('actionRow', () => {
  it('returns an action_row config wrapping the given children', () => {
    const btn = button({ label: 'A', style: ButtonStyle.Primary });
    const result = actionRow([btn]);
    expect(result).toEqual({ type: 'action_row', children: [btn] });
  });

  it('accepts an empty children array', () => {
    expect(actionRow([])).toEqual({
      type: 'action_row',
      children: [],
    });
  });
});

// ---------------------------------------------------------------------------
// separator
// ---------------------------------------------------------------------------

describe('separator', () => {
  it('returns a separator config with no options', () => {
    expect(separator()).toEqual({
      type: 'separator',
      divider: undefined,
      spacing: undefined,
    });
  });

  it('includes divider and spacing when provided', () => {
    expect(separator({ divider: true, spacing: 'large' })).toEqual({
      type: 'separator',
      divider: true,
      spacing: 'large',
    });
  });
});

// ---------------------------------------------------------------------------
// container
// ---------------------------------------------------------------------------

describe('container', () => {
  it('returns a container config with children', () => {
    const child = text('hi');
    const result = container({ children: [child] });
    expect(result.type).toBe('container');
    expect(result.children).toEqual([child]);
  });

  it('includes accentColor and spoiler when provided', () => {
    const result = container({
      children: [],
      accentColor: 0xff0000,
      spoiler: true,
    });
    expect(result.accentColor).toBe(0xff0000);
    expect(result.spoiler).toBe(true);
  });

  it('leaves optional fields undefined when not provided', () => {
    const result = container({ children: [] });
    expect(result.accentColor).toBeUndefined();
    expect(result.spoiler).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// section
// ---------------------------------------------------------------------------

describe('section', () => {
  it('returns a section config with text and accessory', () => {
    const accessory = thumbnail({
      url: 'https://example.com/img.png',
    });
    const result = section({ text: ['Hello'], accessory });
    expect(result).toEqual({
      type: 'section',
      text: ['Hello'],
      accessory,
    });
  });

  it('accepts TextDisplayConfig entries in the text array', () => {
    const accessory = button({
      label: 'Go',
      style: ButtonStyle.Primary,
    });
    const textComp = text('hi');
    const result = section({ text: [textComp], accessory });
    expect(result.text[0]).toEqual(textComp);
  });
});

// ---------------------------------------------------------------------------
// thumbnail
// ---------------------------------------------------------------------------

describe('thumbnail', () => {
  it('returns a thumbnail config with a url', () => {
    expect(thumbnail({ url: 'https://example.com/img.png' })).toEqual(
      {
        type: 'thumbnail',
        url: 'https://example.com/img.png',
        description: undefined,
        spoiler: undefined,
      },
    );
  });

  it('includes description and spoiler when provided', () => {
    const result = thumbnail({
      url: 'https://example.com/img.png',
      description: 'Alt text',
      spoiler: true,
    });
    expect(result.description).toBe('Alt text');
    expect(result.spoiler).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mediaGallery
// ---------------------------------------------------------------------------

describe('mediaGallery', () => {
  it('returns a media_gallery config with the given items', () => {
    const items = [
      { url: 'https://example.com/a.png' },
      { url: 'https://example.com/b.png' },
    ];
    expect(mediaGallery(items)).toEqual({
      type: 'media_gallery',
      items,
    });
  });

  it('accepts an empty items array', () => {
    expect(mediaGallery([])).toEqual({
      type: 'media_gallery',
      items: [],
    });
  });
});

// ---------------------------------------------------------------------------
// file
// ---------------------------------------------------------------------------

describe('file', () => {
  it('returns a file config with a url', () => {
    expect(file({ url: 'attachment://report.pdf' })).toEqual({
      type: 'file',
      url: 'attachment://report.pdf',
      spoiler: undefined,
    });
  });

  it('includes spoiler when provided', () => {
    expect(
      file({ url: 'attachment://secret.txt', spoiler: true }),
    ).toMatchObject({ spoiler: true });
  });
});

// ---------------------------------------------------------------------------
// paginatedGroup
// ---------------------------------------------------------------------------

describe('paginatedGroup', () => {
  const btns = [
    button({ label: 'A', style: ButtonStyle.Primary }),
    button({ label: 'B', style: ButtonStyle.Secondary }),
  ];

  it('returns a paginated_group config with buttons', () => {
    const result = paginatedGroup(btns);
    expect(result.type).toBe('paginated_group');
    expect(result.buttons).toBe(btns);
    expect(result.options).toBeUndefined();
  });

  it('includes options when provided', () => {
    const result = paginatedGroup(btns, { perPage: 3 });
    expect(result.options).toEqual({ perPage: 3 });
  });
});
