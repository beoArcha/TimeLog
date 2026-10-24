import { COVERAGE_THRESHOLDS } from '../constants.js';

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
  if (Number(num) >= COVERAGE_THRESHOLDS.pass) {
    return `🟢 \`${num}%\``;
  }
  if (Number(num) >= COVERAGE_THRESHOLDS.warn) {
    return `🟡 \`${num}%\``;
  }
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
  if (num >= COVERAGE_THRESHOLDS.pass) {
    return '🟢 PASS';
  }
  if (num >= COVERAGE_THRESHOLDS.warn) {
    return '🟡 WARN';
  }
  return '🔴 FAIL';
}

/**
 * Returns an execution status badge based on failed and total test counts.
 *
 * @param {number} failed Number of failed tests.
 * @param {number} total Total number of tests.
 * @returns {string} Execution badge.
 */
export function getExecutionStatusBadge(failed, total) {
  if (total === 0) {
    return '⚪ NO TESTS';
  }
  if (failed > 0) {
    return '❌ FAILED';
  }
  return '✅ PASSED';
}
