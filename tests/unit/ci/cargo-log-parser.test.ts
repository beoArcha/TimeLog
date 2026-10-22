import { describe, expect, it } from 'vitest';
import { parseCargoTestOutput } from '../../../scripts/ci/parsers/cargo-log-parser.js';

describe('cargo-log-parser', () => {
  it('should parse standard cargo test output with passed and ignored counts', () => {
    // Arrange
    const sampleOutput = `
running 15 tests
test tests::test_one ... ok
test tests::test_two ... ok
test tests::test_ignored ... ignored

test result: ok. 14 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0.45s
`;

    // Act
    const report = parseCargoTestOutput(sampleOutput, 'src-tauri/unit');

    // Assert
    expect(report.numTotalTests).toBe(15);
    expect(report.numPassedTests).toBe(14);
    expect(report.numFailedTests).toBe(0);
    expect(report.numPendingTests).toBe(1);
    expect(report.durationSeconds).toBe(0.45);
    expect(report.testResults[0].name).toBe('src-tauri/unit');
    expect(report.testResults[0].assertionResults).toHaveLength(0);
  });

  it('should parse failures and extract failure messages from stdout block', () => {
    // Arrange
    const sampleOutputWithFailure = `
running 2 tests
test tests::test_pass ... ok
test tests::test_fail ... FAILED

failures:

---- tests::test_fail stdout ----
thread 'tests::test_fail' panicked at 'assertion failed: left == right', src/test.rs:12:9
note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace

failures:
    tests::test_fail

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s
`;

    // Act
    const report = parseCargoTestOutput(sampleOutputWithFailure, 'src-tauri/unit');

    // Assert
    expect(report.numTotalTests).toBe(2);
    expect(report.numPassedTests).toBe(1);
    expect(report.numFailedTests).toBe(1);
    expect(report.testResults[0].assertionResults).toHaveLength(1);
    expect(report.testResults[0].assertionResults[0].title).toBe('tests::test_fail');
    expect(report.testResults[0].assertionResults[0].failureMessages[0]).toContain(
      "thread 'tests::test_fail' panicked at 'assertion failed: left == right'"
    );
  });

  it('should fallback to regex counting when cargo summary line is interrupted', () => {
    // Arrange
    const interruptedOutput = `
running 3 tests
test tests::test_alpha ... ok
test tests::test_beta ... ok
test tests::test_gamma ... FAILED
`;

    // Act
    const report = parseCargoTestOutput(interruptedOutput, 'src-tauri/interrupted');

    // Assert
    expect(report.numPassedTests).toBe(2);
    expect(report.numFailedTests).toBe(1);
    expect(report.numTotalTests).toBe(3);
  });
});
