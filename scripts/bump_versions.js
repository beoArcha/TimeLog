import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const MAIN = '--main';
const RELEASE = '--release';
const TEST = '--test';
const UTF8 = 'utf8';

function calculateNextVersion(v, flag) {
  let nextMinor = v.minor;
  let nextRelease = v.release;

  if (flag === MAIN) {
    if (nextMinor % 2 !== 0) {
      nextMinor++;
    }
    nextRelease++;
  } else if (flag === RELEASE) {
    if (nextMinor % 2 === 0) {
      nextMinor++;
    } else {
      nextRelease++;
    }
  }

  return {
    major: v.major,
    minor: nextMinor,
    release: nextRelease,
    subversions: v.subversions ? { ...v.subversions } : { engine: 0, components: 0, translations: 0, front: 0 }
  };
}

function runTests() {
  console.log("Running unit tests...");
  let vMain = { major: 1, minor: 2, release: 11 };

  let res1 = calculateNextVersion(vMain, MAIN);
  console.assert(res1.minor === 2, "Test 1 Failed: Minor should remain 2");
  console.assert(res1.release === 12, "Test 1 Failed: Release should be 12");

  let vErr = { major: 1, minor: 3, release: 5 };
  let res2 = calculateNextVersion(vErr, MAIN);
  console.assert(res2.minor === 4, "Test 2 Failed: Minor should become 4");
  console.assert(res2.release === 6, "Test 2 Failed: Release should be 6");

  let res3 = calculateNextVersion(vMain, RELEASE);
  console.assert(res3.minor === 3, "Test 3 Failed: Minor should become 3");
  console.assert(res3.release === 11, "Test 3 Failed: Release should stay 11");

  let res4 = calculateNextVersion(res3, RELEASE);
  console.assert(res4.minor === 3, "Test 4 Failed: Minor should stay 3");
  console.assert(res4.release === 12, "Test 4 Failed: Release should be 12");

  console.log("All tests passed!");
}

const args = process.argv.slice(2);
const isTest = args.includes(TEST);

if (isTest) {
  runTests();
  process.exit(0);
}

const flag = args.includes(MAIN) ? MAIN : args.includes(RELEASE) ? RELEASE : null;

if (!flag) {
  console.error(`Please provide ${MAIN} or ${RELEASE} flag`);
  process.exit(1);
}

const versionsFile = path.resolve('src/versions.json');
const packageJsonFile = path.resolve('package.json');

if (!fs.existsSync(versionsFile)) {
  fs.writeFileSync(versionsFile, JSON.stringify({
    major: 1,
    minor: 0,
    release: 0,
    subversions: {
      engine: 0,
      components: 0,
      translations: 0,
      front: 0
    }
  }, null, 2));
}

let v = JSON.parse(fs.readFileSync(versionsFile, UTF8));

let changedFiles = [];
try {
  changedFiles = execSync('git diff HEAD~1 HEAD --name-only').toString().split('\n').filter(Boolean);
} catch (e) {
  console.log("Could not get git diff or first commit.");
}

let anyComponent = false;
let anyEngine = false;
let anyTranslations = false;
let anyFront = false;

changedFiles.forEach(file => {
  if (file.includes('src/components/')) {
    anyComponent = true;
  } else if (file.includes('src/rust-mock/') || file.includes('src-tauri/')) {
    anyEngine = true;
  } else if (file.includes('src/utils/i18n/') || file.includes('src/utils/translations.ts')) {
    anyTranslations = true;
  } else if (file.includes('src/')) {
    anyFront = true;
  }
});

if (v.subversions) {
  if (anyEngine) { v.subversions.engine++; }
  if (anyComponent) { v.subversions.components++; }
  if (anyTranslations) { v.subversions.translations++; }
  if (anyFront) { v.subversions.front++; }
}

v = calculateNextVersion(v, flag);

fs.writeFileSync(versionsFile, JSON.stringify(v, null, 2) + '\n');

const newVersionStr = `${v.major}.${v.minor}.${v.release}`;

if (fs.existsSync(packageJsonFile)) {
  let pkg = JSON.parse(fs.readFileSync(packageJsonFile, UTF8));
  pkg.version = newVersionStr;
  fs.writeFileSync(packageJsonFile, JSON.stringify(pkg, null, 2) + '\n');
}

const tauriConfFile = path.resolve('src-tauri/tauri.conf.json');
if (fs.existsSync(tauriConfFile)) {
  let tauriConf = JSON.parse(fs.readFileSync(tauriConfFile, UTF8));
  tauriConf.version = newVersionStr;
  fs.writeFileSync(tauriConfFile, JSON.stringify(tauriConf, null, 2) + '\n');
}

const cargoTomlFile = path.resolve('src-tauri/Cargo.toml');
if (fs.existsSync(cargoTomlFile)) {
  let cargoToml = fs.readFileSync(cargoTomlFile, UTF8);
  cargoToml = cargoToml.replace(/^version = ".*"/m, `version = "${newVersionStr}"`);
  fs.writeFileSync(cargoTomlFile, cargoToml);
}

console.log(`Updated versions: ${flag} ${newVersionStr}`);
if (v.subversions) {
  console.log(`Subversions - Engine: ${v.subversions.engine}, Components: ${v.subversions.components}, Translations: ${v.subversions.translations}, Front: ${v.subversions.front}`);
}
