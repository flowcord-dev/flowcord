import { MenuBuilder } from '../MenuBuilder';
import { mockMenuSessionLike } from '../../testing';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal builder already in embeds mode — ready for further config or build(). */
function embedsBuilder(name = 'test-menu') {
  return new MenuBuilder(mockMenuSessionLike(), name).setEmbeds(
    async () => [],
  );
}

/** Minimal builder already in layout mode — ready for further config or build(). */
function layoutBuilder(name = 'test-menu') {
  return new MenuBuilder(mockMenuSessionLike(), name).setLayout(
    async () => [],
  );
}

// ---------------------------------------------------------------------------
// build() validation
// ---------------------------------------------------------------------------

describe('build() validation', () => {
  it('throws when neither setEmbeds nor setLayout is called', () => {
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'test-menu',
    );

    expect(() => builder.build()).toThrow(
      'must call either setEmbeds() or setLayout()',
    );
  });

  it('throws when both setEmbeds and setLayout are provided', () => {
    // TypeScript prevents this at compile time; this guards the runtime path.
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'test-menu',
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ) as any;
    builder._setEmbeds = async () => [];
    builder._setLayout = async () => [];

    expect(() => builder.build()).toThrow(
      'cannot use both setEmbeds() and setLayout()',
    );
  });

  it('throws when a select menu is combined with button pagination', () => {
    // TypeScript prevents this at compile time; this guards the runtime path.
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'test-menu',
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ) as any;
    builder._setEmbeds = async () => [];
    builder._setSelectMenu = async () => ({
      type: 'select',
      builder: {},
    });
    builder._setButtonsOptions = { pagination: { perPage: 5 } };

    expect(() => builder.build()).toThrow(
      'select menus cannot be used with button pagination',
    );
  });
});

// ---------------------------------------------------------------------------
// Rendering mode
// ---------------------------------------------------------------------------

describe('rendering mode', () => {
  it('produces embeds mode when setEmbeds is called', () => {
    const definition = embedsBuilder().build();

    expect(definition.mode).toBe('embeds');
    expect(definition.setEmbeds).toBeDefined();
  });

  it('produces layout mode when setLayout is called', () => {
    const definition = layoutBuilder().build();

    expect(definition.mode).toBe('layout');
    expect(definition.setLayout).toBeDefined();
  });

  it('stores the menu name on the definition', () => {
    const definition = new MenuBuilder(
      mockMenuSessionLike(),
      'my-menu',
    )
      .setEmbeds(async () => [])
      .build();

    expect(definition.name).toBe('my-menu');
  });
});

// ---------------------------------------------------------------------------
// Boolean flags
// ---------------------------------------------------------------------------

describe('boolean flags', () => {
  it('all flags default to false', () => {
    const definition = embedsBuilder().build();

    expect(definition.isReturnable).toBe(false);
    expect(definition.isCancellable).toBe(false);
    expect(definition.isTrackedInHistory).toBe(false);
    expect(definition.preserveStateOnReturn).toBe(false);
  });

  it('setReturnable marks the menu as returnable', () => {
    const definition = embedsBuilder().setReturnable().build();

    expect(definition.isReturnable).toBe(true);
  });

  it('setCancellable marks the menu as cancellable', () => {
    const definition = embedsBuilder().setCancellable().build();

    expect(definition.isCancellable).toBe(true);
  });

  it('setTrackedInHistory marks the menu as tracked', () => {
    const definition = embedsBuilder().setTrackedInHistory().build();

    expect(definition.isTrackedInHistory).toBe(true);
  });

  it('setPreserveStateOnReturn marks the menu accordingly', () => {
    const definition = embedsBuilder()
      .setPreserveStateOnReturn()
      .build();

    expect(definition.preserveStateOnReturn).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setEphemeral
// ---------------------------------------------------------------------------

describe('setEphemeral', () => {
  it('sets ephemeral to true', () => {
    const definition = embedsBuilder().setEphemeral(true).build();

    expect(definition.behavior.explicit?.ephemeral).toBe(true);
  });

  it('sets ephemeral to false', () => {
    const definition = embedsBuilder().setEphemeral(false).build();

    expect(definition.behavior.explicit?.ephemeral).toBe(false);
  });

  it('defaults to true when called without an argument', () => {
    const definition = embedsBuilder().setEphemeral().build();

    expect(definition.behavior.explicit?.ephemeral).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setMessageCleanup
// ---------------------------------------------------------------------------

describe('setMessageCleanup', () => {
  it('sets edit mode', () => {
    const definition = embedsBuilder()
      .setMessageCleanup('edit')
      .build();

    expect(definition.behavior.explicit?.messageCleanup).toBe('edit');
  });

  it('sets postAndStrip mode', () => {
    const definition = embedsBuilder()
      .setMessageCleanup('postAndStrip')
      .build();

    expect(definition.behavior.explicit?.messageCleanup).toBe(
      'postAndStrip',
    );
  });

  it('sets postAndDelete with ephemeralFallback and closedMessage', () => {
    const definition = embedsBuilder()
      .setMessageCleanup('postAndDelete', {
        ephemeralFallback: 'replace',
        closedMessage: 'Done.',
      })
      .build();

    expect(definition.behavior.explicit).toMatchObject({
      messageCleanup: 'postAndDelete',
      ephemeralFallbackDisposal: 'replace',
      closedMessage: 'Done.',
    });
  });

  it('sets postAndReplace with a custom closedMessage', () => {
    const definition = embedsBuilder()
      .setMessageCleanup('postAndReplace', {
        closedMessage: 'Finished.',
      })
      .build();

    expect(definition.behavior.explicit).toMatchObject({
      messageCleanup: 'postAndReplace',
      closedMessage: 'Finished.',
    });
  });
});

// ---------------------------------------------------------------------------
// setTimeoutMessage
// ---------------------------------------------------------------------------

describe('setTimeoutMessage', () => {
  it('sets a custom timeout message on the definition', () => {
    const definition = embedsBuilder()
      .setTimeoutMessage('Session expired. Please try again.')
      .build();

    expect(definition.behavior.explicit?.timeoutMessage).toBe(
      'Session expired. Please try again.',
    );
  });
});

// ---------------------------------------------------------------------------
// setFallbackMenu
// ---------------------------------------------------------------------------

describe('setFallbackMenu', () => {
  it('sets the fallback menu name', () => {
    const definition = embedsBuilder()
      .setFallbackMenu('main-menu')
      .build();

    expect(definition.fallbackMenu).toBe('main-menu');
    expect(definition.fallbackMenuOptions).toBeUndefined();
  });

  it('sets the fallback menu name with options', () => {
    const definition = embedsBuilder()
      .setFallbackMenu('main-menu', { source: 'settings' })
      .build();

    expect(definition.fallbackMenu).toBe('main-menu');
    expect(definition.fallbackMenuOptions).toStrictEqual({
      source: 'settings',
    });
  });
});

// ---------------------------------------------------------------------------
// setListPagination
// ---------------------------------------------------------------------------

describe('setListPagination', () => {
  it('stores list pagination options on the definition', () => {
    const mockGetTotal = jest.fn().mockResolvedValue(100);
    const definition = embedsBuilder()
      .setListPagination({
        getTotalQuantityItems: mockGetTotal,
        itemsPerPage: 10,
      })
      .build();

    expect(definition.listPagination).toBeDefined();
    expect(definition.listPagination?.itemsPerPage).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

describe('lifecycle hooks', () => {
  it.each([
    'onEnter',
    'onLeave',
    'onCancel',
    'beforeRender',
    'afterRender',
    'onNext',
    'onPrevious',
    'onAction',
  ] as const)('%s hook is stored on the definition', (hookName) => {
    const mockFn = jest.fn();
    const builder = embedsBuilder();

    builder[hookName](mockFn);
    const definition = builder.build();

    expect(definition.hooks[hookName]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// setModal
// ---------------------------------------------------------------------------

describe('setModal', () => {
  it('stores the modal callback on the definition', () => {
    const mockModal = jest.fn();
    const definition = embedsBuilder().setModal(mockModal).build();

    expect(definition.setModal).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// setMessageHandler
// ---------------------------------------------------------------------------

describe('setMessageHandler', () => {
  it('stores the message handler callback on the definition', () => {
    const mockHandler = jest.fn();
    const definition = embedsBuilder()
      .setMessageHandler(mockHandler)
      .build();

    expect(definition.handleMessage).toBeDefined();
  });

  it('stores the optional behavior override', () => {
    const mockHandler = jest.fn();
    const definition = embedsBuilder()
      .setMessageHandler(mockHandler, {
        behavior: { messageCleanup: 'postAndStrip' },
      })
      .build();

    expect(definition.messageHandlerBehavior?.messageCleanup).toBe(
      'postAndStrip',
    );
  });
});

// ---------------------------------------------------------------------------
// extendContext
// ---------------------------------------------------------------------------

describe('extendContext', () => {
  it('stores the context extension on the definition', () => {
    const extFn = jest.fn().mockReturnValue({ helper: 'value' });
    const definition = embedsBuilder().extendContext(extFn).build();

    expect(definition.contextExtensions).toHaveLength(1);
    expect(definition.contextExtensions[0]).toBe(extFn);
  });

  it('accumulates multiple context extensions in order', () => {
    const extA = jest.fn();
    const extB = jest.fn();
    const definition = embedsBuilder()
      .extendContext(extA)
      .extendContext(extB)
      .build();

    expect(definition.contextExtensions).toStrictEqual([extA, extB]);
  });

  it('produces an independent copy of extensions on each build()', () => {
    const extFn = jest.fn();
    const builder = embedsBuilder().extendContext(extFn);
    const defA = builder.build();
    const defB = builder.build();

    expect(defA.contextExtensions).not.toBe(defB.contextExtensions);
  });
});

// ---------------------------------------------------------------------------
// fromDefinition
// ---------------------------------------------------------------------------

describe('fromDefinition', () => {
  it('configures embeds mode from an object literal', () => {
    const mockEmbeds = jest.fn().mockResolvedValue([]);
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'lit-menu',
    );
    builder.fromDefinition({ embeds: mockEmbeds });
    const definition = builder.build();

    expect(definition.mode).toBe('embeds');
    expect(definition.setEmbeds).toBeDefined();
  });

  it('configures layout mode from an object literal', () => {
    const mockLayout = jest.fn().mockResolvedValue([]);
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'lit-menu',
    );
    builder.fromDefinition({ layout: mockLayout });
    const definition = builder.build();

    expect(definition.mode).toBe('layout');
    expect(definition.setLayout).toBeDefined();
  });

  it('applies cancellable, returnable, and trackInHistory from options', () => {
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'lit-menu',
    );
    builder.fromDefinition({
      embeds: jest.fn(),
      options: {
        cancellable: true,
        returnable: true,
        trackInHistory: true,
      },
    });
    const definition = builder.build();

    expect(definition.isCancellable).toBe(true);
    expect(definition.isReturnable).toBe(true);
    expect(definition.isTrackedInHistory).toBe(true);
  });

  it('applies hooks from the literal definition', () => {
    const onEnterFn = jest.fn();
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'lit-menu',
    );
    builder.fromDefinition({
      embeds: jest.fn(),
      hooks: { onEnter: onEnterFn },
    });
    const definition = builder.build();

    expect(definition.hooks.onEnter).toBe(onEnterFn);
  });

  it('stores setup, modal, and messageHandler callbacks from the literal', () => {
    const mockSetup = jest.fn();
    const mockModal = jest.fn();
    const mockHandler = jest.fn();
    const builder = new MenuBuilder(
      mockMenuSessionLike(),
      'lit-menu',
    );
    builder.fromDefinition({
      embeds: jest.fn(),
      setup: mockSetup,
      modal: mockModal,
      messageHandler: mockHandler,
    });
    const definition = builder.build();

    expect(definition.setup).toBeDefined();
    expect(definition.setModal).toBeDefined();
    expect(definition.handleMessage).toBeDefined();
  });
});
