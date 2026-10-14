import { describe, it, expect } from 'vitest';
import { PathResolver } from '../core/path-resolver';

describe('PathResolver (Unit Tests)', () => {
  const resolver = new PathResolver();

  describe('resolve', () => {
    it('should resolve relative imports within the same directory', () => {
      const resolved = resolver.resolve('common/engine/EngineRouter.ts', './EngineCommands');
      expect(resolved).toBe('common/engine/EngineCommands');
    });

    it('should resolve relative imports navigating up parent directories', () => {
      const resolved = resolver.resolve('features/reports/components/ReportLogList.tsx', '../utils/reportCalculator');
      expect(resolved).toBe('features/reports/utils/reportCalculator');
    });

    it('should resolve configured path aliases', () => {
      expect(resolver.resolve('common/App.tsx', '@features/cli/CliInterface')).toBe('features/cli/CliInterface');
      expect(resolver.resolve('App.tsx', '@plugins/engine/EnginePlugin')).toBe('plugins/engine/EnginePlugin');
      expect(resolver.resolve('App.tsx', '@styles/index.css')).toBe('styles/index.css');
      expect(resolver.resolve('common/foo.ts', '@bindings/TimeLog')).toBe('bindings/TimeLog');
    });

    it('should return null for external third-party packages', () => {
      expect(resolver.resolve('common/foo.ts', 'react')).toBeNull();
      expect(resolver.resolve('common/foo.ts', 'lucide-react')).toBeNull();
      expect(resolver.resolve('common/foo.ts', '@tauri-apps/api/core')).toBeNull();
    });
  });

  describe('getTopLevelDir & isCrossTopLevelBoundary', () => {
    it('should correctly identify the top-level root directory under src/', () => {
      expect(resolver.getTopLevelDir('common/engine/EngineRouter.ts')).toBe('common');
      expect(resolver.getTopLevelDir('features/cli/types.ts')).toBe('features');
      expect(resolver.getTopLevelDir('plugins/persistence/PersistencePlugin.ts')).toBe('plugins');
      expect(resolver.getTopLevelDir('App.tsx')).toBe('root');
    });

    it('should return false when importing within the same top-level directory', () => {
      const isCross = resolver.isCrossTopLevelBoundary(
        'layouts/manager/LayoutManager.tsx',
        'layouts/builders/MediumLayoutBuilder'
      );
      expect(isCross).toBe(false);
    });

    it('should return true when importing across different top-level directories', () => {
      const isCross = resolver.isCrossTopLevelBoundary(
        'common/engine/EngineRouter.ts',
        'plugins/engine/EnginePlugin'
      );
      expect(isCross).toBe(true);
    });

    it('should return true when importing between a root file and a sub-directory', () => {
      expect(resolver.isCrossTopLevelBoundary('App.tsx', 'app-browser/AppBrowser')).toBe(true);
      expect(resolver.isCrossTopLevelBoundary('features/cli/CliInterface.tsx', 'versions.json')).toBe(true);
    });
  });

  describe('getSuggestedAlias', () => {
    it('should generate appropriate alias string for target paths', () => {
      expect(resolver.getSuggestedAlias('plugins/engine/EnginePlugin')).toBe('@plugins/engine/EnginePlugin');
      expect(resolver.getSuggestedAlias('styles/index.css')).toBe('@styles/index.css');
      expect(resolver.getSuggestedAlias('versions.json')).toBe('@app/versions.json');
    });
  });
});
