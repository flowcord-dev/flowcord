import { ButtonStyle } from 'discord.js';
import type { APIEmbed } from 'discord-api-types/v10';
import { MenuEngine } from '../engine/MenuEngine';
import type { CreateMenuDefinitionFn } from '../registry/MenuRegistry';
import { ComponentIdManager } from '../components/ComponentIdManager';
import { EventLog } from '../tracing/EventLog';
import type {
  NormalizedComponentInteraction,
  NormalizedModalSubmission,
  NormalizedRenderPayload,
  NormalizedTerminalPayload,
} from '../adapter/types';
import type { CreateTestSessionOptions } from './createTestSession';
import { SimulatedAdapter } from './SimulatedAdapter';
import { mockClient, mockCommandInteraction, mockMessage } from './mocks';

export type MenuHarnessOptions = CreateTestSessionOptions;

export interface ButtonResult {
  customId: string;
  label: string | null;
  disabled: boolean;
  style: ButtonStyle;
}

export interface SelectResult {
  customId: string;
  placeholder?: string;
}

const BUTTON_COMPONENT_TYPE = 2;
const SELECT_COMPONENT_TYPE_MIN = 3;

export class MenuHarness {
  readonly adapter: SimulatedAdapter;
  readonly eventLog: EventLog;

  private readonly _options: MenuHarnessOptions;
  private readonly _engine: MenuEngine;
  private readonly _interaction: import('discord.js').ChatInputCommandInteraction;
  private readonly _userId: string;
  private _sessionDone: Promise<void> | null = null;

  constructor(
    menus: Record<string, CreateMenuDefinitionFn>,
    options: MenuHarnessOptions = {},
  ) {
    this._options = options;
    this._userId = options.userId ?? 'test-user';
    const safetyTimeout = options.safetyTimeout ?? 5000;

    this.adapter = new SimulatedAdapter({ safetyTimeout });
    this.eventLog = new EventLog();

    const client = mockClient();
    this._engine = new MenuEngine({
      client,
      timeout: safetyTimeout,
      behavior: options.behavior,
    });

    for (const [name, factory] of Object.entries(menus)) {
      this._engine.registerMenu(name, factory);
    }

    this._interaction = mockCommandInteraction({
      client,
      user: {
        id: this._userId,
        displayName: 'Test User',
        displayAvatarURL: () => 'https://example.com/avatar.png',
      },
    });
  }

  // --- Lifecycle ---

  async start(
    menuName: string,
    options?: Record<string, unknown>,
  ): Promise<void> {
    const session = this._engine.createSession(
      this._interaction,
      this.adapter,
      this.eventLog,
    );

    if (this._options.initialSessionState) {
      for (const [key, value] of Object.entries(
        this._options.initialSessionState,
      )) {
        session.sessionState.set(key, value);
      }
    }

    this._sessionDone = session.initialize(menuName, options);

    // Race: first render resolves → start() resolves.
    // Factory error: session rejects → start() rejects.
    await Promise.race([
      this.adapter.waitForNextRender(),
      this._sessionDone,
    ]);
  }

  async end(): Promise<void> {
    if (this._sessionDone === null) return;
    this.adapter.clearQueues();
    await this._sessionDone;
  }

  // --- Finders: buttons ---

  getButton(label: string): ButtonResult {
    const result = this.queryButton(label);
    if (!result) {
      throw new Error(
        `getButton: no button with label "${label}" found in current render`,
      );
    }
    return result;
  }

  queryButton(label: string): ButtonResult | null {
    const render = this.lastRender;
    if (!render) return null;
    const target = label.toLowerCase();
    return (
      this._collectButtons(render).find(
        (btn) => btn.label?.toLowerCase() === target,
      ) ?? null
    );
  }

  getButtonById(componentId: string): ButtonResult {
    const result = this.queryButtonById(componentId);
    if (!result) {
      throw new Error(
        `getButtonById: no button with id "${componentId}" found in current render`,
      );
    }
    return result;
  }

  queryButtonById(componentId: string): ButtonResult | null {
    const render = this.lastRender;
    if (!render) return null;
    return (
      this._collectButtons(render).find((btn) => {
        const parsed = ComponentIdManager.parse(btn.customId);
        return parsed?.componentId === componentId;
      }) ?? null
    );
  }

  // --- Finders: selects ---

  getSelect(): SelectResult;
  getSelect(componentId: string): SelectResult;
  getSelect(componentId?: string): SelectResult {
    const result = componentId === undefined
      ? this.querySelect()
      : this.querySelect(componentId);
    if (!result) {
      throw new Error(
        componentId === undefined
          ? 'getSelect: no select found in current render'
          : `getSelect: no select with id "${componentId}" found in current render`,
      );
    }
    return result;
  }

  querySelect(): SelectResult | null;
  querySelect(componentId: string): SelectResult | null;
  querySelect(componentId?: string): SelectResult | null {
    const render = this.lastRender;
    if (!render) return null;
    const selects = this._collectSelects(render);

    if (componentId !== undefined) {
      return (
        selects.find((sel) => {
          const parsed = ComponentIdManager.parse(sel.customId);
          return parsed?.componentId === componentId;
        }) ?? null
      );
    }

    if (selects.length === 0) return null;
    if (selects.length > 1) {
      throw new Error(
        `querySelect: found ${selects.length} selects — pass a componentId to disambiguate`,
      );
    }
    return selects[0];
  }

  // --- Interactions ---

  async click(target: string | ButtonResult): Promise<void> {
    const btn = typeof target === 'string' ? this.getButton(target) : target;
    this.adapter.enqueueComponent(this._buildClick(btn.customId));
    await this.adapter.waitForNextRender();
  }

  async select(target: SelectResult, values: string[]): Promise<void> {
    this.adapter.enqueueComponent(
      this._buildSelect(target.customId, values),
    );
    await this.adapter.waitForNextRender();
  }

  async sendMessage(content: string): Promise<void> {
    this.adapter.enqueueMessage({
      content,
      raw: mockMessage(),
      delete: async () => {},
    });
    await this.adapter.waitForNextRender();
  }

  clickModal(target: string | ButtonResult): void {
    const btn = typeof target === 'string' ? this.getButton(target) : target;
    this.adapter.enqueueComponent(this._buildClick(btn.customId));
    // Intentionally no await — showModal does not produce a render.
  }

  async submitModal(fields: Record<string, string>): Promise<void> {
    this.adapter.enqueueModalSubmit(this._buildModalSubmit(fields));
    await this.adapter.waitForNextRender();
  }

  // --- Reserved button shortcuts ---

  async goBack(): Promise<void> {
    return this.click(this.getButtonById('__reserved_back'));
  }

  async cancel(): Promise<void> {
    return this.click(this.getButtonById('__reserved_cancel'));
  }

  async nextPage(): Promise<void> {
    return this.click(this.getButtonById('__reserved_next'));
  }

  async prevPage(): Promise<void> {
    return this.click(this.getButtonById('__reserved_previous'));
  }

  // --- Content inspection ---

  get currentMenu(): string {
    const render = this.lastRender;
    if (!render) {
      throw new Error('currentMenu: no render available — call start() first');
    }
    const customId = this._extractAnyCustomId(render);
    if (!customId) {
      throw new Error(
        'currentMenu: no namespaced customId found in current render',
      );
    }
    const parsed = ComponentIdManager.parse(customId);
    if (!parsed) {
      throw new Error(`currentMenu: failed to parse customId "${customId}"`);
    }
    return parsed.menuId;
  }

  getEmbed(index = 0): APIEmbed {
    const result = this.queryEmbed(index);
    if (result === null) {
      throw new Error(`getEmbed: no embed at index ${index} in current render`);
    }
    return result;
  }

  queryEmbed(index = 0): APIEmbed | null {
    const render = this.lastRender;
    if (!render?.embeds) return null;
    return render.embeds[index] ?? null;
  }

  hasText(text: string): boolean {
    const lower = text.toLowerCase();
    return this._collectTextFragments().some((frag) =>
      frag.toLowerCase().includes(lower),
    );
  }

  findText(pattern: string | RegExp): string[] {
    const fragments = this._collectTextFragments();
    if (typeof pattern === 'string') {
      const lower = pattern.toLowerCase();
      return fragments.filter((frag) => frag.toLowerCase().includes(lower));
    }
    return fragments.filter((frag) => pattern.test(frag));
  }

  // --- Render history ---

  get renders(): NormalizedRenderPayload[] {
    return this.adapter.renders;
  }

  get terminals(): NormalizedTerminalPayload[] {
    return this.adapter.terminals;
  }

  get renderCount(): number {
    return this.adapter.renderCount;
  }

  get lastRender(): NormalizedRenderPayload | null {
    return this.adapter.lastRender;
  }

  waitForRender(): Promise<void> {
    return this.adapter.waitForNextRender();
  }

  // --- Private helpers ---

  private _collectButtons(render: NormalizedRenderPayload): ButtonResult[] {
    const results: ButtonResult[] = [];

    for (const row of render.components ?? []) {
      for (const comp of row.components as unknown as Record<string, unknown>[]) {
        const btn = this._buttonFromComp(comp);
        if (btn) results.push(btn);
      }
    }

    if (render.layoutComponents) {
      this._collectButtonsFromLayout(render.layoutComponents, results);
    }

    return results;
  }

  private _buttonFromComp(
    comp: Record<string, unknown>,
  ): ButtonResult | null {
    if (
      comp['type'] !== BUTTON_COMPONENT_TYPE ||
      typeof comp['custom_id'] !== 'string'
    ) {
      return null;
    }
    return {
      customId: comp['custom_id'],
      label: typeof comp['label'] === 'string' ? comp['label'] : null,
      disabled: comp['disabled'] === true,
      style: (comp['style'] as ButtonStyle) ?? ButtonStyle.Secondary,
    };
  }

  private _collectButtonsFromLayout(
    components: unknown[],
    results: ButtonResult[],
  ): void {
    for (const comp of components) {
      if (typeof comp !== 'object' || comp === null) continue;
      const cmp = comp as Record<string, unknown>;

      const btn = this._buttonFromComp(cmp);
      if (btn) {
        results.push(btn);
        continue;
      }

      for (const key of ['components', 'children', 'items']) {
        if (Array.isArray(cmp[key])) {
          this._collectButtonsFromLayout(cmp[key] as unknown[], results);
        }
      }
    }
  }

  private _collectSelects(render: NormalizedRenderPayload): SelectResult[] {
    const results: SelectResult[] = [];

    for (const row of render.components ?? []) {
      for (const comp of row.components as unknown as Record<string, unknown>[]) {
        const sel = this._selectFromComp(comp);
        if (sel) results.push(sel);
      }
    }

    if (render.layoutComponents) {
      this._collectSelectsFromLayout(render.layoutComponents, results);
    }

    return results;
  }

  private _selectFromComp(
    comp: Record<string, unknown>,
  ): SelectResult | null {
    const typ = comp['type'] as number | undefined;
    if (
      typ === undefined ||
      typ < SELECT_COMPONENT_TYPE_MIN ||
      typeof comp['custom_id'] !== 'string'
    ) {
      return null;
    }
    return {
      customId: comp['custom_id'],
      placeholder:
        typeof comp['placeholder'] === 'string'
          ? comp['placeholder']
          : undefined,
    };
  }

  private _collectSelectsFromLayout(
    components: unknown[],
    results: SelectResult[],
  ): void {
    for (const comp of components) {
      if (typeof comp !== 'object' || comp === null) continue;
      const cmp = comp as Record<string, unknown>;

      const sel = this._selectFromComp(cmp);
      if (sel) {
        results.push(sel);
        continue;
      }

      for (const key of ['components', 'children', 'items']) {
        if (Array.isArray(cmp[key])) {
          this._collectSelectsFromLayout(cmp[key] as unknown[], results);
        }
      }
    }
  }

  private _extractAnyCustomId(render: NormalizedRenderPayload): string | null {
    for (const row of render.components ?? []) {
      for (const comp of row.components as unknown as Record<string, unknown>[]) {
        if (typeof comp['custom_id'] === 'string') return comp['custom_id'];
      }
    }

    if (render.layoutComponents) {
      return this._findCustomIdInLayout(render.layoutComponents);
    }

    return null;
  }

  private _findCustomIdInLayout(components: unknown[]): string | null {
    for (const comp of components) {
      if (typeof comp !== 'object' || comp === null) continue;
      const cmp = comp as Record<string, unknown>;

      if (typeof cmp['custom_id'] === 'string') return cmp['custom_id'];

      for (const key of ['components', 'children', 'items']) {
        if (Array.isArray(cmp[key])) {
          const found = this._findCustomIdInLayout(cmp[key] as unknown[]);
          if (found) return found;
        }
      }
    }
    return null;
  }

  private _collectTextFragments(): string[] {
    const render = this.lastRender;
    if (!render) return [];

    const fragments: string[] = [];
    this._collectEmbedText(render, fragments);

    if (render.layoutComponents) {
      this._collectTextFromLayout(render.layoutComponents, fragments);
    }

    return fragments;
  }

  private _collectEmbedText(
    render: NormalizedRenderPayload,
    fragments: string[],
  ): void {
    for (const embed of render.embeds ?? []) {
      this._collectSingleEmbedText(embed, fragments);
    }
  }

  private _collectSingleEmbedText(
    embed: APIEmbed,
    fragments: string[],
  ): void {
    if (embed.title) fragments.push(embed.title);
    if (embed.description) fragments.push(embed.description);
    if (embed.footer?.text) fragments.push(embed.footer.text);
    if (embed.author?.name) fragments.push(embed.author.name);
    for (const field of embed.fields ?? []) {
      fragments.push(field.name, field.value);
    }
  }

  private _collectTextFromLayout(
    components: unknown[],
    fragments: string[],
  ): void {
    for (const comp of components) {
      if (typeof comp !== 'object' || comp === null) continue;
      const cmp = comp as Record<string, unknown>;

      if (typeof cmp['content'] === 'string') fragments.push(cmp['content']);

      for (const key of ['components', 'children', 'items']) {
        if (Array.isArray(cmp[key])) {
          this._collectTextFromLayout(cmp[key] as unknown[], fragments);
        }
      }
    }
  }

  private _buildClick(customId: string): NormalizedComponentInteraction {
    const userId = this._userId;
    const raw = {
      customId,
      deferred: false,
      replied: false,
      deferUpdate: async () => {},
      isAnySelectMenu: () => false,
      isButton: () => true,
      user: { id: userId },
    } as unknown as import('discord.js').MessageComponentInteraction;

    return {
      customId,
      type: 'button' as const,
      userId,
      deferUpdate: async () => {},
      raw,
    };
  }

  private _buildSelect(
    customId: string,
    values: string[],
  ): NormalizedComponentInteraction {
    const userId = this._userId;
    const raw = {
      customId,
      deferred: false,
      replied: false,
      deferUpdate: async () => {},
      isAnySelectMenu: () => true,
      isButton: () => false,
      values,
      user: { id: userId },
    } as unknown as import('discord.js').MessageComponentInteraction;

    return {
      customId,
      type: 'select' as const,
      userId,
      values,
      deferUpdate: async () => {},
      raw,
    };
  }

  private _buildModalSubmit(
    fields: Record<string, string>,
  ): NormalizedModalSubmission {
    const raw = {
      deferred: false,
      replied: false,
      deferUpdate: async () => {},
      fields: {
        getField: (id: string) => ({ value: fields[id] ?? '' }),
      },
    } as unknown as import('discord.js').ModalSubmitInteraction;

    return {
      getFieldValue: (id: string) => fields[id] ?? '',
      raw,
    };
  }
}
