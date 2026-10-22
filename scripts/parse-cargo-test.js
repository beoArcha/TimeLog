#!/usr/bin/env bun
import fs from 'node:fs';
import { detectTextEncoding, ensureDirExists } from './ci/fs-utils.js';
import { parseCargoTestOutput } from './ci/parsers/cargo-log-parser.js';

/**
 * Parses command-line arguments supporting both labeled flags and positional parameters.
 * Positional fallback accommodates GitHub Actions workflows passing files directly as arguments.
 *
 * @param {string[]} args CLI arguments array without node/bun binaries.
 * @returns {{ logPath: string | null, outPath: string | null, suiteName: string }}
 */
function parseCliArgs(args) {
  let logPath = null;
  let outPath = null;
  let suiteName = 'src-tauri/tests';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--log' && args[i + 1]) logPath = args[++i];
    else if (args[i] === '--out' && args[i + 1]) outPath = args[++i];
    else if (args[i] === '--suite' && args[i + 1]) suiteName = args[++i];
  }

  if (!logPath && !outPath && args.length >= 2) {
    logPath = args[0];
    outPath = args[1];
    if (args[2]) suiteName = args[2];
  }

  return { logPath, outPath, suiteName };
}

function main() {
  const { logPath, outPath, suiteName } = parseCliArgs(process.argv.slice(2));

  if (!logPath || !outPath) {
    console.error('Usage: bun scripts/parse-cargo-test.js --log <log-file> --out <output-json> [--suite <name>]');
    process.exit(1);
  }

  if (!fs.existsSync(logPath)) {
    console.error(`Log file not found: ${logPath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(logPath);
  const encoding = detectTextEncoding(buffer);
  const content = buffer.toString(encoding);

  const payload = parseCargoTestOutput(content, suiteName);

  ensureDirExists(outPath);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(
    `Parsed Cargo test results: ${payload.numPassedTests} passed, ` +
    `${payload.numFailedTests} failed, ${payload.numPendingTests} ignored ` +
    `(${payload.durationSeconds}s) -> ${outPath}`
  );
}

main();
