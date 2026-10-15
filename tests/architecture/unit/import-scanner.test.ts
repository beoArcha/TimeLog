import { describe, it, expect } from 'vitest';
import { ImportScanner } from '../core/import-scanner';

describe('ImportScanner (Unit Tests)', () => {
  it('should extract static imports with line numbers and type-only flags', () => {
    const code = `
import React from 'react';
import type { TimeLog } from '@bindings/TimeLog';
import { useMemo } from 'react';
`;
    const results = ImportScanner.scanSource(code, 'src/test.ts');
    expect(results).toHaveLength(3);

    expect(results[0]).toMatchObject({
      specifier: 'react',
      isRelative: false,
      isTypeOnly: false,
      lineNumber: 2,
    });

    expect(results[1]).toMatchObject({
      specifier: '@bindings/TimeLog',
      isRelative: false,
      isTypeOnly: true,
      lineNumber: 3,
    });

    expect(results[2]).toMatchObject({
      specifier: 'react',
      lineNumber: 4,
    });
  });

  it('should extract re-export statements', () => {
    const code = `
export { runProjectsCommand } from './commands/projectCommands';
export type { TerminalLine } from '../types';
export * from '@common/utils';
`;
    const results = ImportScanner.scanSource(code, 'src/features/cli/index.ts');
    expect(results).toHaveLength(3);

    expect(results[0]).toMatchObject({
      specifier: './commands/projectCommands',
      isRelative: true,
      isTypeOnly: false,
    });

    expect(results[1]).toMatchObject({
      specifier: '../types',
      isRelative: true,
      isTypeOnly: true,
    });

    expect(results[2]).toMatchObject({
      specifier: '@common/utils',
      isRelative: false,
    });
  });

  it('should extract dynamic import expressions', () => {
    const code = `
async function loadPlugin() {
  const mod = await import('@plugins/engine/EnginePlugin');
  return mod;
}
`;
    const results = ImportScanner.scanSource(code, 'src/common/loader.ts');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      specifier: '@plugins/engine/EnginePlugin',
      isRelative: false,
      isTypeOnly: false,
      lineNumber: 3,
    });
  });

  it('should ignore imports inside comments or string literals', () => {
    const code = `
// import fake1 from './fake1';
/*
  import fake2 from './fake2';
*/
const text = "import fake3 from './fake3'";
`;
    const results = ImportScanner.scanSource(code, 'src/test.ts');
    expect(results).toHaveLength(0);
  });
});
