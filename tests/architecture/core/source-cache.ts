import fs from 'fs';
import ts from 'typescript';

const parsedSources = new Map<string, ts.SourceFile>();

export function parseSource(
  filePath: string,
  sourceText: string,
  scriptKind: ts.ScriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
): ts.SourceFile {
  return ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
}

/**
 * Process-wide memo of parsed source files keyed by absolute path. The dependency graph and every
 * rule walk the same files, and each Vitest worker loads its spec files in isolation, so one
 * read + parse per file per worker replaces one per rule.
 */
export class SourceCache {
  public static getSourceFile(absolutePath: string): ts.SourceFile {
    const cached = parsedSources.get(absolutePath);
    if (cached) {
      return cached;
    }

    const sourceFile = parseSource(absolutePath, fs.readFileSync(absolutePath, 'utf-8'));
    parsedSources.set(absolutePath, sourceFile);
    return sourceFile;
  }

  public static getText(absolutePath: string): string {
    return SourceCache.getSourceFile(absolutePath).text;
  }

  public static clear(): void {
    parsedSources.clear();
  }
}
