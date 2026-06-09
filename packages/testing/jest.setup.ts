import { MenuHarness } from './src/MenuHarness';

/**
 * After every test, end any MenuHarness instances that were not explicitly
 * closed. This covers sessions left open by tests that rely on natural session
 * termination (e.g. closeMenu() inside a handler) as well as tests that
 * simply forgot sim.end(). No-op when no harnesses are active.
 */
afterEach(async () => {
  await MenuHarness.endAll();
});
