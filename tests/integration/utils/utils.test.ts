import { describe, it, expect } from 'vitest';
import { translate, dictionaries } from '@common/i18n/i18n';
import { LocalStorageDataManager as DataManager } from '@/src/plugins/persistence/DataManager';

describe('Integration Tests: Utils (i18n and DataManager)', () => {
  describe('i18n Integration', () => {
    it('should translate correctly across all supported dictionaries', () => {
      const keys = ['common.cancel', 'common.save', 'common.edit'];
      const locales: (keyof typeof dictionaries)[] = ['en', 'pl', 'de', 'es', 'pt-br', 'fr'];

      for (const locale of locales) {
        for (const key of keys) {
          const result = translate(locale, key);
          expect(result).toBeDefined();
          expect(result).not.toEqual(key);
        }
      }
    });

    it('should integrate translation fallback with custom dictionary mapping', () => {
      const customDict = {
        app: {
          title: 'My Custom App Title',
        },
        common: {
          save: 'Commit Changes',
        }
      };

      expect(translate('custom', 'app.title', customDict)).toBe('My Custom App Title');
      expect(translate('custom', 'common.save', customDict)).toBe('Commit Changes');
      expect(translate('custom', 'common.cancel', customDict)).toBe('Cancel');
      expect(translate('custom', 'common.nonexistent_key', customDict)).toBe('common.nonexistent_key');
    });

    it('should handle partial translations and fallback to English for deep nesting paths', () => {
      const customDict = {
        common: {
          nested: {
            deeply: {
              value: 'Found!'
            }
          }
        }
      };

      expect(translate('custom', 'common.nested.deeply.value', customDict)).toBe('Found!');
      expect(translate('custom', 'common.nested.deeply.missing', customDict)).toBe('common.nested.deeply.missing');
    });
  });

  describe('DataManager Integration', () => {
    it('should generate next logical IDs for projects and tasks inside mock collections', () => {
      const mockProjects = [
        { id: 'p1', name: 'Project 1' },
        { id: 'p2', name: 'Project 2' },
        { id: 'p10', name: 'Project 10' },
      ];

      const mockTasks = [
        { id: '101', name: 'Task 1' },
        { id: '102', name: 'Task 2' },
        { id: '105', name: 'Task 5' },
      ];

      expect(DataManager.getNextId(mockProjects, 'p')).toBe('p11');
      expect(DataManager.getNextId(mockTasks)).toBe('106');
    });

    it('should handle empty collections and starting states gracefully', () => {
      expect(DataManager.getNextId([], 'p')).toBe('p1');
      expect(DataManager.getNextId([])).toBe('1');
    });

    it('should resolve IDs properly when prefix does not match ID format', () => {
      const mockItems = [
        { id: 'other-1' },
        { id: 'other-2' },
      ];
      expect(DataManager.getNextId(mockItems, 'p')).toBe('p1');
    });
  });
});
