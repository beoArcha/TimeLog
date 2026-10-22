import path from 'node:path';
import { findFilesRecursive, safeReadJson } from '../fs-utils.js';

/**
 * Aggregates all JSON test results matching `test-results*.json` across candidate search paths.
 *
 * @param {string[]} [searchDirs=['coverage-reports', 'coverage', '.']] Directories to inspect for test artifacts.
 * @returns {import('../types.js').TestExecutionSummary} Aggregated test run summary.
 */
export function parseTestResults(searchDirs = ['coverage-reports', 'coverage', '.']) {
  let testFiles = [];

  for (const dir of searchDirs) {
    const found = findFilesRecursive(dir, /^test-results.*\.json$/);
    testFiles.push(...found);
  }
  testFiles = [...new Set(testFiles)];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  let durationMs = 0;
  /** @type {import('../types.js').TestFailure[]} */
  const failures = [];

  for (const file of testFiles) {
    /** @type {any} */
    const data = safeReadJson(file);
    if (!data) continue;

    totalTests += data.numTotalTests || 0;
    passedTests += data.numPassedTests || 0;
    failedTests += data.numFailedTests || 0;
    skippedTests += (data.numPendingTests || 0) + (data.numTodoTests || 0);

    if (data.startTime && Array.isArray(data.testResults)) {
      for (const tr of data.testResults) {
        if (tr.endTime && tr.startTime) {
          durationMs += tr.endTime - tr.startTime;
        }

        if (Array.isArray(tr.assertionResults)) {
          for (const ar of tr.assertionResults) {
            if (ar && ar.status === 'failed') {
              const trName = tr.name || 'tests';
              const relativePath = path.relative(process.cwd(), String(trName)).replace(/\\/g, '/');
              failures.push({
                file: relativePath,
                title: ar.fullName || ar.title || 'Unknown test failure',
                message: Array.isArray(ar.failureMessages) ? ar.failureMessages.join('\n') : ''
              });
            }
          }
        }
      }
    }
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    skipped: skippedTests,
    durationMs,
    failures
  };
}
