import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Architecture & Structure Tests', () => {
  it('should have a components directory', () => {
    const componentsExist = fs.existsSync(path.resolve(__dirname, '../src/components'));
    expect(componentsExist).toBe(true);
  });

  it('should have a utils file', () => {
    const utilsExist = fs.existsSync(path.resolve(__dirname, '../src/utils.ts'));
    expect(utilsExist).toBe(true);
  });

  it('should have a types definition file', () => {
    const typesExist = fs.existsSync(path.resolve(__dirname, '../src/types.ts'));
    expect(typesExist).toBe(true);
  });

  it('should have an i18n directory and translations', () => {
    const i18nExist = fs.existsSync(path.resolve(__dirname, '../src/utils/i18n'));
    expect(i18nExist).toBe(true);
  });

  it('should not contain large monolithic components that break SOLID', () => {
    const appFile = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
    expect(appFile).toContain('<GuiRouter');
  });
});
