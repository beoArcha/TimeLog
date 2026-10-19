import fs from 'fs';
import path from 'path';
import { DependencyNode, ModuleGraph } from './types';
import { ImportScanner } from './import-scanner';
import { PathResolver } from './path-resolver';

/**
 * Builds a ModuleGraph representing the file-level dependencies of a codebase.
 */
export class DependencyGraphBuilder {
  private static cachedGraph: ModuleGraph | null = null;

  /**
   * Builds a ModuleGraph from the filesystem under srcRoot.
   *
   * @param srcRoot Absolute or relative path to src/
   * @param forceFresh If true, bypasses in-memory cache.
   */
  public static buildGraph(srcRoot: string, forceFresh = false): ModuleGraph {
    if (this.cachedGraph && !forceFresh) {
      return this.cachedGraph;
    }

    const normalizedRoot = path.resolve(srcRoot).replace(/\\/g, '/');
    const files = DependencyGraphBuilder.findSourceFiles(normalizedRoot);

    const fileSet = new Set<string>();
    const fileIdToPath = new Map<string, string>();

    for (const fullPath of files) {
      const relPath = path.posix.relative(normalizedRoot, fullPath);
      fileSet.add(relPath);
      fileIdToPath.set(relPath, fullPath);

      // Also register extensionless forms for resolution matching
      const noExt = relPath.replace(/\.(tsx?|jsx?|json|css)$/, '');
      fileIdToPath.set(noExt, fullPath);
      if (noExt.endsWith('/index')) {
        fileIdToPath.set(noExt.slice(0, -6), fullPath);
      }
    }

    const resolver = new PathResolver({ srcDir: normalizedRoot });
    const nodes = new Map<string, DependencyNode>();
    const adjacencyList = new Map<string, Set<string>>();

    for (const relPath of fileSet) {
      const fullPath = fileIdToPath.get(relPath)!;
      const rawImports = ImportScanner.scanFile(fullPath);
      const topLevelDir = resolver.getTopLevelDir(relPath);

      const resolvedImports = rawImports.map(imp => {
        const resolved = resolver.resolve(relPath, imp.specifier);
        let matchedTarget: string | null = null;

        if (resolved) {
          if (fileSet.has(resolved)) {
            matchedTarget = resolved;
          } else if (fileIdToPath.has(resolved)) {
            const matchedFull = fileIdToPath.get(resolved)!;
            matchedTarget = path.posix.relative(normalizedRoot, matchedFull);
          }
        }

        return {
          ...imp,
          resolvedPath: matchedTarget,
        };
      });

      const node: DependencyNode = {
        id: relPath,
        absolutePath: fullPath,
        topLevelDir,
        imports: resolvedImports,
      };

      nodes.set(relPath, node);

      const edges = new Set<string>();
      for (const imp of resolvedImports) {
        if (imp.resolvedPath && imp.resolvedPath !== relPath) {
          edges.add(imp.resolvedPath);
        }
      }
      adjacencyList.set(relPath, edges);
    }

    const graph: ModuleGraph = { nodes, adjacencyList };
    this.cachedGraph = graph;
    return graph;
  }

  /**
   * Builds an in-memory ModuleGraph directly from a dictionary of file contents.
   * Useful for deterministic, fast unit tests without filesystem dependencies.
   */
  public static buildFromSources(sources: Record<string, string>): ModuleGraph {
    const resolver = new PathResolver();
    const fileSet = new Set(Object.keys(sources).map(f => f.replace(/\\/g, '/')));
    const fileIdToNorm = new Map<string, string>();

    for (const relPath of fileSet) {
      fileIdToNorm.set(relPath, relPath);
      const noExt = relPath.replace(/\.(tsx?|jsx?|json|css)$/, '');
      fileIdToNorm.set(noExt, relPath);
      if (noExt.endsWith('/index')) {
        fileIdToNorm.set(noExt.slice(0, -6), relPath);
      }
    }

    const nodes = new Map<string, DependencyNode>();
    const adjacencyList = new Map<string, Set<string>>();

    for (const [relPath, content] of Object.entries(sources)) {
      const rawImports = ImportScanner.scanSource(content, relPath);
      const topLevelDir = resolver.getTopLevelDir(relPath);

      const resolvedImports = rawImports.map(imp => {
        const resolved = resolver.resolve(relPath, imp.specifier);
        let matchedTarget: string | null = null;

        if (resolved) {
          if (fileSet.has(resolved)) {
            matchedTarget = resolved;
          } else if (fileIdToNorm.has(resolved)) {
            matchedTarget = fileIdToNorm.get(resolved)!;
          }
        }

        return {
          ...imp,
          resolvedPath: matchedTarget,
        };
      });

      nodes.set(relPath, {
        id: relPath,
        absolutePath: `/mock/${relPath}`,
        topLevelDir,
        imports: resolvedImports,
      });

      const edges = new Set<string>();
      for (const imp of resolvedImports) {
        if (imp.resolvedPath && imp.resolvedPath !== relPath) {
          edges.add(imp.resolvedPath);
        }
      }
      adjacencyList.set(relPath, edges);
    }

    return { nodes, adjacencyList };
  }

  /**
   * Recursively finds all TypeScript and relevant source files in a directory.
   */
  private static findSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...DependencyGraphBuilder.findSourceFiles(fullPath));
      } else if (entry.isFile()) {
        if (/\.(ts|tsx|json|css)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
          results.push(fullPath);
        }
      }
    }

    return results;
  }
}
