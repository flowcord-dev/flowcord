import { ComponentIdManager } from '../ComponentIdManager';

const SESSION = 'sess_abc123';
const MENU = 'my-menu';

describe('ComponentIdManager', () => {
  describe('namespace()', () => {
    it('prefixes with sessionId:menuId:', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      expect(manager.namespace('btn-confirm')).toBe(
        'sess_abc123:my-menu:btn-confirm',
      );
    });

    it('works with empty component id', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      expect(manager.namespace('')).toBe('sess_abc123:my-menu:');
    });

    it('works when component id contains colons', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      // edge case: component id itself has colons
      const namespaced = manager.namespace('a:b:c');
      expect(namespaced).toBe('sess_abc123:my-menu:a:b:c');
      const parsed = ComponentIdManager.parse(namespaced);
      expect(parsed?.componentId).toBe('a:b:c');
    });
  });

  describe('parse()', () => {
    it('returns null for strings without enough colons', () => {
      expect(ComponentIdManager.parse('noseparator')).toBeNull();
      expect(ComponentIdManager.parse('one:only')).toBeNull();
    });

    it('parses a valid namespaced id', () => {
      const result = ComponentIdManager.parse(
        'sess_abc123:my-menu:btn-ok',
      );
      expect(result).toEqual({
        sessionId: 'sess_abc123',
        menuId: 'my-menu',
        componentId: 'btn-ok',
      });
    });

    it('roundtrips with namespace()', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      const namespaced = manager.namespace('open-detail');
      const parsed = ComponentIdManager.parse(namespaced);
      expect(parsed).toEqual({
        sessionId: SESSION,
        menuId: MENU,
        componentId: 'open-detail',
      });
    });
  });

  describe('rewriteComponentIds()', () => {
    it('namespaces custom_id fields in a flat object', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      const input = {
        type: 2,
        custom_id: 'confirm',
        label: 'Confirm',
      };
      const result = manager.rewriteComponentIds(input);
      expect(result.custom_id).toBe('sess_abc123:my-menu:confirm');
      expect(result.label).toBe('Confirm');
    });

    it('recurses into arrays', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      const input = {
        type: 1,
        components: [
          { type: 2, custom_id: 'yes' },
          { type: 2, custom_id: 'no' },
        ],
      };
      const result = manager.rewriteComponentIds(input);
      expect(result.components[0].custom_id).toBe(
        'sess_abc123:my-menu:yes',
      );
      expect(result.components[1].custom_id).toBe(
        'sess_abc123:my-menu:no',
      );
    });

    it('recurses into nested objects', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      const input = {
        type: 9,
        components: [
          { type: 1, components: [{ type: 2, custom_id: 'deep' }] },
        ],
      };
      const result = manager.rewriteComponentIds(input);
      expect(result.components[0].components[0].custom_id).toBe(
        'sess_abc123:my-menu:deep',
      );
    });

    it('does not double-namespace an already-namespaced id', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      const alreadyNamespaced = 'sess_abc123:my-menu:confirm';
      const input = { custom_id: alreadyNamespaced };
      const result = manager.rewriteComponentIds(input);
      expect(result.custom_id).toBe(alreadyNamespaced);
    });

    it('handles null and undefined gracefully', () => {
      const manager = new ComponentIdManager(SESSION, MENU);
      expect(manager.rewriteComponentIds(null)).toBeNull();
      expect(manager.rewriteComponentIds(undefined)).toBeUndefined();
    });
  });
});
