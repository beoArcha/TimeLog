#!/usr/bin/env bun
import fs from 'fs';
import path from 'path';

// Parse CLI flags (--log <file>, --out <file>, --suite <name>) or positional arguments
const args = process.argv.slice(2);
let logPath = null;
let outPath = null;
let suiteName = 'src-tauri/tests';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--log' && args[i + 1]) logPath = args[++i];
  else if (args[i] === '--out' && args[i + 1]) outPath = args[++i];
  else if (args[i] === '--suite' && args[i + 1]) suiteName = args[++i];
}

// Fallback to positional arguments if flags were not provided
if (!logPath && !outPath && args.length >= 2) {
  logPath = args[0];
  outPath = args[1];
  if (args[2]) suiteName = args[2];
}

if (!logPath || !outPath) {
  console.error('Usage: bun scripts/parse-cargo-test.js --log <log-file> --out <output-json> [--suite <name>]');
  process.exit(1);
}

if (!fs.existsSync(logPath)) {
  console.error(`Log file not found: ${logPath}`);
  process.exit(1);
}

// Detect encoding: PowerShell on Windows redirects with UTF-16LE by default
const buffer = fs.readFileSync(logPath);
let content = '';
if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
  content = buffer.toString('utf16le');
} else {
  let zeroCount = 0;
  const sampleLen = Math.min(buffer.length, 100);
  for (let i = 0; i < sampleLen; i++) {
    if (buffer[i] === 0) zeroCount++;
  }
  content = zeroCount > 10 ? buffer.toString('utf16le') : buffer.toString('utf8');
}

// Match standard Cargo test summary line:
// test result: ok. 186 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.42s
const summaryRegex = /test result:\s*(ok|FAILED)\.\s*(\d+)\s*passed;\s*(\d+)\s*failed;\s*(\d+)\s*ignored(?:;\s*\d+\s*measured)?;\s*\d+\s*filtered out;\s*finished in\s*([\d\.]+)s/i;
const match = content.match(summaryRegex);

let passed = 0;
let failed = 0;
let ignored = 0;
let durationSeconds = 0;

if (match) {
  passed = parseInt(match[2], 10);
  failed = parseInt(match[3], 10);
  ignored = parseInt(match[4], 10);
  durationSeconds = parseFloat(match[5]);
} else {
  // Fallback: search for individual test lines if summary line was interrupted
  const passMatches = content.match(/\.\.\. ok/g);
  const failMatches = content.match(/\.\.\. FAILED/g);
  passed = passMatches ? passMatches.length : 0;
  failed = failMatches ? failMatches.length : 0;
}

const total = passed + failed + ignored;
const durationMs = Math.round(durationSeconds * 1000);
const now = Date.now();

// Extract failure messages from Cargo stdout block between "failures:" sections
const failures = [];
if (failed > 0) {
  const failureDetailRegex = /---- ([^\s]+) stdout ----\r?\n([\s\S]*?)(?=\r?\n----|\r?\nfailures:|\r?\ntest result:)/g;
  let failMatch;
  while ((failMatch = failureDetailRegex.exec(content)) !== null) {
    failures.push({
      status: 'failed',
      title: failMatch[1].trim(),
      failureMessages: [failMatch[2].trim()]
    });
  }
}

const payload = {
  numTotalTests: total,
  numPassedTests: passed,
  numFailedTests: failed,
  numPendingTests: ignored,
  numTodoTests: 0,
  startTime: now - durationMs,
  endTime: now,
  testResults: [
    {
      name: suiteName,
      startTime: now - durationMs,
      endTime: now,
      assertionResults: failures
    }
  ]
};

const outDir = path.dirname(path.resolve(outPath));
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Parsed Cargo test results: ${passed} passed, ${failed} failed, ${ignored} ignored (${durationSeconds}s) -> ${outPath}`);
