import { ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

import {
  validateLayout,
  validateEmbeds,
} from '../ComponentValidator';
import type { ComponentConfig } from '../../types';

// ---------------------------------------------------------------------------
// validateEmbeds
// ---------------------------------------------------------------------------

describe('validateEmbeds', () => {
  it('is valid with 5 action rows (limit)', () => {
    const result = validateEmbeds(5, 'test-menu');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.componentCount).toBe(5);
  });

  it('is invalid with 6 action rows (over limit)', () => {
    const result = validateEmbeds(6, 'test-menu');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBe(
      'Embed menu "test-menu" has 6 action rows (limit: 5). Reduce buttons or use pagination.',
    );
  });

  it('is valid with 0 action rows', () => {
    const result = validateEmbeds(0, 'test-menu');
    expect(result.valid).toBe(true);
    expect(result.componentCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateLayout
// ---------------------------------------------------------------------------

describe('validateLayout', () => {
  it('is valid with a few components', () => {
    const result = validateLayout(
      [mockTextComponent(), mockTextComponent()],
      'menu',
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.componentCount).toBe(2);
    expect(result.breakdown.textDisplays).toBe(2);
  });

  it('is invalid when components exceed 40', () => {
    const components: ComponentConfig[] = Array.from(
      { length: 41 },
      () => mockTextComponent(),
    );
    const result = validateLayout(components, 'my-layout-menu');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toBe(
      'Layout for menu "my-layout-menu" has 41 components (limit: 40). Reduce content or split into multiple menus.\nBreakdown: 41 text displays.',
    );
  });

  it('counts nested components inside containers', () => {
    const container: ComponentConfig = {
      type: 'container',
      children: [
        mockTextComponent(),
        mockTextComponent(),
        mockTextComponent(),
      ],
    };
    const result = validateLayout([container], 'menu');
    // container itself + 3 children = 4
    expect(result.componentCount).toBe(4);
  });

  it('is invalid when text exceeds 4000 characters', () => {
    const longText = 'a'.repeat(4001);
    const result = validateLayout(
      [mockTextComponent(longText)],
      'menu',
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toBe(
      'Layout for menu "menu" has 4,001 characters across text display components (limit: 4,000). Reduce text content or paginate.',
    );
  });

  it('is valid at exactly 4000 characters', () => {
    const exactText = 'a'.repeat(4000);
    const result = validateLayout(
      [mockTextComponent(exactText)],
      'menu',
    );
    expect(result.valid).toBe(true);
  });

  it('accounts for reserved button budget', () => {
    // 39 text components + 2 reserved buttons = 41 total (1 row + 1 button)
    // reservedButtonCount=1 → +1 action row + 1 button = 2 reserved components
    const components: ComponentConfig[] = Array.from(
      { length: 39 },
      () => mockTextComponent(),
    );
    const result = validateLayout(components, 'menu', 1);
    expect(result.componentCount).toBe(41);
    expect(result.valid).toBe(false);
  });

  it('is valid at exactly 40 components with reserved buttons accounted', () => {
    // 38 text components + reservedButtonCount=1 → 38 + 1 row + 1 button = 40
    const components: ComponentConfig[] = Array.from(
      { length: 38 },
      () => mockTextComponent(),
    );
    const result = validateLayout(components, 'menu', 1);
    expect(result.componentCount).toBe(40);
    expect(result.valid).toBe(true);
  });

  it('returns both errors when both limits exceeded', () => {
    const longText = 'a'.repeat(4001);
    const components: ComponentConfig[] = Array.from(
      { length: 41 },
      () => mockTextComponent(longText),
    );
    const result = validateLayout(components, 'menu');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('is invalid when an action_row has no children', () => {
    const result = validateLayout(
      [{ type: 'action_row', children: [] }],
      'my-menu',
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toBe(
      'Layout for menu "my-menu" has an action_row with no children. Action rows must contain at least one component.',
    );
  });

  it('catches an empty action_row nested inside a container', () => {
    const result = validateLayout(
      [
        {
          type: 'container',
          children: [{ type: 'action_row', children: [] }],
        },
      ],
      'nested-menu',
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toBe(
      'Layout for menu "nested-menu" has an action_row with no children. Action rows must contain at least one component.',
    );
  });

  it('is invalid when a media_gallery has no items', () => {
    const result = validateLayout(
      [{ type: 'media_gallery', items: [] }],
      'my-menu',
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toBe(
      'Layout for menu "my-menu" has a media_gallery with no items. Media galleries must contain at least one item.',
    );
  });

  it('counts all component types in a mixed layout tree', () => {
    const result = validateLayout(mockVariedComponents(), 'menu');

    expect(result.componentCount).toBe(17);
    expect(result.breakdown).toMatchObject({
      containers: 1,
      textDisplays: 2, // container children
      sections: 1,
      separators: 1,
      thumbnails: 1,
      mediaGalleries: 1,
      files: 1,
      actionRows: 2, // 1 explicit + 1 from paginated_group
      buttons: 5, // accessory + action_row child + standalone + 2 from paginated_group
      selects: 1,
      other: 2, // paginated_group marker + unknown type
    });
  });

  it('counts paginated_group buttons using button count when perPage is not set', () => {
    // paginated_group with 3 buttons and no options — should use all 3 buttons as max
    // 3 buttons → 1 row (ceil(3/5)) + 3 buttons = 4 components (marker is not a real component)
    const result = validateLayout(
      [
        {
          type: 'paginated_group',
          buttons: Array.from({ length: 3 }, (_, idx) => ({
            type: 'button' as const,
            label: `B${idx}`,
            style: 1,
          })),
        },
      ],
      'menu',
    );

    expect(result.componentCount).toBe(4); // row(1) + 3 buttons
    expect(result.breakdown.buttons).toBe(3);
    expect(result.breakdown.actionRows).toBe(1);
    expect(result.breakdown.other).toBe(1); // the paginated_group marker
  });

  it('error breakdown mentions all component type names', () => {
    // Append 24 text components to the base (17) to exceed the 40-component limit
    const components = mockVariedComponents(
      Array.from({ length: 24 }, () => mockTextComponent()),
    );

    const result = validateLayout(components, 'menu');

    expect(result.errors[0]).toBe(
      'Layout for menu "menu" has 41 components (limit: 40). Reduce content or split into multiple menus.\nBreakdown: 1 containers, 26 text displays, 1 sections, 1 separators, 2 action rows, 5 buttons, 1 selects, 1 thumbnails, 1 media galleries, 1 files, 2 other.',
    );
  });
});

const mockTextComponent = (content = 'hello'): ComponentConfig => ({
  type: 'text_display',
  content,
});

// One instance of every component type — used by the two tests below.
const mockVariedComponents = (
  additional: ComponentConfig[] = [],
): ComponentConfig[] => [
  // container: self(1) + 2 text children(2) = 3
  {
    type: 'container',
    children: [mockTextComponent(), mockTextComponent()],
  },
  // section: self(1) + button accessory(1) = 2; exercises both string and object text items
  {
    type: 'section',
    text: [
      'string text',
      { type: 'text_display', content: 'object text' },
    ],
    accessory: {
      type: 'button',
      label: 'Go',
      style: ButtonStyle.Primary,
    },
  },
  // separator: 1
  { type: 'separator' },
  // thumbnail: 1
  { type: 'thumbnail', url: 'https://example.com/img.png' },
  // media_gallery: 1
  {
    type: 'media_gallery',
    items: [{ url: 'https://example.com/img.png' }],
  },
  // file: 1
  { type: 'file', url: 'attachment://test.txt' },
  // action_row: self(1) + button child(1) = 2
  {
    type: 'action_row',
    children: [
      {
        type: 'button',
        label: 'Click',
        style: ButtonStyle.Secondary,
      },
    ],
  },
  // standalone button: 1
  { type: 'button', label: 'Standalone', style: ButtonStyle.Success },
  // standalone select: 1 (builder not accessed by countComponent)
  { type: 'select', builder: new StringSelectMenuBuilder() },
  // paginated_group: 1 row + 2 buttons (perPage:2) = 3 (marker is not a real component)
  {
    type: 'paginated_group',
    buttons: Array.from({ length: 3 }, (_, i) => ({
      type: 'button' as const,
      label: `B${i}`,
      style: ButtonStyle.Secondary,
    })),
    options: { perPage: 2 },
  },
  // reserved_buttons_placeholder: 0 (not a real component)
  { type: 'reserved_buttons_placeholder' },
  // unknown type → default branch: 1
  { type: '__unknown__' } as unknown as ComponentConfig,
  ...additional,
];
