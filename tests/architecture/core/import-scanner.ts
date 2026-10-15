import fs from 'fs';
import ts from 'typescript';
import { ImportDeclarationInfo } from './types';

/**
 * Extracts import and export-from declarations from TypeScript/JavaScript files
 * using the official TypeScript Compiler API AST parser.
 *
 * Adheres to SRP: Exclusively parses source code into structured ImportDeclarationInfo records.
 */
export class ImportScanner {
  /**
   * Scans an in-memory source string and returns all import/export-from declarations.
   *
   * @param sourceText Content of the file.
   * @param filePath Identifier for error reporting.
   */
  public static scanSource(sourceText: string, filePath = 'anonymous.ts'): ImportDeclarationInfo[] {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const imports: ImportDeclarationInfo[] = [];

    const visit = (node: ts.Node) => {
      // 1. Static import: import ... from '...'
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const specifier = node.moduleSpecifier.text;
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          imports.push({
            specifier,
            sourceFile: filePath.replace(/\\/g, '/'),
            resolvedPath: null,
            isRelative: specifier.startsWith('.'),
            isTypeOnly: Boolean(node.importClause?.isTypeOnly),
            lineNumber: line + 1,
          });
        }
      }

      // 2. Re-export: export ... from '...'
      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const specifier = node.moduleSpecifier.text;
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          imports.push({
            specifier,
            sourceFile: filePath.replace(/\\/g, '/'),
            resolvedPath: null,
            isRelative: specifier.startsWith('.'),
            isTypeOnly: Boolean(node.isTypeOnly),
            lineNumber: line + 1,
          });
        }
      }

      // 3. Dynamic import: import('...')
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const firstArg = node.arguments[0];
        if (firstArg && ts.isStringLiteral(firstArg)) {
          const specifier = firstArg.text;
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          imports.push({
            specifier,
            sourceFile: filePath.replace(/\\/g, '/'),
            resolvedPath: null,
            isRelative: specifier.startsWith('.'),
            isTypeOnly: false,
            lineNumber: line + 1,
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return imports;
  }

  /**
   * Reads a file from disk and scans its imports.
   *
   * @param absolutePath Absolute filesystem path.
   */
  public static scanFile(absolutePath: string): ImportDeclarationInfo[] {
    const content = fs.readFileSync(absolutePath, 'utf-8');
    return ImportScanner.scanSource(content, absolutePath);
  }
}
