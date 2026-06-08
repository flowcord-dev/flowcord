import { StateStore } from '../StateStore';

describe('StateStore', () => {
  describe('get / set', () => {
    it('returns undefined for unknown keys', () => {
      const store = new StateStore();
      expect(store.get('missing')).toBeUndefined();
    });

    it('stores and retrieves a value', () => {
      const store = new StateStore();
      store.set('count', 42);
      expect(store.get('count')).toBe(42);
    });

    it('overwrites an existing value', () => {
      const store = new StateStore();
      store.set('name', 'alice');
      store.set('name', 'bob'); // NOSONAR — intentional overwrite, this is what the test is verifying
      expect(store.get('name')).toBe('bob');
    });

    it('handles different value types', () => {
      const store = new StateStore();
      store.set('str', 'hello');
      store.set('num', 99);
      store.set('bool', true);
      store.set('obj', { nested: true });
      store.set('arr', [1, 2, 3]);

      expect(store.get('str')).toBe('hello');
      expect(store.get('num')).toBe(99);
      expect(store.get('bool')).toBe(true);
      expect(store.get('obj')).toStrictEqual({ nested: true });
      expect(store.get('arr')).toStrictEqual([1, 2, 3]);
    });
  });

  describe('has', () => {
    it('returns false when key is absent', () => {
      const store = new StateStore();
      expect(store.has('x')).toBe(false);
    });

    it('returns true after set', () => {
      const store = new StateStore();
      store.set('x', 0);
      expect(store.has('x')).toBe(true);
    });
  });

  describe('delete', () => {
    it('returns true when key existed and removes the value', () => {
      const store = new StateStore();
      store.set('k', 1);
      expect(store.delete('k')).toBe(true);
      expect(store.get('k')).toBeUndefined();
    });

    it('returns false when key did not exist', () => {
      const store = new StateStore();
      expect(store.delete('nope')).toBe(false);
    });
  });

  describe('size', () => {
    it('starts at 0', () => {
      const store = new StateStore();
      expect(store.size).toBe(0);
    });

    it('increments with set, decrements with delete', () => {
      const store = new StateStore();
      store.set('a', 1);
      store.set('b', 2);
      expect(store.size).toBe(2);
      store.delete('a');
      expect(store.size).toBe(1);
    });
  });

  describe('keys', () => {
    it('yields all stored keys', () => {
      const store = new StateStore();
      store.set('x', 1);
      store.set('y', 2);
      expect(
        [...store.keys()].sort((a, b) => a.localeCompare(b)),
      ).toStrictEqual(['x', 'y']);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      const store = new StateStore();
      store.set('a', 1);
      store.set('b', 2);
      store.clear();
      expect(store.size).toBe(0);
      expect(store.get('a')).toBeUndefined();
    });
  });
});
