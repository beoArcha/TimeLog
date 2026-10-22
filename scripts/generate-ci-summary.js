#!/usr/bin/env bun
import fs from 'node:fs';
import { buildMarkdownSummary } from './ci/formatters/markdown-summary-builder.js';
import { parseFrontendCoverage } from './ci/parsers/frontend-coverage-parser.js';
import { parseRustCoverage } from './ci/parsers/rust-coverage-parser.js';
import { parseTestResults } from './ci/parsers/test-results-parser.js';
import { updateOrPostPRComment } from './ci/services/pr-comment-service.js';

/**
 * Returns mock data for local verification of report generation and markdown styling.
 *
 * @returns {{ testResults: import('./ci/types.js').TestExecutionSummary, frontendCov: import('./ci/types.js').LayerCoverageReport, rustCov: import('./ci/types.js').LayerCoverageReport }}
 */
function createMockData() {
  const testResults = {
    total: 350,
    passed: 348,
    failed: 2,
    skipped: 0,
    durationMs: 14200,
    failures: [
      {
        file: 'tests/unit/workflows/rules/DailyBoundaryRule.test.ts',
        title: 'DailyBoundaryRule > should stop timer on boundary overflow',
        message:
          'AssertionError: expected true to deeply equal false\n- Expected: false\n+ Received: true\n    at tests/unit/workflows/rules/DailyBoundaryRule.test.ts:42:15'
      },
      {
        file: 'src-tauri/tests/unit/engine_test.rs',
        title: 'test_given_active_timer_when_expired_then_stops',
        message:
          'thread "test_given_active_timer_when_expired_then_stops" panicked at "assertion failed: `(left == right)`\n  left: `Active`,\n right: `Stopped`", src-tauri/tests/unit/engine_test.rs:88:9'
      }
    ]
  };

  const frontendCov = {
    total: {
      lines: { pct: 84.5 },
      statements: { pct: 85.2 },
      branches: { pct: 78.4 },
      functions: { pct: 82.1 }
    },
    breakdown: [
      { name: 'src/features/', lines: 88.0, statements: 89.0, branches: 82.0, functions: 86.0 },
      { name: 'src/common/', lines: 92.5, statements: 93.0, branches: 89.0, functions: 91.0 },
      { name: 'src/plugins/', lines: 81.0, statements: 82.0, branches: 76.0, functions: 79.0 },
      { name: 'src/components/', lines: 76.5, statements: 77.0, branches: 71.0, functions: 74.0 }
    ]
  };

  const rustCov = {
    linesPct: 74.2,
    breakdown: [
      { name: 'src-tauri/src/engine/', lines: 88.5 },
      { name: 'src-tauri/src/repositories/', lines: 81.2 },
      { name: 'src-tauri/src/persistence/', lines: 76.0 },
      { name: 'src-tauri/src/cli/', lines: 72.4 },
      { name: 'src-tauri/src/sinks/', lines: 65.0 },
      { name: 'src-tauri/src/tray/', lines: 61.8 }
    ]
  };

  return { testResults, frontendCov, rustCov };
}

function main() {
  const isMock = process.argv.includes('--mock');

  let testResults;
  let frontendCov;
  let rustCov;

  if (isMock) {
    console.log('Running in --mock mode for preview testing...');
    const mock = createMockData();
    testResults = mock.testResults;
    frontendCov = mock.frontendCov;
    rustCov = mock.rustCov;
  } else {
    testResults = parseTestResults();
    frontendCov = parseFrontendCoverage();
    rustCov = parseRustCoverage();
  }

  const markdown = buildMarkdownSummary(testResults, frontendCov, rustCov);

  console.log('\n--- GENERATED REPORT ---');
  console.log(markdown);
  console.log('------------------------\n');

  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryPath) {
    fs.appendFileSync(stepSummaryPath, markdown + '\n', 'utf8');
    console.log(`Appended summary report to $GITHUB_STEP_SUMMARY (${stepSummaryPath})`);
  }

  if (!isMock) {
    updateOrPostPRComment(markdown);
  }

  if (testResults.failed > 0 && !isMock) {
    console.error(`Pipeline failure: ${testResults.failed} tests failed.`);
    process.exit(1);
  }
}

main();
