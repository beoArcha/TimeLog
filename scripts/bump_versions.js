import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

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

let v = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));

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

if (anyEngine) { v.subversions.engine++; }
if (anyComponent) { v.subversions.components++; }
if (anyTranslations) { v.subversions.translations++; }
if (anyFront) { v.subversions.front++; }

const args = process.argv.slice(2);
const toOddMinor = args.includes('--to-odd-minor');
const toEvenMinor = args.includes('--to-even-minor');

if (toOddMinor) {
  v.minor = v.minor % 2 === 0 ? v.minor + 1 : v.minor + 2;
  v.release = 0;
} else if (toEvenMinor) {
  v.minor = v.minor % 2 !== 0 ? v.minor + 1 : v.minor + 2;
  v.release = 0;
} else {
  v.release++;
}

fs.writeFileSync(versionsFile, JSON.stringify(v, null, 2) + '\n');

const newVersionStr = `${v.major}.${v.minor}.${v.release}`;

if (fs.existsSync(packageJsonFile)) {
  let pkg = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
  pkg.version = newVersionStr;
  fs.writeFileSync(packageJsonFile, JSON.stringify(pkg, null, 2) + '\n');
}

const tauriConfFile = path.resolve('src-tauri/tauri.conf.json');
if (fs.existsSync(tauriConfFile)) {
  let tauriConf = JSON.parse(fs.readFileSync(tauriConfFile, 'utf8'));
  tauriConf.version = newVersionStr;
  fs.writeFileSync(tauriConfFile, JSON.stringify(tauriConf, null, 2) + '\n');
}

const cargoTomlFile = path.resolve('src-tauri/Cargo.toml');
if (fs.existsSync(cargoTomlFile)) {
  let cargoToml = fs.readFileSync(cargoTomlFile, 'utf8');
  cargoToml = cargoToml.replace(/^version = ".*"/m, `version = "${newVersionStr}"`);
  fs.writeFileSync(cargoTomlFile, cargoToml);
}

console.log(`Updated versions: Main ${newVersionStr}`);
console.log(`Subversions - Engine: ${v.subversions.engine}, Components: ${v.subversions.components}, Translations: ${v.subversions.translations}, Front: ${v.subversions.front}`);
