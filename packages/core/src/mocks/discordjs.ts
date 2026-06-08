/// <reference types="jest" />
import type {
  ChatInputCommandInteraction,
  Client,
  Message,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

export function mockMessage(
  overrides: Partial<Record<string, unknown>> = {},
): Message {
  const edit = jest.fn();
  const del = jest.fn();
  const msg = {
    id: 'msg-1',
    channelId: 'ch-1',
    content: '',
    author: { id: 'user-1' },
    edit,
    delete: del,
    awaitMessageComponent: jest
      .fn()
      .mockReturnValue(new Promise(() => {})),
    ...overrides,
  } as unknown as Message;
  edit.mockResolvedValue(msg);
  del.mockResolvedValue(msg);
  return msg;
}

/**
 * Build a stub ChatInputCommandInteraction for test sessions.
 * Only the fields actually accessed by MenuSession (after the adapter
 * refactor) need to be real values: user.id, client.
 */
export function mockCommandInteraction(
  overrides: Partial<Record<string, unknown>> = {},
  options: {
    message?: Message;
  } = {},
): ChatInputCommandInteraction {
  const msg = options.message ?? mockMessage();
  return {
    user: {
      id: 'user-1',
      displayName: 'TestUser',
      displayAvatarURL: () => '',
    },
    client: mockClient(),
    channel: null,
    applicationId: 'test-app-id',
    token: 'test-token',
    guildId: null,
    deferred: false,
    replied: false,
    editReply: jest.fn().mockResolvedValue(msg),
    reply: jest.fn().mockResolvedValue(msg),
    deferReply: jest.fn().mockResolvedValue(undefined),
    followUp: jest.fn().mockResolvedValue(msg),
    ...overrides,
  } as unknown as ChatInputCommandInteraction;
}

export function mockComponentInteraction(
  overrides: Partial<Record<string, unknown>> = {},
): MessageComponentInteraction {
  return {
    customId: 'btn-1',
    user: { id: 'user-1' },
    deferred: false,
    replied: false,
    deferUpdate: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    showModal: jest.fn().mockResolvedValue(undefined),
    awaitModalSubmit: jest
      .fn()
      .mockReturnValue(new Promise(() => {})),
    isAnySelectMenu: jest.fn().mockReturnValue(false),
    isButton: jest.fn().mockReturnValue(true),
    ...overrides,
  } as unknown as MessageComponentInteraction;
}

export function mockModalSubmitInteraction(
  overrides: Partial<Record<string, unknown>> = {},
): ModalSubmitInteraction {
  return {
    customId: 'my-modal',
    user: { id: 'user-1' },
    fields: {
      getTextInputValue: jest.fn().mockReturnValue(''),
    },
    deferUpdate: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ModalSubmitInteraction;
}

/**
 * Build a minimal stub Discord.js Client<true> for test sessions.
 * The client is placed on ctx.client; consumers can cast and access
 * only the fields they stub themselves.
 */
export function mockClient(): Client<true> {
  const stub: Record<string, unknown> = {
    user: {
      id: 'test-bot-id',
      tag: 'TestBot#0000',
    },
    rest: {
      patch: jest.fn().mockResolvedValue({}),
    },
    // Proxy other accesses with a descriptive error
  };

  return new Proxy(stub, {
    get(target, key) {
      if (key in target) return target[key as string];
      if (typeof key === 'symbol') return undefined;
      throw new Error(
        `[FlowCord test] Stub Client accessed unknown property: "${String(key)}". ` +
          `Add it to mockClient() or mock it in your test.`,
      );
    },
  }) as unknown as Client<true>;
}
