import { MenuStack } from '../MenuStack';

describe('MenuStack', () => {
  describe('initial state', () => {
    it('is empty', () => {
      const stack = new MenuStack();
      expect(stack.isEmpty).toBe(true);
      expect(stack.size).toBe(0);
      expect(stack.entries).toHaveLength(0);
    });

    it('peek returns undefined', () => {
      const stack = new MenuStack();
      expect(stack.peek()).toBeUndefined();
    });

    it('pop returns undefined', () => {
      const stack = new MenuStack();
      expect(stack.pop()).toBeUndefined();
    });
  });

  describe('push / peek', () => {
    it('peek returns the last pushed entry without removing it', () => {
      const stack = new MenuStack();
      stack.push({ menuId: 'a' });
      stack.push({ menuId: 'b' });
      expect(stack.peek()?.menuId).toBe('b');
      expect(stack.size).toBe(2);
    });

    it('preserves options and snapshots on the entry', () => {
      const stack = new MenuStack();
      const paginationSnapshot = {
        currentPage: 0,
        totalPages: 3,
        itemsPerPage: 5,
        totalItems: 15,
        startIndex: 0,
        endIndex: 4,
      };
      const entry = {
        menuId: 'settings',
        options: { tab: 'general' },
        stateSnapshot: { page: 1 },
        paginationSnapshot,
      };
      stack.push(entry);
      expect(stack.peek()).toStrictEqual(entry);
    });
  });

  describe('pop', () => {
    it('returns the top entry and reduces size', () => {
      const stack = new MenuStack();
      stack.push({ menuId: 'a' });
      stack.push({ menuId: 'b' });
      const top = stack.pop();
      expect(top?.menuId).toBe('b');
      expect(stack.size).toBe(1);
    });

    it('returns undefined when empty after pops', () => {
      const stack = new MenuStack();
      stack.push({ menuId: 'a' });
      stack.pop();
      expect(stack.pop()).toBeUndefined();
    });
  });

  describe('isEmpty / size', () => {
    it('reflects push and pop correctly', () => {
      const stack = new MenuStack();
      expect(stack.isEmpty).toBe(true);
      stack.push({ menuId: 'x' });
      expect(stack.isEmpty).toBe(false);
      expect(stack.size).toBe(1);
      stack.pop();
      expect(stack.isEmpty).toBe(true);
    });
  });

  describe('entries', () => {
    it('returns entries oldest-first', () => {
      const stack = new MenuStack();
      stack.push({ menuId: 'first' });
      stack.push({ menuId: 'second' });
      stack.push({ menuId: 'third' });
      expect(stack.entries.map((e) => e.menuId)).toStrictEqual([
        'first',
        'second',
        'third',
      ]);
    });

    it('does not expose internal array (snapshot does not grow after push)', () => {
      const stack = new MenuStack();
      stack.push({ menuId: 'a' });
      const snapshot = stack.entries;
      stack.push({ menuId: 'b' });
      expect(snapshot).toHaveLength(1);
      expect(stack.entries).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      const stack = new MenuStack();
      stack.push({ menuId: 'a' });
      stack.push({ menuId: 'b' });
      stack.clear();
      expect(stack.isEmpty).toBe(true);
      expect(stack.entries).toHaveLength(0);
    });
  });
});
