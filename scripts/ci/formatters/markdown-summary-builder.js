import { COVERAGE_THRESHOLDS, SUMMARY_MARKER } from '../constants.js';

/**
 * Formats a percentage number with appropriate status color emoji.
 *
 * @param {number | null | undefined} pct
 * @returns {string} Formatted markdown percentage or em-dash.
 */
export function formatPct(pct) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) {
    return '—';
  }
  const num = Number(pct).toFixed(1);
  if (num >= COVERAGE_THRESHOLDS.pass) return `🟢 \`${num}%\``;
  if (num >= COVERAGE_THRESHOLDS.warn) return `🟡 \`${num}%\``;
  return `🔴 \`${num}%\``;
}

/**
 * Returns a PASS/WARN/FAIL status badge based on percentage thresholds.
 *
 * @param {number | null | undefined} pct
 * @returns {string} Badge with status emoji.
 */
export function getStatusBadge(pct) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) {
    return '⚪ UNKNOWN';
  }
  const num = Number(pct);
  if (num >= COVERAGE_THRESHOLDS.pass) return '🟢 PASS';
  if (num >= COVERAGE_THRESHOLDS.warn) return '🟡 WARN';
  return '🔴 FAIL';
}

/**
 * Builds the test results and code coverage Markdown report.
 *
 * @param {import('../types.js').TestExecutionSummary} testResults Test summary data.
 * @param {import('../types.js').LayerCoverageReport | null} frontendCov Frontend coverage data.
 * @param {import('../types.js').LayerCoverageReport | null} rustCov Rust coverage data.
 * @param {Date} [timestamp=new Date()] Report generation timestamp.
 * @returns {string} Complete markdown report.
 */
export function buildMarkdownSummary(testResults, frontendCov, rustCov, timestamp = new Date()) {
  const parts = [];

  parts.push(SUMMARY_MARKER);
  parts.push('## 🧪 Test & Code Coverage Summary');
  parts.push('');

  const durationSec = (testResults.durationMs / 1000).toFixed(2);
  const statusIcon = testResults.failed > 0 ? '❌ FAILED' : '✅ PASSED';

  parts.push('### 📋 Test Execution');
  parts.push('| Status | Passed | Failed | Skipped | Total Tests | Duration |');
  parts.push('| :---: | :---: | :---: | :---: | :---: | :---: |');
  parts.push(
    `| **${statusIcon}** | \`${testResults.passed}\` ✅ | ` +
    `\`${testResults.failed}\` ${testResults.failed > 0 ? '❌' : ''} | ` +
    `\`${testResults.skipped}\` ⚠️ | \`${testResults.total}\` | \`${durationSec}s\` ⏱️ |`
  );
  parts.push('');

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

  parts.push('### 📊 Code Coverage Metrics');

  if (!frontendCov && !rustCov) {
    parts.push('*No coverage reports detected in current artifacts.*');
  } else {
    parts.push('| Layer / Module | Lines | Statements | Branches | Functions | Status |');
    parts.push('| :--- | :---: | :---: | :---: | :---: | :---: |');

    if (frontendCov && frontendCov.total) {
      const l = frontendCov.total.lines?.pct;
      const s = frontendCov.total.statements?.pct;
      const b = frontendCov.total.branches?.pct;
      const f = frontendCov.total.functions?.pct;
      parts.push(
        `| **Frontend** | ${formatPct(l)} | ${formatPct(s)} | ` +
        `${formatPct(b)} | ${formatPct(f)} | ${getStatusBadge(l)} |`
      );

      for (const sub of frontendCov.breakdown) {
        parts.push(
          `| &nbsp;&nbsp;↳ \`${sub.name}\` | ${formatPct(sub.lines)} | ${formatPct(sub.statements)} | ` +
          `${formatPct(sub.branches)} | ${formatPct(sub.functions)} | ${getStatusBadge(sub.lines)} |`
        );
      }
    }

    if (rustCov) {
      const rl = rustCov.linesPct;
      parts.push(
        `| **Backend Engine** | ${formatPct(rl)} | ${formatPct(rl)} | — | — | ${getStatusBadge(rl)} |`
      );

      if (rustCov.breakdown && rustCov.breakdown.length > 0) {
        for (const sub of rustCov.breakdown) {
          parts.push(
            `| &nbsp;&nbsp;↳ \`${sub.name}\` | ${formatPct(sub.lines)} | ${formatPct(sub.lines)} | — | — | ${getStatusBadge(sub.lines)} |`
          );
        }
      }
    }

    if (frontendCov?.total?.lines?.pct !== undefined && rustCov?.linesPct !== undefined) {
      const avgLines = (frontendCov.total.lines.pct + rustCov.linesPct) / 2;
      parts.push(`| **Overall Combined Project** | ${formatPct(avgLines)} | — | — | — | ${getStatusBadge(avgLines)} |`);
    }
  }

  parts.push('');
  parts.push(`*Generated at ${timestamp.toISOString()} by oXyFlow CI Pipeline.*`);

  return parts.join('\n');
}
