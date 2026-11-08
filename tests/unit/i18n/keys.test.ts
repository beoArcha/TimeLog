import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  I18N_KEYS,
  type AppKey,
  type CalendarKey,
  type CliKey,
  type CommonKey,
  type DatabaseKey,
  type EngineKey,
  type HelpKey,
  type ProjectKey,
  type ReportKey,
  type SettingsKey,
  type TaskKey,
  type TimerKey,
  type DomainKeys,
} from '@common/i18n/keys';

import type { AppKey as ModularAppKey } from '@common/i18n/keys/app';
import type { CalendarKey as ModularCalendarKey } from '@common/i18n/keys/calendar';
import type { CliKey as ModularCliKey } from '@common/i18n/keys/cli';
import type { CommonKey as ModularCommonKey } from '@common/i18n/keys/common';
import type { DatabaseKey as ModularDatabaseKey } from '@common/i18n/keys/database';
import type { EngineKey as ModularEngineKey } from '@common/i18n/keys/engine';
import type { HelpKey as ModularHelpKey } from '@common/i18n/keys/help';
import type { ProjectKey as ModularProjectKey } from '@common/i18n/keys/project';
import type { ReportKey as ModularReportKey } from '@common/i18n/keys/report';
import type { SettingsKey as ModularSettingsKey } from '@common/i18n/keys/settings';
import type { TaskKey as ModularTaskKey } from '@common/i18n/keys/task';
import type { TimerKey as ModularTimerKey } from '@common/i18n/keys/timer';

import { dictionaries } from '@common/i18n/translator';

describe('Unit Tests: Modular i18n Domain Keys', () => {
  const domainList: (keyof DomainKeys)[] = [
    'app',
    'calendar',
    'cli',
    'common',
    'database',
    'engine',
    'help',
    'project',
    'report',
    'settings',
    'task',
    'timer',
  ];

  it('should have all 12 translation domains in dictionaries', () => {
    expect(domainList).toHaveLength(12);
    domainList.forEach((domain) => {
      expect(dictionaries[domain]).toBeDefined();
      expect(dictionaries[domain]['en']).toBeDefined();
    });
  });

  it('should verify key uniqueness across every domain dictionary', () => {
    domainList.forEach((domain) => {
      const enKeys = Object.keys(dictionaries[domain]['en']);
      const uniqueKeys = new Set(enKeys);
      expect(uniqueKeys.size).toBe(enKeys.length);
    });
  });

  it('should verify all 12 modular domain files exist under src/common/i18n/keys/', () => {
    const keysDir = path.resolve(__dirname, '../../../src/common/i18n/keys');
    expect(fs.existsSync(keysDir)).toBe(true);

    domainList.forEach((domain) => {
      const filePath = path.join(keysDir, `${domain}.ts`);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');
      const expectedTypeName = `${domain.charAt(0).toUpperCase() + domain.slice(1)}Key`;
      expect(content).toContain(`export type ${expectedTypeName} =`);
      // Verify no circular dependencies (no imports inside modular key definitions)
      expect(content).not.toContain('import ');
    });
  });

  it('should ensure src/common/i18n/keys.ts remains lean (under 100 lines)', () => {
    const keysFile = path.resolve(__dirname, '../../../src/common/i18n/keys.ts');
    const content = fs.readFileSync(keysFile, 'utf8');
    const lineCount = content.split(/\r?\n/).length;
    expect(lineCount).toBeLessThanOrEqual(100);
  });

  it('should expose I18N_KEYS contract constants and match canonical entries', () => {
    expect(I18N_KEYS.project.DeleteProject).toBe('DeleteProject');
    expect(I18N_KEYS.project.ConfirmDeleteProjectTitle).toBe('ConfirmDeleteProjectTitle');
    expect(I18N_KEYS.project.CustomColorPicker).toBe('CustomColorPicker');
    expect(I18N_KEYS.engine.EnvironmentSqlite).toBe('EnvironmentSqlite');
    expect(I18N_KEYS.engine.StatusDaemonRunning).toBe('StatusDaemonRunning');
    expect(I18N_KEYS.common.Close).toBe('Close');
  });

  it('should ensure re-exported domain types match modular type declarations', () => {
    // Type assignability checks
    const appVal: AppKey = 'AppCrashTitle';
    const modAppVal: ModularAppKey = appVal;
    expect(modAppVal).toBe('AppCrashTitle');

    const calVal: CalendarKey = 'AddLeave';
    const modCalVal: ModularCalendarKey = calVal;
    expect(modCalVal).toBe('AddLeave');

    const cliVal: CliKey = 'AddProjectDesc';
    const modCliVal: ModularCliKey = cliVal;
    expect(modCliVal).toBe('AddProjectDesc');

    const comVal: CommonKey = 'Save';
    const modComVal: ModularCommonKey = comVal;
    expect(modComVal).toBe('Save');

    const dbVal: DatabaseKey = 'DbTitle';
    const modDbVal: ModularDatabaseKey = dbVal;
    expect(modDbVal).toBe('DbTitle');

    const engVal: EngineKey = 'Ready';
    const modEngVal: ModularEngineKey = engVal;
    expect(modEngVal).toBe('Ready');

    const helpVal: HelpKey = 'AboutCreatorVibeCodingVibe';
    const modHelpVal: ModularHelpKey = helpVal;
    expect(modHelpVal).toBe('AboutCreatorVibeCodingVibe');

    const projVal: ProjectKey = 'NewProject';
    const modProjVal: ModularProjectKey = projVal;
    expect(modProjVal).toBe('NewProject');

    const repVal: ReportKey = 'Amount';
    const modRepVal: ModularReportKey = repVal;
    expect(modRepVal).toBe('Amount');

    const setVal: SettingsKey = 'Theme';
    const modSetVal: ModularSettingsKey = setVal;
    expect(modSetVal).toBe('Theme');

    const taskVal: TaskKey = 'AddTask';
    const modTaskVal: ModularTaskKey = taskVal;
    expect(modTaskVal).toBe('AddTask');

    const timVal: TimerKey = 'StartTimer';
    const modTimVal: ModularTimerKey = timVal;
    expect(modTimVal).toBe('StartTimer');
  });
});
