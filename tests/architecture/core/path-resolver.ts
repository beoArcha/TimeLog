import path from 'path';

export interface PathResolverConfig {
  srcDir: string;
  aliases: Record<string, string>;
  knownExtensions?: string[];
}

/**
 * Resolves module import specifiers (both relative and path aliases)
 * and determines top-level boundary crossings within src/.
 */
export class PathResolver {
  private readonly srcDir: string;
  private readonly aliases: Array<{ prefix: string; targetPrefix: string }>;
  private readonly extensions: string[];

  constructor(config?: Partial<PathResolverConfig>) {
    this.srcDir = (config?.srcDir || 'src').replace(/\\/g, '/').replace(/\/$/, '');
    this.extensions = config?.knownExtensions || ['.ts', '.tsx', '.json', '.css'];

    const rawAliases = config?.aliases || {
      '@features/': 'src/features/',
      '@layouts/': 'src/layouts/',
      '@plugins/': 'src/plugins/',
      '@components/': 'src/components/',
      '@common/': 'src/common/',
      '@bindings/': 'src/bindings/',
      '@styles/': 'src/styles/',
      '@app-browser/': 'src/app-browser/',
      '@app-tauri/': 'src/app-tauri/',
      '@app/': 'src/',
      '@/': './',
    };

    this.aliases = Object.entries(rawAliases).map(([prefix, targetPrefix]) => ({
      prefix,
      targetPrefix: targetPrefix.replace(/\\/g, '/'),
    }));
  }

  /**
   * Resolves an import specifier to a normalized path relative to src/.
   * Returns null if the specifier is an external node_modules package.
   *
   * @param importingFileRel Source file relative to src/ (e.g. 'common/engine/EngineRouter.ts')
   * @param specifier Raw specifier string from import declaration
   */
  public resolve(importingFileRel: string, specifier: string): string | null {
    const normImporting = importingFileRel.replace(/\\/g, '/');

    // 1. Relative import (starts with ./)
    if (specifier.startsWith('.')) {
      const fromDir = path.posix.dirname(normImporting);
      const joined = path.posix.normalize(path.posix.join(fromDir, specifier));
      return joined;
    }

    // 2. Path Aliases
    for (const { prefix, targetPrefix } of this.aliases) {
      if (specifier.startsWith(prefix)) {
        const remainder = specifier.slice(prefix.length);
        const mapped = path.posix.join(targetPrefix, remainder);

        // Strip leading 'src/' if mapped into src
        if (mapped.startsWith('src/')) {
          return path.posix.normalize(mapped.slice(4));
        }
        return path.posix.normalize(mapped);
      }
    }

    // 3. External npm package
    return null;
  }

  /**
   * Extracts the top-level directory directly under src/.
   * E.g. 'common/engine/foo.ts' -> 'common'
   * Root files (e.g. 'App.tsx') return 'root'.
   */
  public getTopLevelDir(relPath: string): string {
    const normalized = relPath.replace(/\\/g, '/').replace(/^\//, '');
    const segments = normalized.split('/');
    if (segments.length <= 1) {
      return 'root';
    }
    return segments[0];
  }

  /**
   * Checks whether an import crosses from one top-level src directory to another.
   *
   * @param sourceRel File containing the import (relative to src/)
   * @param targetRel Target file being imported (relative to src/)
   */
  public isCrossTopLevelBoundary(sourceRel: string, targetRel: string): boolean {
    const sourceRoot = this.getTopLevelDir(sourceRel);
    const targetRoot = this.getTopLevelDir(targetRel);

    if (sourceRoot === 'root' || targetRoot === 'root') {
      return sourceRoot !== targetRoot;
    }

    return sourceRoot !== targetRoot;
  }

  /**
   * Suggests the canonical alias for a target file relative to src/.
   * E.g. 'plugins/engine/EnginePlugin' -> '@plugins/engine/EnginePlugin'
   */
  public getSuggestedAlias(targetRel: string): string {
    const topDir = this.getTopLevelDir(targetRel);
    if (topDir === 'root') {
      return `@app/${targetRel}`;
    }

    const matching = this.aliases.find(a => a.targetPrefix === `src/${topDir}/`);
    if (matching) {
      const remainder = targetRel.slice(topDir.length + 1);
      return `${matching.prefix}${remainder}`;
    }

    return `@${topDir}/${targetRel.slice(topDir.length + 1)}`;
  }
}
