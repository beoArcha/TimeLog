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

let updated = false;

if (anyEngine) { v.subversions.engine++; updated = true; }
if (anyComponent) { v.subversions.components++; updated = true; }
if (anyTranslations) { v.subversions.translations++; updated = true; }
if (anyFront) { v.subversions.front++; updated = true; }

if (changedFiles.length > 0 && !updated) {
  v.release++;
} else if (updated) {
  v.release++;
}

fs.writeFileSync(versionsFile, JSON.stringify(v, null, 2) + '\n');

if (fs.existsSync(packageJsonFile)) {
  let pkg = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
  pkg.version = `${v.major}.${v.minor}.${v.release}`;
  fs.writeFileSync(packageJsonFile, JSON.stringify(pkg, null, 2) + '\n');
}

console.log(`Updated versions: Main ${v.major}.${v.minor}.${v.release}`);
console.log(`Subversions - Engine: ${v.subversions.engine}, Components: ${v.subversions.components}, Translations: ${v.subversions.translations}, Front: ${v.subversions.front}`);
