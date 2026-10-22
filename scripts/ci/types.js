/**
 * Type definitions for CI test and coverage reporting pipeline.
 * These JSDoc contracts provide type checking without requiring a compile step.
 */

/**
 * Represents an individual test failure assertion.
 * @typedef {Object} TestFailure
 * @property {string} file Relative path to the test file.
 * @property {string} title Test description or test function name.
 * @property {string} message Formatted failure stack trace or panic message.
 */

/**
 * Standardized test execution summary across all test suites.
 * @typedef {Object} TestExecutionSummary
 * @property {number} total Total test count executed or scheduled.
 * @property {number} passed Total tests passing.
 * @property {number} failed Total tests failing.
 * @property {number} skipped Total tests skipped or ignored.
 * @property {number} durationMs Test execution duration in milliseconds.
 * @property {TestFailure[]} failures Detailed list of failed assertions.
 */

/**
 * Single dimension coverage metric.
 * @typedef {Object} CoverageMetric
 * @property {number} pct Percentage covered (0 - 100).
 * @property {number} [total] Total measurable units (lines, branches, etc.).
 * @property {number} [covered] Total covered units.
 */

/**
 * Aggregate 4-dimension coverage metrics container.
 * @typedef {Object} CoverageSummary
 * @property {CoverageMetric} [lines]
 * @property {CoverageMetric} [statements]
 * @property {CoverageMetric} [branches]
 * @property {CoverageMetric} [functions]
 */

/**
 * Breakdown of coverage for a specific subsystem or directory module.
 * @typedef {Object} ModuleCoverageBreakdown
 * @property {string} name Display label or directory prefix.
 * @property {number} lines Line coverage percentage.
 * @property {number} [statements] Statement coverage percentage.
 * @property {number} [branches] Branch coverage percentage.
 * @property {number} [functions] Function coverage percentage.
 * @property {number} [covered] Total covered units if available.
 * @property {number} [total] Total coverable units if available.
 */

/**
 * Complete layer coverage report (e.g. Frontend or Backend).
 * @typedef {Object} LayerCoverageReport
 * @property {CoverageSummary} [total] Overall 4-dimension metrics.
 * @property {number} [linesPct] Aggregate line percentage when 4-dim summary is unavailable.
 * @property {number} [covered] Aggregate covered units.
 * @property {number} [coverable] Aggregate coverable units.
 * @property {ModuleCoverageBreakdown[]} breakdown Subdirectory breakdown metrics.
 */

export {};
