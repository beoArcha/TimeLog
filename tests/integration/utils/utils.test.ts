import { describe, it, expect } from 'vitest';
import { translate } from '@common/i18n/translator';
import { LocalStorageDataManager as DataManager } from '@/src/plugins/persistence/DataManager';

describe('Integration Tests: Utils (i18n and DataManager)', () => {
  describe('i18n Integration', () => {
    it('should translate correctly across all supported dictionaries', () => {
      const keys = ['Cancel', 'Save', 'Edit'] as const;
      const locales = ['en', 'pl', 'de', 'es', 'pt-br', 'fr'] as const;

      for (const locale of locales) {
        for (const key of keys) {
          const result = translate(locale, 'common', key);
          expect(result).toBeDefined();
          if (locale !== 'en') {
            expect(result).not.toEqual(key);
          }
        }
      }
    });

    it('should integrate translation fallback with custom dictionary mapping', () => {
      const customDict = {
        app: {
          Subtitle: 'My Custom App Subtitle',
        },
        common: {
          Save: 'Commit Changes',
        }
      };

      expect(translate('custom', 'app', 'Subtitle', customDict)).toBe('My Custom App Subtitle');
      expect(translate('custom', 'common', 'Save', customDict)).toBe('Commit Changes');
      expect(translate('custom', 'common', 'Cancel', customDict)).toBe('Cancel');
      expect(translate('custom', 'common', 'NonexistentKey' as any, customDict)).toBe('NonexistentKey');
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
