import { StateAccessor } from '../StateAccessor';

interface TestState extends Record<string, unknown> {
  page: number;
  filter: string;
  active: boolean;
}

const defaultInitialState: TestState = {
  page: 1,
  filter: 'all',
  active: true,
};

describe('StateAccessor', () => {
  describe('current', () => {
    it('returns the full state snapshot', () => {
      const accessor = new StateAccessor(defaultInitialState);
      expect(accessor.current).toStrictEqual({
        page: 1,
        filter: 'all',
        active: true,
      });
    });

    it('does not expose internal reference (mutating snapshot does not affect state)', () => {
      const accessor = new StateAccessor(defaultInitialState);
      const snap = accessor.current;
      (snap as TestState).page = 999;
      expect(accessor.get('page')).toBe(1);
    });
  });

  describe('get', () => {
    it('returns the value for a key', () => {
      const accessor = new StateAccessor(defaultInitialState);
      expect(accessor.get('page')).toBe(1);
      expect(accessor.get('filter')).toBe('all');
    });
  });

  describe('set', () => {
    it('updates only the specified property', () => {
      const accessor = new StateAccessor(defaultInitialState);
      accessor.set('page', 5);
      expect(accessor.get('page')).toBe(5);
      // other keys are unaffected
      expect(accessor.get('filter')).toBe('all');
    });
  });

  describe('merge', () => {
    it('merges partial state, preserving unmentioned keys', () => {
      const accessor = new StateAccessor(defaultInitialState);
      accessor.merge({ page: 3, active: false });
      expect(accessor.current).toStrictEqual({
        page: 3,
        filter: 'all',
        active: false,
      });
    });

    it('empty merge leaves state unchanged', () => {
      const accessor = new StateAccessor(defaultInitialState);
      accessor.merge({});
      expect(accessor.current).toStrictEqual({
        page: 1,
        filter: 'all',
        active: true,
      });
    });
  });

  describe('reset', () => {
    it('replaces all state with the provided value', () => {
      const accessor = new StateAccessor(defaultInitialState);
      accessor.set('page', 10);
      accessor.reset({ page: 0, filter: 'none', active: false });

      expect(accessor.current).toStrictEqual({
        page: 0,
        filter: 'none',
        active: false,
      });
    });
  });
});
