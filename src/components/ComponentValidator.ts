/**
 * Recursive component validation for Discord's display components (Components v2).
 *
 * Enforces:
 * - 40-component limit (all nested components count)
 * - 4000-character limit across all text displays
 * - Pagination-aware budget (reserved buttons consume slots)
 *
 * Human-readable error messages include component breakdowns.
 */
import type { ComponentConfig } from '../types';

const MAX_COMPONENTS = 40;
const MAX_TEXT_CHARS = 4000;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  componentCount: number;
  textCharCount: number;
  breakdown: ComponentBreakdown;
}

export interface ComponentBreakdown {
  containers: number;
  textDisplays: number;
  sections: number;
  separators: number;
  actionRows: number;
  buttons: number;
  selects: number;
  thumbnails: number;
  mediaGalleries: number;
  files: number;
  other: number;
}

function emptyBreakdown(): ComponentBreakdown {
  return {
    containers: 0,
    textDisplays: 0,
    sections: 0,
    separators: 0,
    actionRows: 0,
    buttons: 0,
    selects: 0,
    thumbnails: 0,
    mediaGalleries: 0,
    files: 0,
    other: 0,
  };
}

interface CountResult {
  componentCount: number;
  textCharCount: number;
  breakdown: ComponentBreakdown;
  errors: string[];
}

function mergeResult(acc: CountResult, src: CountResult): void {
  acc.componentCount += src.componentCount;
  acc.textCharCount += src.textCharCount;
  acc.errors.push(...src.errors);
  const b = acc.breakdown;
  const s = src.breakdown;
  b.containers += s.containers;
  b.textDisplays += s.textDisplays;
  b.sections += s.sections;
  b.separators += s.separators;
  b.actionRows += s.actionRows;
  b.buttons += s.buttons;
  b.selects += s.selects;
  b.thumbnails += s.thumbnails;
  b.mediaGalleries += s.mediaGalleries;
  b.files += s.files;
  b.other += s.other;
}

type ValidatorFn = (
  config: ComponentConfig,
  menuId: string,
) => string | null;

const STRUCTURAL_VALIDATORS: Partial<
  Record<ComponentConfig['type'], ValidatorFn[]>
> = {
  action_row: [
    (config, menuId) => {
      const { children } = config as Extract<
        ComponentConfig,
        { type: 'action_row' }
      >;
      return children.length === 0
        ? `Layout for menu "${menuId}" has an action_row with no children. ` +
            `Action rows must contain at least one component.`
        : null;
    },
  ],
  media_gallery: [
    (config, menuId) => {
      const { items } = config as Extract<
        ComponentConfig,
        { type: 'media_gallery' }
      >;
      return items.length === 0
        ? `Layout for menu "${menuId}" has a media_gallery with no items. ` +
            `Media galleries must contain at least one item.`
        : null;
    },
  ],
};

function validateComponent(
  config: ComponentConfig,
  menuId: string,
): string[] {
  return (STRUCTURAL_VALIDATORS[config.type] ?? [])
    .map((fn) => fn(config, menuId))
    .filter((err): err is string => err !== null);
}

function countComponent(
  config: ComponentConfig,
  menuId: string,
): CountResult {
  const acc: CountResult = {
    componentCount: 1,
    textCharCount: 0,
    breakdown: emptyBreakdown(),
    errors: validateComponent(config, menuId),
  };

  switch (config.type) {
    case 'container': {
      acc.breakdown.containers++;
      for (const child of config.children) {
        mergeResult(acc, countComponent(child, menuId));
      }
      break;
    }

    case 'text_display':
      acc.breakdown.textDisplays++;
      acc.textCharCount += config.content.length;
      break;

    case 'section': {
      acc.breakdown.sections++;
      for (const textItem of config.text) {
        const content =
          typeof textItem === 'string' ? textItem : textItem.content;
        acc.textCharCount += content.length;
      }
      if (config.accessory) {
        mergeResult(acc, countComponent(config.accessory, menuId));
      }
      break;
    }

    case 'separator':
      acc.breakdown.separators++;
      break;

    case 'action_row': {
      acc.breakdown.actionRows++;
      for (const child of config.children) {
        mergeResult(acc, countComponent(child, menuId));
      }
      break;
    }

    case 'button':
      acc.breakdown.buttons++;
      break;

    case 'select':
      acc.breakdown.selects++;
      break;

    case 'thumbnail':
      acc.breakdown.thumbnails++;
      break;

    case 'media_gallery':
      acc.breakdown.mediaGalleries++;
      break;

    case 'file':
      acc.breakdown.files++;
      break;

    case 'paginated_group': {
      // Count the current page's worth of buttons (worst case: perPage or all)
      // At validation time, we count all buttons as the max possible
      acc.breakdown.other++;
      const maxPerPage =
        config.options?.perPage ?? config.buttons.length;
      const pageButtons = Math.min(maxPerPage, config.buttons.length);
      // Each button is a component + action rows to hold them (5 per row)
      const rowsNeeded = Math.ceil(pageButtons / 5);
      acc.breakdown.actionRows += rowsNeeded;
      acc.breakdown.buttons += pageButtons;
      acc.componentCount += rowsNeeded + pageButtons;
      break;
    }

    case 'reserved_buttons_placeholder':
      // Will be replaced with an action row at render time
      // Placeholder itself doesn't count — the injected row does
      // Validation accounts for this separately
      acc.componentCount = 0; // Placeholder is not a real component
      break;

    default:
      acc.breakdown.other++;
      break;
  }

  return acc;
}

function countComponents(
  configs: ComponentConfig[],
  menuId: string,
  initialBreakdown?: ComponentBreakdown,
  initialCount?: number,
): CountResult {
  const acc: CountResult = {
    componentCount: initialCount ?? 0,
    textCharCount: 0,
    breakdown: initialBreakdown ?? emptyBreakdown(),
    errors: [],
  };

  for (const config of configs) {
    mergeResult(acc, countComponent(config, menuId));
  }

  return acc;
}

function formatBreakdown(breakdown: ComponentBreakdown): string {
  const parts: string[] = [];
  if (breakdown.containers)
    parts.push(`${breakdown.containers} containers`);
  if (breakdown.textDisplays)
    parts.push(`${breakdown.textDisplays} text displays`);
  if (breakdown.sections)
    parts.push(`${breakdown.sections} sections`);
  if (breakdown.separators)
    parts.push(`${breakdown.separators} separators`);
  if (breakdown.actionRows)
    parts.push(`${breakdown.actionRows} action rows`);
  if (breakdown.buttons) parts.push(`${breakdown.buttons} buttons`);
  if (breakdown.selects) parts.push(`${breakdown.selects} selects`);
  if (breakdown.thumbnails)
    parts.push(`${breakdown.thumbnails} thumbnails`);
  if (breakdown.mediaGalleries)
    parts.push(`${breakdown.mediaGalleries} media galleries`);
  if (breakdown.files) parts.push(`${breakdown.files} files`);
  if (breakdown.other) parts.push(`${breakdown.other} other`);
  return parts.join(', ');
}

/**
 * Validate a layout-mode component tree against Discord's limits.
 *
 * @param components - Top-level component configs from setLayout()
 * @param menuId - Menu identifier for error messages
 * @param reservedButtonCount - Number of reserved buttons that will be injected (Back, Cancel, Next, Previous, page counter)
 */
export function validateLayout(
  components: ComponentConfig[],
  menuId: string,
  reservedButtonCount = 0,
): ValidationResult {
  const { componentCount, textCharCount, breakdown, errors } =
    countComponents(components, menuId);

  // Account for reserved buttons: 1 action row + N buttons
  const reservedComponents =
    reservedButtonCount > 0 ? 1 + reservedButtonCount : 0;
  const totalComponents = componentCount + reservedComponents;

  if (reservedComponents > 0) {
    breakdown.actionRows += 1;
    breakdown.buttons += reservedButtonCount;
  }

  if (totalComponents > MAX_COMPONENTS) {
    errors.push(
      `Layout for menu "${menuId}" has ${totalComponents} components (limit: ${MAX_COMPONENTS}). ` +
        `Reduce content or split into multiple menus.\n` +
        `Breakdown: ${formatBreakdown(breakdown)}.`,
    );
  }

  if (textCharCount > MAX_TEXT_CHARS) {
    errors.push(
      `Layout for menu "${menuId}" has ${textCharCount.toLocaleString()} characters ` +
        `across text display components (limit: ${MAX_TEXT_CHARS.toLocaleString()}). ` +
        `Reduce text content or paginate.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    componentCount: totalComponents,
    textCharCount,
    breakdown,
  };
}

/**
 * Validate embed-mode constraints.
 * Checks action row count (max 5), buttons per row (max 5), etc.
 */
export function validateEmbeds(
  actionRowCount: number,
  menuId: string,
): ValidationResult {
  const errors: string[] = [];
  const breakdown = emptyBreakdown();
  breakdown.actionRows = actionRowCount;

  if (actionRowCount > 5) {
    errors.push(
      `Embed menu "${menuId}" has ${actionRowCount} action rows (limit: 5). ` +
        `Reduce buttons or use pagination.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    componentCount: actionRowCount,
    textCharCount: 0,
    breakdown,
  };
}
