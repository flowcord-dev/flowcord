import assert from 'node:assert';

import {
  ButtonStyle,
  ModalBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';

import { mockMenuSessionLike } from '@flowcord/core/mocks';
import type {
  ButtonConfig,
  ModalConfig,
  SelectConfig,
} from '../../types/common';
import { MenuBuilder } from '../MenuBuilder';
import { MenuInstance } from '../MenuInstance';

function mockMenuInstance(): MenuInstance {
  const session = mockMenuSessionLike();
  const definition = new MenuBuilder(session, 'test-menu')
    .setEmbeds(() => [])
    .build();
  return new MenuInstance(definition, 'sess-1');
}

// ---------------------------------------------------------------------------
// Basic getters
// ---------------------------------------------------------------------------

describe('getters', () => {
  it('mode returns the definition render mode', () => {
    expect(mockMenuInstance().mode).toBe('embeds');
  });

  it('activeSelect is null before any registration', () => {
    expect(mockMenuInstance().activeSelect).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateButton — link button errors
// ---------------------------------------------------------------------------

describe('validateButton — link button errors', () => {
  it('throws when a link button has no url', () => {
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Link,
      label: 'Visit',
    };
    expect(() =>
      mockMenuInstance().registerButtonActions([btn]),
    ).toThrow('missing a `url`');
  });

  it('throws when a link button defines an action', () => {
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Link,
      label: 'Visit',
      url: 'https://example.com',
      action: async () => {},
    };
    expect(() =>
      mockMenuInstance().registerButtonActions([btn]),
    ).toThrow('cannot define `action`');
  });

  it('throws when a link button defines opensModal', () => {
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Link,
      label: 'Visit',
      url: 'https://example.com',
      opensModal: true,
    };
    expect(() =>
      mockMenuInstance().registerButtonActions([btn]),
    ).toThrow('cannot define `opensModal`');
  });
});

// ---------------------------------------------------------------------------
// validateButton — non-link button errors
// ---------------------------------------------------------------------------

describe('validateButton — non-link button errors', () => {
  it('throws when action and opensModal are both defined', () => {
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Primary,
      label: 'Conflict',
      action: async () => {},
      opensModal: true,
    };
    expect(() =>
      mockMenuInstance().registerButtonActions([btn]),
    ).toThrow('cannot define both `action` and `opensModal`');
  });

  it('throws when a non-disabled button defines neither action nor opensModal', () => {
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Primary,
      label: 'Empty',
    };
    expect(() =>
      mockMenuInstance().registerButtonActions([btn]),
    ).toThrow('must define either `action` or `opensModal`');
  });
});

// ---------------------------------------------------------------------------
// registerButtonActions — link button path
// ---------------------------------------------------------------------------

describe('registerButtonActions — link button', () => {
  it('does not register an action for a valid link button', () => {
    const instance = mockMenuInstance();
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Link,
      label: 'Visit',
      url: 'https://example.com',
    };
    instance.registerButtonActions([btn]);

    assert(btn.id);
    expect(instance.resolveAction(btn.id)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// registerLayoutActions — component types
// ---------------------------------------------------------------------------

describe('registerLayoutActions', () => {
  it('registers a top-level select component', () => {
    const instance = mockMenuInstance();
    const onSelect = jest.fn();
    const sel: SelectConfig = {
      type: 'select',
      builder: new StringSelectMenuBuilder(),
      id: 'my-select',
      onSelect,
    };
    instance.registerLayoutActions([sel]);

    expect(instance.resolveSelectAction('my-select')).toBe(onSelect);
    expect(instance.activeSelect).toBe(sel);
  });

  it('recurses into action_row children and registers button actions', () => {
    const instance = mockMenuInstance();
    const action = jest.fn();
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Primary,
      label: 'Go',
      action,
    };
    const row = { type: 'action_row' as const, children: [btn] };
    instance.registerLayoutActions([row]);

    assert(btn.id);
    expect(instance.resolveAction(btn.id)).toBe(action);
  });

  it('recurses into container children and registers button actions', () => {
    const instance = mockMenuInstance();
    const action = jest.fn();
    const btn: ButtonConfig = {
      type: 'button',
      style: ButtonStyle.Primary,
      label: 'Inner',
      action,
    };
    const container = { type: 'container', children: [btn] };
    instance.registerLayoutActions([container]);

    assert(btn.id);
    expect(instance.resolveAction(btn.id)).toBe(action);
  });

  it('registers a button action on a section accessory', () => {
    const instance = mockMenuInstance();
    const action = jest.fn();
    const section = {
      type: 'section',
      text: [{ content: 'Hello' }],
      accessory: {
        type: 'button' as const,
        style: ButtonStyle.Primary,
        label: 'Click',
        action,
      },
    };
    instance.registerLayoutActions([section]);
    const acc = section.accessory as ButtonConfig;

    assert(acc.id);
    expect(instance.resolveAction(acc.id)).toBe(action);
  });

  it('registers a named modal trigger on a section button accessory', () => {
    const instance = mockMenuInstance();
    const section = {
      type: 'section',
      text: [{ content: 'Hello' }],
      accessory: {
        type: 'button' as const,
        style: ButtonStyle.Primary,
        label: 'Open Modal',
        opensModal: 'specific-modal',
      },
    };
    instance.registerLayoutActions([section]);
    const acc = section.accessory as ButtonConfig;

    assert(acc.id);
    expect(instance.isModalButton(acc.id)).toBe(true);
    expect(instance.getModalIdForButton(acc.id)).toBe(
      'specific-modal',
    );
  });

  it('registers buttons inside a paginated_group via registerButtonActions', () => {
    const instance = mockMenuInstance();
    const action = jest.fn();
    const group = {
      type: 'paginated_group',
      buttons: [
        {
          type: 'button' as const,
          style: ButtonStyle.Primary,
          label: 'Page Btn',
          action,
        },
      ],
    };
    instance.registerLayoutActions([group]);
    const btn = group.buttons[0] as ButtonConfig;

    assert(btn.id);
    expect(instance.resolveAction(btn.id)).toBe(action);
  });
});

// ---------------------------------------------------------------------------
// Modal registration — getModal / openModal
// ---------------------------------------------------------------------------

describe('modal registration', () => {
  it('getModal returns a registered config by its ID', () => {
    const instance = mockMenuInstance();
    const config: ModalConfig = {
      id: 'my-modal',
      builder: new ModalBuilder()
        .setCustomId('my-modal')
        .setTitle('My Modal'),
    };
    instance.registerModalConfigs(config);
    expect(instance.getModal('my-modal')).toBe(config);
  });

  it('getModal returns undefined for an unregistered ID', () => {
    expect(
      mockMenuInstance().getModal('nonexistent'),
    ).toBeUndefined();
  });

  it('openModal activates the modal and sets isModalActive', async () => {
    const instance = mockMenuInstance();
    const config: ModalConfig = {
      builder: new ModalBuilder()
        .setCustomId('test')
        .setTitle('Test'),
    };
    instance.registerModalConfigs(config);
    await instance.openModal('__default');
    expect(instance.isModalActive).toBe(true);
    expect(instance.activeModal).toBe(config);
  });

  it('openModal with an unregistered key does not activate a modal', async () => {
    const instance = mockMenuInstance();
    await instance.openModal('nonexistent');
    expect(instance.isModalActive).toBe(false);
    expect(instance.activeModal).toBeNull();
  });
});
