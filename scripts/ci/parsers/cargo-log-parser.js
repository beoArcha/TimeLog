/**
 * Parser for Cargo test standard output logs.
 * Converts unstructured terminal text into a structured test result format
 * compatible with standard CI runners and Jest/Vitest report consumers.
 */

/**
 * @typedef {Object} CargoFailureAssertion
 * @property {'failed'} status Assertion status.
 * @property {string} title Failed test function or scenario identifier.
 * @property {string[]} failureMessages Detailed stdout/panic messages.
 */

/**
 * @typedef {Object} ParsedCargoTestOutput
 * @property {number} numTotalTests
 * @property {number} numPassedTests
 * @property {number} numFailedTests
 * @property {number} numPendingTests
 * @property {number} numTodoTests
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} durationSeconds
 * @property {Array<{ name: string, startTime: number, endTime: number, assertionResults: CargoFailureAssertion[] }>} testResults
 */

const SUMMARY_REGEX = /test result:\s*(ok|FAILED)\.\s*(\d+)\s*passed;\s*(\d+)\s*failed;\s*(\d+)\s*ignored(?:;\s*\d+\s*measured)?(?:;\s*\d+\s*filtered out)?;\s*finished in\s*([\d.]+)s/i;
const FAILURE_BLOCK_REGEX = /---- ([^\s]+) stdout ----\r?\n([\s\S]*?)(?=\r?\n----|\r?\nfailures:|\r?\ntest result:)/g;

/**
 * Extracts failed assertions from the failures block in Cargo stdout.
 *
 * @param {string} content Raw stdout text.
 * @returns {CargoFailureAssertion[]} Array of extracted failures.
 */
function extractFailures(content) {
  const failures = [];
  const regex = new RegExp(FAILURE_BLOCK_REGEX.source, FAILURE_BLOCK_REGEX.flags);
  let match;

  // Cargo prints each failure between "---- <name> stdout ----" and either the next test block or summary.
  while ((match = regex.exec(content)) !== null) {
    failures.push({
      status: 'failed',
      title: match[1].trim(),
      failureMessages: [match[2].trim()]
    });
  }

  return failures;
}

/**
 * Parses cargo test console output into a structured report.
 *
 * @param {string} content Console log text from cargo test.
 * @param {string} [suiteName='src-tauri/tests'] Logical name of the test suite.
 * @returns {ParsedCargoTestOutput} Structured test summary.
 */
export function parseCargoTestOutput(content, suiteName = 'src-tauri/tests') {
  const summaryMatch = content.match(SUMMARY_REGEX);

  let passed = 0;
  let failed = 0;
  let ignored = 0;
  let durationSeconds = 0;

  if (summaryMatch) {
    passed = parseInt(summaryMatch[2], 10);
    failed = parseInt(summaryMatch[3], 10);
    ignored = parseInt(summaryMatch[4], 10);
    durationSeconds = parseFloat(summaryMatch[5]);
  } else {
    // Cargo runs killed mid-execution omit the summary line; fallback counts completed tests.
    const passMatches = content.match(/\.\.\. ok/g);
    const failMatches = content.match(/\.\.\. FAILED/g);
    passed = passMatches ? passMatches.length : 0;
    failed = failMatches ? failMatches.length : 0;
  }

  const total = passed + failed + ignored;
  const durationMs = Math.round(durationSeconds * 1000);
  const now = Date.now();
  const failures = failed > 0 ? extractFailures(content) : [];

  return {
    numTotalTests: total,
    numPassedTests: passed,
    numFailedTests: failed,
    numPendingTests: ignored,
    numTodoTests: 0,
    startTime: now - durationMs,
    endTime: now,
    durationSeconds,
    testResults: [
      {
        name: suiteName,
        startTime: now - durationMs,
        endTime: now,
        assertionResults: failures
      }
    ]
  };
}
