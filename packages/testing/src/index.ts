export { createTestSession } from './createTestSession';
export type {
  CreateTestSessionOptions,
  TestSessionHandle,
} from './createTestSession';
export { MenuHarness } from './MenuHarness';
export type {
  ButtonResult,
  MenuHarnessOptions,
  RenderRecord,
  SelectResult,
} from './MenuHarness';
export {
  SimulatedAdapter,
  SimulatedTimeoutError,
} from './SimulatedAdapter';
// Re-exported from core for convenience: the mocks live in @flowcord/core/mocks
// so core's own unit tests can use them without a core -> testing dependency.
export {
  mockClient,
  mockCommandInteraction,
  mockComponentInteraction,
  mockMenuContext,
  mockMenuSessionLike,
  mockMessage,
  mockModalSubmitInteraction,
} from '@flowcord/core/mocks';
// Re-exported from core for convenience: EventLog is the harness's tracing sink.
export { EventLog, type SessionEvent } from '@flowcord/core';
