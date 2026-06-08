import { MessageFlags } from 'discord.js';

import {
  mockCommandInteraction,
  mockComponentInteraction,
  mockMessage,
  mockModalSubmitInteraction,
} from '@flowcord/core/mocks';
import { DiscordAdapter } from '../DiscordAdapter';
import type {
  NormalizedRenderPayload,
  NormalizedTerminalPayload,
} from '../types';

// ---------------------------------------------------------------------------
// Mock factory helpers
// ---------------------------------------------------------------------------

/** Minimal embeds-mode render payload */
function embedsPayload(
  overrides: Partial<NormalizedRenderPayload> = {},
): NormalizedRenderPayload {
  return {
    mode: 'embeds',
    embeds: [{ title: 'Test', description: 'hello' }],
    components: [],
    behavior: {
      messageCleanup: 'edit',
      ephemeral: false,
      ephemeralFallbackDisposal: 'strip',
      closedMessage: 'Menu closed.',
      deleteUserMessages: false,
      timeoutMessage: '*This interaction has timed out.*',
    },
    ...overrides,
  };
}

/** Minimal layout-mode render payload */
function layoutPayload(
  overrides: Partial<NormalizedRenderPayload> = {},
): NormalizedRenderPayload {
  return {
    mode: 'layout',
    layoutComponents: [{ type: 17, id: 1, components: [] }] as never,
    behavior: {
      messageCleanup: 'edit',
      ephemeral: false,
      ephemeralFallbackDisposal: 'strip',
      closedMessage: 'Menu closed.',
      deleteUserMessages: false,
      timeoutMessage: '*This interaction has timed out.*',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deferReply
// ---------------------------------------------------------------------------

describe('deferReply', () => {
  it('calls interaction.deferReply with no flags for non-ephemeral', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    await adapter.deferReply({ ephemeral: false });

    expect(interaction.deferReply).toHaveBeenCalledWith({});
  });

  it('calls interaction.deferReply with Ephemeral flag for ephemeral', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    await adapter.deferReply({ ephemeral: true });

    expect(interaction.deferReply).toHaveBeenCalledWith({
      flags: MessageFlags.Ephemeral,
    });
  });
});

// ---------------------------------------------------------------------------
// sendPayload — first render (editReply)
// ---------------------------------------------------------------------------

describe('sendPayload — first render', () => {
  it('calls editReply on the first render (embeds mode)', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    await adapter.sendPayload(embedsPayload());

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  it('calls editReply with IsComponentsV2 flag for layout mode', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    await adapter.sendPayload(layoutPayload());

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.IsComponentsV2 }),
    );
  });

  it('sets activeMessageMode after first render', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    expect(adapter.activeMessageMode).toBeNull();
    await adapter.sendPayload(embedsPayload());
    expect(adapter.activeMessageMode).toBe('embeds');
  });
});

// ---------------------------------------------------------------------------
// sendPayload — subsequent renders via component interaction (update)
// ---------------------------------------------------------------------------

describe('sendPayload — component interaction update', () => {
  it('calls componentInteraction.update() when there is a pending component interaction', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    await adapter.sendPayload(embedsPayload());

    const ci = mockComponentInteraction();
    adapter.setLastComponentInteraction(ci);

    await adapter.sendPayload(embedsPayload());

    expect(ci.update).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledTimes(1); // only initial render
  });

  it('falls back to message.edit() when component interaction is already deferred', async () => {
    const msg = mockMessage();
    const editReply = jest.fn().mockResolvedValue(msg);
    const interaction = mockCommandInteraction({ editReply });
    const adapter = new DiscordAdapter(interaction);

    await adapter.sendPayload(embedsPayload());

    const ci = mockComponentInteraction({ deferred: true });
    adapter.setLastComponentInteraction(ci);

    await adapter.sendPayload(embedsPayload());

    expect(ci.update).not.toHaveBeenCalled();
    expect(msg.edit).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// sendPayload — postAndDelete cleanup
// ---------------------------------------------------------------------------

describe('sendPayload — postAndDelete cleanup', () => {
  it('deletes old message and posts followUp when messageCleanup=postAndDelete', async () => {
    const msg = mockMessage();
    const editReply = jest.fn().mockResolvedValue(msg);
    const interaction = mockCommandInteraction({ editReply });
    const adapter = new DiscordAdapter(interaction);

    await adapter.sendPayload(embedsPayload());

    await adapter.sendPayload(
      embedsPayload({
        behavior: {
          messageCleanup: 'postAndDelete',
          ephemeral: false,
          ephemeralFallbackDisposal: 'strip',
          closedMessage: 'closed',
          deleteUserMessages: false,
          timeoutMessage: '*This interaction has timed out.*',
        },
      }),
    );

    expect(msg.delete).toHaveBeenCalled();
    expect(interaction.followUp).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// sendPayload — postAndStrip cleanup
// ---------------------------------------------------------------------------

describe('sendPayload — postAndStrip cleanup', () => {
  it('edits old message to remove components, then posts followUp', async () => {
    const msg = mockMessage();
    const editReply = jest.fn().mockResolvedValue(msg);
    const interaction = mockCommandInteraction({ editReply });
    const adapter = new DiscordAdapter(interaction);

    await adapter.sendPayload(embedsPayload());

    await adapter.sendPayload(
      embedsPayload({
        behavior: {
          messageCleanup: 'postAndStrip',
          ephemeral: false,
          ephemeralFallbackDisposal: 'strip',
          closedMessage: 'closed',
          deleteUserMessages: false,
          timeoutMessage: '*This interaction has timed out.*',
        },
      }),
    );

    expect(msg.edit).toHaveBeenCalledWith(
      expect.objectContaining({ components: [] }),
    );
    expect(interaction.followUp).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// awaitComponent
// ---------------------------------------------------------------------------

describe('awaitComponent', () => {
  it('calls message.awaitMessageComponent with a userId filter', async () => {
    const awaitMC = jest.fn().mockReturnValue(new Promise(() => {}));
    const msg = mockMessage({ awaitMessageComponent: awaitMC });
    const editReply = jest.fn().mockResolvedValue(msg);
    const interaction = mockCommandInteraction({ editReply });
    const adapter = new DiscordAdapter(interaction);
    await adapter.sendPayload(embedsPayload());

    const fakeCI = mockComponentInteraction();
    awaitMC.mockResolvedValueOnce(fakeCI);

    const result = await adapter.awaitComponent({
      timeout: 60000,
      userId: 'user-1',
    });

    expect(awaitMC).toHaveBeenCalledWith(
      expect.objectContaining({ time: 60000 }),
    );
    expect(result.customId).toBe('btn-1');
    expect(result.userId).toBe('user-1');
  });

  it('throws if there is no active message', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    await expect(
      adapter.awaitComponent({ timeout: 5000, userId: 'user-1' }),
    ).rejects.toThrow('No active message');
  });
});

// ---------------------------------------------------------------------------
// showModal + awaitModal
// ---------------------------------------------------------------------------

describe('showModal and awaitModal', () => {
  it('calls showModal on the trigger interaction and resolves awaitModal on submit', async () => {
    const awaitMC = jest.fn().mockReturnValue(new Promise(() => {}));
    const msg = mockMessage({ awaitMessageComponent: awaitMC });
    const editReply = jest.fn().mockResolvedValue(msg);
    const interaction = mockCommandInteraction({ editReply });
    const adapter = new DiscordAdapter(interaction);
    await adapter.sendPayload(embedsPayload());

    const getTextInputValue = jest.fn().mockReturnValue('typed text');
    const awaitModalSubmit = jest
      .fn()
      .mockReturnValue(new Promise(() => {}));
    const ci = mockComponentInteraction({ awaitModalSubmit });
    const submit = mockModalSubmitInteraction({
      fields: { getTextInputValue },
    });
    awaitModalSubmit.mockResolvedValueOnce(submit);
    awaitMC.mockResolvedValueOnce(ci);
    await adapter.awaitComponent({
      timeout: 60000,
      userId: 'user-1',
    });

    const modalData = {
      custom_id: 'my-modal',
      title: 'Test',
      components: [],
    };

    await adapter.showModal(modalData, {
      customId: 'btn-1',
      type: 'button',
      userId: 'user-1',
      deferUpdate: async () => {},
      raw: ci,
    });

    const submission = await adapter.awaitModal({
      timeout: 60000,
      userId: 'user-1',
    });

    expect(ci.showModal).toHaveBeenCalledWith(modalData);
    expect(submission.getFieldValue('field-1')).toBe('typed text');
  });

  it('throws if awaitModal is called without a prior showModal', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    await expect(
      adapter.awaitModal({ timeout: 5000, userId: 'user-1' }),
    ).rejects.toThrow('No pending modal interaction');
  });
});

// ---------------------------------------------------------------------------
// sendTerminalPayload
// ---------------------------------------------------------------------------

describe('sendTerminalPayload', () => {
  it('edits active message to remove components on reason=closed', async () => {
    const msg = mockMessage();
    const editReply = jest.fn().mockResolvedValue(msg);
    const interaction = mockCommandInteraction({ editReply });
    const adapter = new DiscordAdapter(interaction);
    await adapter.sendPayload(embedsPayload());

    const terminal: NormalizedTerminalPayload = {
      reason: 'closed',
      content: 'Menu closed.',
      mode: 'embeds',
    };
    await adapter.sendTerminalPayload(terminal);

    expect(msg.edit).toHaveBeenCalledWith(
      expect.objectContaining({ components: [] }),
    );
  });

  it('calls componentInteraction.update() for reason=cancelled with pending interaction', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);
    await adapter.sendPayload(embedsPayload());

    const ci = mockComponentInteraction();
    adapter.setLastComponentInteraction(ci);

    const terminal: NormalizedTerminalPayload = {
      reason: 'cancelled',
      content: 'Cancelled.',
      mode: 'embeds',
    };
    await adapter.sendTerminalPayload(terminal);

    expect(ci.update).toHaveBeenCalled();
  });

  it('sends layout terminal with IsComponentsV2 flag', async () => {
    const msg = mockMessage();
    const editReply = jest.fn().mockResolvedValue(msg);
    const interaction = mockCommandInteraction({ editReply });
    const adapter = new DiscordAdapter(interaction);
    await adapter.sendPayload(layoutPayload());

    const terminal: NormalizedTerminalPayload = {
      reason: 'closed',
      content: 'Menu closed.',
      mode: 'layout',
    };
    await adapter.sendTerminalPayload(terminal);

    expect(msg.edit).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.IsComponentsV2 }),
    );
  });
});

// ---------------------------------------------------------------------------
// _editEphemeralMessage (via ephemeral sendPayload)
// ---------------------------------------------------------------------------

describe('_editEphemeralMessage', () => {
  it('calls editReply for ephemeral deferred reply on first render (no extra Ephemeral flag)', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    // Ephemeral is established by deferReply — editReply does NOT re-add the flag.
    // Discord already knows the reply is ephemeral from the initial defer.
    await adapter.deferReply({ ephemeral: true });
    await adapter.sendPayload(
      embedsPayload({
        behavior: {
          messageCleanup: 'edit',
          ephemeral: true,
          ephemeralFallbackDisposal: 'strip',
          closedMessage: 'closed',
          deleteUserMessages: false,
          timeoutMessage: '*This interaction has timed out.*',
        },
      }),
    );

    expect(interaction.editReply).toHaveBeenCalledTimes(1);
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  it('calls rest.patch for ephemeral followUp message', async () => {
    const interaction = mockCommandInteraction();
    const adapter = new DiscordAdapter(interaction);

    const ephemeralBehavior = {
      messageCleanup: 'edit' as const,
      ephemeral: true,
      ephemeralFallbackDisposal: 'strip' as const,
      closedMessage: 'closed',
      deleteUserMessages: false,
      timeoutMessage: '*This interaction has timed out.*',
    };

    // First render — establishes active message via editReply
    await adapter.sendPayload(
      embedsPayload({ behavior: ephemeralBehavior }),
    );
    adapter.seedDeferEphemeral(true);

    // Second render — postAndStrip strips old message then sends followUp,
    // setting _activeMessageIsFollowUp = true on the new active message
    await adapter.sendPayload(
      embedsPayload({
        behavior: {
          ...ephemeralBehavior,
          messageCleanup: 'postAndStrip',
        },
      }),
    );
    expect(interaction.followUp).toHaveBeenCalledTimes(1);

    // Third render — editing an ephemeral followUp message uses rest.patch
    // (Discord does not allow editReply on a followUp message)
    await adapter.sendPayload(
      embedsPayload({ behavior: ephemeralBehavior }),
    );

    expect(interaction.client.rest.patch).toHaveBeenCalledTimes(1);
  });
});
