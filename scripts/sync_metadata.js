import fs from 'node:fs';
import path from 'node:path';

const UTF8 = 'utf-8';
const rootDir = path.resolve(import.meta.dirname, '..');
const metadataPath = path.join(rootDir, 'metadata.json');

if (!fs.existsSync(metadataPath)) {
  console.error(`Metadata file not found: ${metadataPath}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const isCheck = args.includes('--check');

const metadata = JSON.parse(fs.readFileSync(metadataPath, UTF8));
const { shortName, longName, author, description, license, version, versions } = metadata;

let hasDiff = false;

function syncJsonFile(filePath, updater) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, UTF8);
  const data = JSON.parse(original);
  updater(data);
  const updated = JSON.stringify(data, null, 2) + '\n';
  if (original !== updated) {
    hasDiff = true;
    if (!isCheck) {
      fs.writeFileSync(filePath, updated);
      console.log(`[SYNC] Updated ${path.relative(rootDir, filePath)}`);
    } else {
      console.error(`[OUT OF SYNC] ${path.relative(rootDir, filePath)}`);
    }
  }
}

function syncTextFile(filePath, updater) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, UTF8);
  const updated = updater(original);
  if (original !== updated) {
    hasDiff = true;
    if (!isCheck) {
      fs.writeFileSync(filePath, updated);
      console.log(`[SYNC] Updated ${path.relative(rootDir, filePath)}`);
    } else {
      console.error(`[OUT OF SYNC] ${path.relative(rootDir, filePath)}`);
    }
  }
}

// 1. Sync package.json
syncJsonFile(path.join(rootDir, 'package.json'), (pkg) => {
  pkg.name = shortName.toLowerCase();
  pkg.version = version;
  pkg.author = author;
  pkg.description = description;
  pkg.license = license;
});

// 2. Sync src-tauri/tauri.conf.json
syncJsonFile(path.join(rootDir, 'src-tauri/tauri.conf.json'), (tauri) => {
  tauri.productName = shortName;
  tauri.version = version;
  if (tauri.app?.windows?.[0]) {
    tauri.app.windows[0].title = longName;
  }
});

// 3. Sync src-tauri/Cargo.toml
syncTextFile(path.join(rootDir, 'src-tauri/Cargo.toml'), (cargo) => {
  let res = cargo.replace(/^version = ".*"/m, `version = "${version}"`);
  res = res.replace(/^description = ".*"/m, `description = "${longName} — ${description}"`);
  if (!res.includes('authors =')) {
    res = res.replace(/^license = /m, `authors = ["${author}"]\nlicense = `);
  } else {
    res = res.replace(/^authors = .*/m, `authors = ["${author}"]`);
  }
  return res;
});

// 4. Sync src/versions.json
syncJsonFile(path.join(rootDir, 'src/versions.json'), (v) => {
  v.major = versions.major;
  v.minor = versions.minor;
  v.release = versions.release;
  if (versions.subversions) {
    v.subversions = { ...versions.subversions };
  }
});

// 5. Sync src-tauri/src/common/constants.rs
syncTextFile(path.join(rootDir, 'src-tauri/src/common/constants.rs'), (constants) => {
  return constants.replace(
    /pub const APP_NAME: &str = ".*";/,
    `pub const APP_NAME: &str = "${longName}";`
  );
});

if (isCheck) {
  if (hasDiff) {
    console.error('\nMetadata check failed. Run "bun run metadata:sync" to synchronize files.');
    process.exit(1);
  } else {
    console.log('[OK] All project files are in sync with metadata.json.');
  }
} else {
  console.log(`[OK] Synchronized metadata: Short='${shortName}', Long='${longName}', Version='${version}', Author='${author}'`);
}
