import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ts from 'typescript';
import { SourceCache, parseSource } from '../core/source-cache';

describe('SourceCache', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-cache-'));
    SourceCache.clear();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return the same parsed instance when the same path is requested twice', () => {
    // Arrange
    const filePath = path.join(tempDir, 'sample.ts');
    fs.writeFileSync(filePath, 'export const value = 1;');

    // Act
    const first = SourceCache.getSourceFile(filePath);
    const second = SourceCache.getSourceFile(filePath);

    // Assert
    expect(second).toBe(first);
  });

  it('should not re-read the file from disk when the entry is already cached', () => {
    // Arrange
    const filePath = path.join(tempDir, 'sample.ts');
    fs.writeFileSync(filePath, 'export const value = 1;');
    SourceCache.getSourceFile(filePath);

    // Act
    fs.writeFileSync(filePath, 'export const value = 2;');
    const text = SourceCache.getText(filePath);

    // Assert
    expect(text).toBe('export const value = 1;');
  });

  it('should re-read the file when the cache was cleared', () => {
    // Arrange
    const filePath = path.join(tempDir, 'sample.ts');
    fs.writeFileSync(filePath, 'export const value = 1;');
    SourceCache.getSourceFile(filePath);
    fs.writeFileSync(filePath, 'export const value = 2;');

    // Act
    SourceCache.clear();
    const text = SourceCache.getText(filePath);

    // Assert
    expect(text).toBe('export const value = 2;');
  });

  it('should parse JSX when the file has a tsx extension', () => {
    // Arrange
    const filePath = path.join(tempDir, 'View.tsx');
    fs.writeFileSync(filePath, 'export const View = () => <div />;');

    // Act
    const sourceFile = SourceCache.getSourceFile(filePath);

    // Assert
    expect(sourceFile.languageVariant).toBe(ts.LanguageVariant.JSX);
  });

  it('should honor an explicit script kind when parsing source text', () => {
    // Arrange
    const sourceText = 'const view = <div />;';

    // Act
    const sourceFile = parseSource('snippet.ts', sourceText, ts.ScriptKind.TSX);

    // Assert
    expect(sourceFile.languageVariant).toBe(ts.LanguageVariant.JSX);
  });

  it('should set parent pointers when parsing source text', () => {
    // Arrange
    const sourceText = 'if (a) { b(); }';

    // Act
    const sourceFile = parseSource('snippet.ts', sourceText);

    // Assert
    expect(sourceFile.statements[0].parent).toBe(sourceFile);
  });
});
