#!/usr/bin/env bun
/**
 * Generates GitLab-style test results and code coverage summary for GitHub Actions.
 * Outputs to $GITHUB_STEP_SUMMARY and updates sticky PR comment if running on pull_request.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MARKER = '<!-- oxyflow-test-coverage-summary -->';

function formatPct(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '—';
  const num = Number(pct).toFixed(1);
  if (num >= 80) return `🟢 \`${num}%\``;
  if (num >= 60) return `🟡 \`${num}%\``;
  return `🔴 \`${num}%\``;
}

function getStatusBadge(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '⚪ UNKNOWN';
  const num = Number(pct);
  if (num >= 80) return '🟢 PASS';
  if (num >= 60) return '🟡 WARN';
  return '🔴 FAIL';
}

function findFilesRecursive(dir, pattern) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFilesRecursive(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ──────────────────────────────────────────────
// 1. Parse Test Results
// ──────────────────────────────────────────────
function parseTestResults() {
  const searchDirs = ['coverage-reports', 'coverage', '.'];
  let testFiles = [];

  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const found = findFilesRecursive(dir, /^test-results.*\.json$/);
      testFiles = testFiles.concat(found);
    }
  }
  testFiles = [...new Set(testFiles)];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  let durationMs = 0;
  const failures = [];

  for (const file of testFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      totalTests += data.numTotalTests || 0;
      passedTests += data.numPassedTests || 0;
      failedTests += data.numFailedTests || 0;
      skippedTests += (data.numPendingTests || 0) + (data.numTodoTests || 0);
      if (data.startTime && data.testResults) {
        for (const tr of data.testResults) {
          if (tr.endTime && tr.startTime) {
            durationMs += (tr.endTime - tr.startTime);
          }
          if (tr.assertionResults) {
            for (const ar of tr.assertionResults) {
              if (ar.status === 'failed') {
                const relativePath = path.relative(process.cwd(), tr.name).replace(/\\/g, '/');
                failures.push({
                  file: relativePath,
                  title: ar.fullName || ar.title,
                  message: (ar.failureMessages || []).join('\n')
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse test file ${file}:`, e.message);
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

// ──────────────────────────────────────────────
// 2. Parse Frontend Coverage
// ──────────────────────────────────────────────
function parseFrontendCoverage() {
  const candidateFiles = [
    'coverage-merged/coverage-final.json',
    'coverage-reports/coverage-summary.json',
    'coverage-reports/coverage-unit/coverage-summary.json',
    'coverage-reports/coverage-integration/coverage-summary.json',
    'coverage/coverage-summary.json',
    'coverage/unit/coverage-summary.json'
  ];

  let summaryData = null;

  for (const file of candidateFiles) {
    if (fs.existsSync(file)) {
      try {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (raw.total) {
          summaryData = raw;
          break;
        }
      } catch (e) {
        // continue
      }
    }
  }

  // If no summary found, check if nyc coverage-final exists and compute summary
  if (!summaryData && fs.existsSync('coverage-merged/coverage-final.json')) {
    try {
      const finalJson = JSON.parse(fs.readFileSync('coverage-merged/coverage-final.json', 'utf8'));
      let totalLines = 0, coveredLines = 0;
      let totalStmts = 0, coveredStmts = 0;
      let totalFuncs = 0, coveredFuncs = 0;
      let totalBranches = 0, coveredBranches = 0;

      for (const [filePath, fileData] of Object.entries(finalJson)) {
        if (fileData.s) {
          for (const count of Object.values(fileData.s)) {
            totalStmts++;
            if (count > 0) coveredStmts++;
          }
        }
        if (fileData.f) {
          for (const count of Object.values(fileData.f)) {
            totalFuncs++;
            if (count > 0) coveredFuncs++;
          }
        }
        if (fileData.b) {
          for (const branchArr of Object.values(fileData.b)) {
            for (const count of branchArr) {
              totalBranches++;
              if (count > 0) coveredBranches++;
            }
          }
        }
      }
      totalLines = totalStmts;
      coveredLines = coveredStmts;

      summaryData = {
        total: {
          lines: { pct: totalLines ? (coveredLines / totalLines) * 100 : 100 },
          statements: { pct: totalStmts ? (coveredStmts / totalStmts) * 100 : 100 },
          branches: { pct: totalBranches ? (coveredBranches / totalBranches) * 100 : 100 },
          functions: { pct: totalFuncs ? (coveredFuncs / totalFuncs) * 100 : 100 }
        }
      };
    } catch (e) {
      console.warn('Warning: Could not aggregate coverage-final.json:', e.message);
    }
  }

  if (!summaryData) {
    return null;
  }

  // Calculate breakdown per subfolder if file entries exist
  const modules = [
    { name: 'src/features/', prefix: 'src/features' },
    { name: 'src/common/', prefix: 'src/common' },
    { name: 'src/plugins/', prefix: 'src/plugins' },
    { name: 'src/components/', prefix: 'src/components' },
    { name: 'src/layouts/', prefix: 'src/layouts' }
  ];

  const breakdown = [];

  for (const mod of modules) {
    let modLinesTot = 0, modLinesCov = 0;
    let modStmtsTot = 0, modStmtsCov = 0;
    let modFuncsTot = 0, modFuncsCov = 0;
    let modBranchesTot = 0, modBranchesCov = 0;
    let hasFiles = false;

    for (const [filePath, fileMetrics] of Object.entries(summaryData)) {
      if (filePath === 'total') continue;
      const normalizedPath = filePath.replace(/\\/g, '/');
      if (normalizedPath.includes(mod.prefix)) {
        hasFiles = true;
        if (fileMetrics.lines) {
          modLinesTot += fileMetrics.lines.total || 0;
          modLinesCov += fileMetrics.lines.covered || 0;
        }
        if (fileMetrics.statements) {
          modStmtsTot += fileMetrics.statements.total || 0;
          modStmtsCov += fileMetrics.statements.covered || 0;
        }
        if (fileMetrics.functions) {
          modFuncsTot += fileMetrics.functions.total || 0;
          modFuncsCov += fileMetrics.functions.covered || 0;
        }
        if (fileMetrics.branches) {
          modBranchesTot += fileMetrics.branches.total || 0;
          modBranchesCov += fileMetrics.branches.covered || 0;
        }
      }
    }

    if (hasFiles && modLinesTot > 0) {
      breakdown.push({
        name: mod.name,
        lines: (modLinesCov / modLinesTot) * 100,
        statements: modStmtsTot ? (modStmtsCov / modStmtsTot) * 100 : 100,
        branches: modBranchesTot ? (modBranchesCov / modBranchesTot) * 100 : 100,
        functions: modFuncsTot ? (modFuncsCov / modFuncsTot) * 100 : 100
      });
    }
  }

  return {
    total: summaryData.total,
    breakdown
  };
}

// ──────────────────────────────────────────────
// 3. Parse Rust Coverage
// ──────────────────────────────────────────────
function parseRustCoverage() {
  const candidateFiles = [
    'coverage/rust/tarpaulin-report.json',
    'coverage-reports/tarpaulin-report.json',
    'coverage-rust/tarpaulin-report.json'
  ];

  for (const file of candidateFiles) {
    if (fs.existsSync(file)) {
      try {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        // Tarpaulin JSON can provide covered / coverable lines
        if (raw.covered !== undefined && raw.coverable !== undefined) {
          const pct = raw.coverable > 0 ? (raw.covered / raw.coverable) * 100 : 100;
          return {
            linesPct: pct,
            covered: raw.covered,
            coverable: raw.coverable
          };
        }
      } catch (e) {
        // continue
      }
    }
  }

  // Also check cobertura XML
  const xmlCandidates = [
    'coverage/rust/cobertura.xml',
    'coverage-reports/cobertura.xml',
    'coverage-rust/cobertura.xml'
  ];

  for (const file of xmlCandidates) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const match = content.match(/line-rate="([0-9.]+)"/);
        if (match && match[1]) {
          return {
            linesPct: parseFloat(match[1]) * 100
          };
        }
      } catch (e) {
        // continue
      }
    }
  }

  return null;
}

// ──────────────────────────────────────────────
// 4. Build Markdown Report
// ──────────────────────────────────────────────
function buildMarkdown(testResults, frontendCov, rustCov) {
  const parts = [];

  parts.push(MARKER);
  parts.push('## 🧪 Test & Code Coverage Summary (GitLab Style)');
  parts.push('');

  // 1. Test Execution Card
  const durationSec = (testResults.durationMs / 1000).toFixed(2);
  const statusIcon = testResults.failed > 0 ? '❌ FAILED' : '✅ PASSED';

  parts.push('### 📋 Test Execution');
  parts.push('| Status | Passed | Failed | Skipped | Total Tests | Duration |');
  parts.push('| :---: | :---: | :---: | :---: | :---: | :---: |');
  parts.push(`| **${statusIcon}** | \`${testResults.passed}\` ✅ | \`${testResults.failed}\` ${testResults.failed > 0 ? '❌' : ''} | \`${testResults.skipped}\` ⚠️ | \`${testResults.total}\` | \`${durationSec}s\` ⏱️ |`);
  parts.push('');

  // 2. Failures details if any
  if (testResults.failures && testResults.failures.length > 0) {
    parts.push(`### ❌ Failed Tests (${testResults.failures.length})`);
    for (const fail of testResults.failures) {
      parts.push('<details open>');
      parts.push(`<summary><b><code>${fail.file}</code> &gt; ${fail.title}</b></summary>`);
      parts.push('');
      parts.push('```text');
      parts.push(fail.message.trim() || 'No additional error details recorded.');
      parts.push('```');
      parts.push('</details>');
      parts.push('');
    }
  }

  // 3. Coverage Table
  parts.push('### 📊 Code Coverage Metrics');

  if (!frontendCov && !rustCov) {
    parts.push('*No coverage reports detected in current artifacts.*');
  } else {
    parts.push('| Layer / Module | Lines | Statements | Branches | Functions | Status |');
    parts.push('| :--- | :---: | :---: | :---: | :---: | :---: |');

    // Frontend total
    if (frontendCov && frontendCov.total) {
      const l = frontendCov.total.lines?.pct;
      const s = frontendCov.total.statements?.pct;
      const b = frontendCov.total.branches?.pct;
      const f = frontendCov.total.functions?.pct;
      parts.push(`| **Frontend (TypeScript / React)** | ${formatPct(l)} | ${formatPct(s)} | ${formatPct(b)} | ${formatPct(f)} | ${getStatusBadge(l)} |`);

      // Submodules
      for (const sub of frontendCov.breakdown) {
        parts.push(`| &nbsp;&nbsp;↳ \`${sub.name}\` | ${formatPct(sub.lines)} | ${formatPct(sub.statements)} | ${formatPct(sub.branches)} | ${formatPct(sub.functions)} | ${getStatusBadge(sub.lines)} |`);
      }
    }

    // Rust total
    if (rustCov) {
      const rl = rustCov.linesPct;
      parts.push(`| **Backend Engine (Rust / SQLite)** | ${formatPct(rl)} | ${formatPct(rl)} | — | — | ${getStatusBadge(rl)} |`);
    }

    // Project Total (average of frontend and backend lines)
    if (frontendCov?.total?.lines?.pct !== undefined && rustCov?.linesPct !== undefined) {
      const avgLines = (frontendCov.total.lines.pct + rustCov.linesPct) / 2;
      parts.push(`| **Overall Combined Project** | ${formatPct(avgLines)} | — | — | — | ${getStatusBadge(avgLines)} |`);
    }
  }

  parts.push('');
  parts.push(`*Generated at ${new Date().toISOString()} by oXyFlow CI Pipeline.*`);

  return parts.join('\n');
}

// ──────────────────────────────────────────────
// 5. Update Pull Request Comment
// ──────────────────────────────────────────────
function tryUpdatePRComment(markdown) {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath || !fs.existsSync(eventPath)) return;

    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const prNumber = event.pull_request?.number;
    if (!prNumber) return;

    console.log(`Detected Pull Request #${prNumber}. Searching for existing summary comment...`);

    // List comments
    const listCmd = `gh pr view ${prNumber} --json comments --jq '.comments[] | {id: .id, body: .body}'`;
    const commentsRaw = execSync(listCmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const comments = commentsRaw.trim().split('\n').filter(Boolean).map(c => {
      try { return JSON.parse(c); } catch (e) { return null; }
    }).filter(Boolean);

    const existing = comments.find(c => c.body && c.body.includes(MARKER));

    if (existing && existing.id) {
      console.log(`Updating existing comment ${existing.id}...`);
      const tmpFile = path.resolve('.pr_comment.md');
      fs.writeFileSync(tmpFile, markdown, 'utf8');
      execSync(`gh api -X PATCH "repos/${process.env.GITHUB_REPOSITORY}/issues/comments/${existing.id}" -F body=@${tmpFile}`, { stdio: 'inherit' });
      fs.unlinkSync(tmpFile);
    } else {
      console.log(`Creating new sticky comment on PR #${prNumber}...`);
      const tmpFile = path.resolve('.pr_comment.md');
      fs.writeFileSync(tmpFile, markdown, 'utf8');
      execSync(`gh pr comment ${prNumber} --body-file ${tmpFile}`, { stdio: 'inherit' });
      fs.unlinkSync(tmpFile);
    }
    console.log(`Successfully updated PR #${prNumber} comment!`);
  } catch (err) {
    console.warn(`Note: Could not update PR comment (insufficient permissions or not a PR):`, err.message);
  }
}

// ──────────────────────────────────────────────
// Main Execution
// ──────────────────────────────────────────────
function main() {
  const isMock = process.argv.includes('--mock');

  let testResults;
  let frontendCov;
  let rustCov;

  if (isMock) {
    console.log('Running in --mock mode for preview testing...');
    testResults = {
      total: 350,
      passed: 348,
      failed: 2,
      skipped: 0,
      durationMs: 14200,
      failures: [
        {
          file: 'tests/unit/workflows/rules/DailyBoundaryRule.test.ts',
          title: 'DailyBoundaryRule > should stop timer on boundary overflow',
          message: 'AssertionError: expected true to deeply equal false\n- Expected: false\n+ Received: true\n    at tests/unit/workflows/rules/DailyBoundaryRule.test.ts:42:15'
        },
        {
          file: 'src-tauri/tests/unit/engine_test.rs',
          title: 'test_given_active_timer_when_expired_then_stops',
          message: 'thread "test_given_active_timer_when_expired_then_stops" panicked at "assertion failed: `(left == right)`\n  left: `Active`,\n right: `Stopped`", src-tauri/tests/unit/engine_test.rs:88:9'
        }
      ]
    };
    frontendCov = {
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
    rustCov = { linesPct: 69.8 };
  } else {
    testResults = parseTestResults();
    frontendCov = parseFrontendCoverage();
    rustCov = parseRustCoverage();
  }

  const markdown = buildMarkdown(testResults, frontendCov, rustCov);

  console.log('\n--- GENERATED REPORT ---');
  console.log(markdown);
  console.log('------------------------\n');

  // Write to GitHub Step Summary
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryPath) {
    fs.appendFileSync(stepSummaryPath, markdown + '\n', 'utf8');
    console.log(`Appended summary report to $GITHUB_STEP_SUMMARY (${stepSummaryPath})`);
  }

  // Update PR comment if running in PR
  if (!isMock) {
    tryUpdatePRComment(markdown);
  }

  // Exit code: if there were failing tests, exit with 1
  if (testResults.failed > 0 && !isMock) {
    console.error(`Pipeline failure: ${testResults.failed} tests failed.`);
    process.exit(1);
  }
}

main();
