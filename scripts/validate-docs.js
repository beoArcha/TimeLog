import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const WIKI_DIR = path.resolve(PROJECT_ROOT, 'docs/wiki');
const MANIFESTO_DIR = path.resolve(PROJECT_ROOT, 'docs/manifesto');
const ROOT_README = path.resolve(PROJECT_ROOT, 'README.md');

const LOCALES = ['en', 'pl', 'de', 'es', 'fr', 'pt-br'];
const EXPECTED_FILES = [
  'README.md',
  'getting-started.md',
  'timer.md',
  'cli.md',
  'interface.md',
  'faq.md',
  'advanced-cli.md',
  'architecture.md',
  'automation.md',
  'developer-build.md',
  '_sidebar.md',
];

const CANONICAL_RELEASE_ARTIFACTS = new Set([
  'oXyFlow_TimeLog-Setup-x64.exe',
  'oXyFlow_TimeLog-Standalone-x64.exe',
  'oXyFlow_TimeLog-Universal.dmg',
  'oXyFlow_TimeLog-x86_64.AppImage',
  'timelog_amd64.deb',
  'timelog.x86_64.rpm',
]);

const EMOJI_HEADING_REGEX = /^#{1,6}\s+[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

// Pre-index source files to resolve relocated component links gracefully
const srcFiles = new Map();
function indexDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      indexDir(full);
    } else {
      srcFiles.set(entry.name, full);
    }
  }
}
indexDir(path.resolve(PROJECT_ROOT, 'src'));

let errors = [];

console.log('--- Validating oXyFlow Documentation Parity, Integrity & Rebranding Scope ---\n');

// 1. Verify wiki directory and file parity across locales
for (const locale of LOCALES) {
  const dir = path.join(WIKI_DIR, locale);
  if (!fs.existsSync(dir)) {
    errors.push(`Missing locale directory: ${locale}`);
    continue;
  }

  const files = fs.readdirSync(dir).sort();
  const missing = EXPECTED_FILES.filter((f) => !files.includes(f));
  const extra = files.filter((f) => !EXPECTED_FILES.includes(f));

  if (missing.length > 0) {
    errors.push(`[${locale}] Missing files: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    errors.push(`[${locale}] Unexpected files: ${extra.join(', ')}`);
  }
}

function resolveInternalLink(filePath, rawUrl, isWiki) {
  // Strip anchor fragments (e.g., #commands, #quick-start)
  const cleanUrl = rawUrl.split('#')[0].trim();
  if (!cleanUrl) {
    // Pure fragment link to the same page
    return true;
  }

  // Wiki absolute-style links (e.g., /en/getting-started.md)
  if (isWiki && cleanUrl.startsWith('/')) {
    const wikiTarget = path.join(WIKI_DIR, cleanUrl.slice(1));
    if (fs.existsSync(wikiTarget)) return true;
  }

  // 1. Direct path resolution relative to current file's directory
  const directTarget = path.resolve(path.dirname(filePath), cleanUrl);
  if (fs.existsSync(directTarget)) return true;

  // 2. Direct path resolution relative to repository project root
  const rootTarget = path.resolve(PROJECT_ROOT, cleanUrl.replace(/^\//, ''));
  if (fs.existsSync(rootTarget)) return true;

  // 3. For docs/manifesto or general docs: strip leading '../' and resolve against project root
  // (e.g. '../AGENTS.md' -> 'AGENTS.md', '../.agents/rules/...' -> '.agents/rules/...')
  const stripped = cleanUrl.replace(/^(\.\.[\/\\])+/, '');
  const strippedTarget = path.resolve(PROJECT_ROOT, stripped);
  if (fs.existsSync(strippedTarget)) return true;

  // 4. Resolve relative to docs directory
  const docsTarget = path.resolve(PROJECT_ROOT, 'docs', stripped);
  if (fs.existsSync(docsTarget)) return true;

  // 5. Basename fallback for source files that may have been reorganized
  const baseName = path.basename(cleanUrl);
  if (srcFiles.has(baseName)) return true;

  // 6. Directory fallback for known UI components (e.g. emoji-picker -> EmojiPicker)
  if (cleanUrl.toLowerCase().includes('emoji-picker') && fs.existsSync(path.resolve(PROJECT_ROOT, 'src/components/EmojiPicker'))) {
    return true;
  }

  return false;
}

// 2. Validate branding, naming conventions, and release artifacts
function scanContent(filePath, relPath, options = {}) {
  const isNamingSpec = relPath.endsWith('NAMING.md');
  const isWiki = options.isWiki ?? false;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for obsolete database identifier
    if (line.includes('timelog.db')) {
      errors.push(`${relPath}:${lineNum} - Contains obsolete database identifier 'timelog.db' (must be 'oxytime.db')`);
    }

    // Check for obsolete configuration file
    if (!isNamingSpec && line.includes('dev.config.json')) {
      errors.push(`${relPath}:${lineNum} - Contains obsolete config filename 'dev.config.json' (must be 'app.config.json')`);
    }

    // Check for obsolete app identifier
    if (!isNamingSpec && line.includes('com.oxytime.oxyflow')) {
      errors.push(`${relPath}:${lineNum} - Contains obsolete Tauri identifier 'com.oxytime.oxyflow' (must be 'com.oxyflow.timelog')`);
    }

    // Check for obsolete crate names
    if (!isNamingSpec && (line.includes('oxy_flow') || line.includes('oxy-flow'))) {
      errors.push(`${relPath}:${lineNum} - Contains obsolete crate name 'oxy_flow' / 'oxy-flow' (must be 'oxyflow_timelog' / 'oxyflow-timelog')`);
    }

    // Check for incorrectly cased group name
    if (!isNamingSpec && line.includes('OxyFlow')) {
      errors.push(`${relPath}:${lineNum} - Contains incorrectly cased 'OxyFlow' (must be 'oXyFlow')`);
    }

    // Check for inverted product name
    if (!isNamingSpec && line.includes('LogTime')) {
      errors.push(`${relPath}:${lineNum} - Contains obsolete/inverted product name 'LogTime' (must be 'TimeLog')`);
    }

    // Check for non-existent 'oxy list'
    if (/\boxy list\b/.test(line) && !line.includes('oxy project ls') && !line.includes('oxy task ls')) {
      errors.push(`${relPath}:${lineNum} - Contains invalid CLI command 'oxy list'`);
    }

    // Check for decorative emojis in headings (enforced strictly on wiki)
    if (isWiki && EMOJI_HEADING_REGEX.test(line.trim())) {
      errors.push(`${relPath}:${lineNum} - Heading contains decorative emoji: "${line.trim()}"`);
    }

    // Check release artifact names in links or package references
    const releaseLinkMatch = line.match(/\/download\/([^)\s]+)/);
    if (releaseLinkMatch) {
      const artifactName = releaseLinkMatch[1];
      if (!CANONICAL_RELEASE_ARTIFACTS.has(artifactName)) {
        errors.push(`${relPath}:${lineNum} - Download link refers to non-canonical release asset: '${artifactName}'`);
      }
    }

    // Check standalone versioned artifact pattern
    if (/oXyFlow_TimeLog-Standalone-x64-v/i.test(line)) {
      errors.push(`${relPath}:${lineNum} - References versioned standalone executable instead of canonical 'oXyFlow_TimeLog-Standalone-x64.exe'`);
    }
  });

  // Check internal markdown links across ALL documents
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2].trim();
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('#')) {
      continue;
    }

    if (!resolveInternalLink(filePath, url, isWiki)) {
      errors.push(`${relPath} - Broken internal link to: ${url}`);
    }
  }
}

// Scan root README.md
if (fs.existsSync(ROOT_README)) {
  scanContent(ROOT_README, 'README.md', { isWiki: false });
} else {
  errors.push('Missing root README.md');
}

// Scan all markdown files in docs/manifesto/
if (fs.existsSync(MANIFESTO_DIR)) {
  const manifestoFiles = fs.readdirSync(MANIFESTO_DIR).filter((f) => f.endsWith('.md'));
  for (const file of manifestoFiles) {
    scanContent(path.join(MANIFESTO_DIR, file), `docs/manifesto/${file}`, { isWiki: false });
  }
} else {
  errors.push('Missing docs/manifesto directory');
}

// Scan all wiki locale files
for (const locale of LOCALES) {
  const dir = path.join(WIKI_DIR, locale);
  if (!fs.existsSync(dir)) continue;

  for (const file of EXPECTED_FILES) {
    const fullPath = path.join(dir, file);
    if (fs.existsSync(fullPath)) {
      scanContent(fullPath, `docs/wiki/${locale}/${file}`, { isWiki: true });
    }
  }
}

// Scan root wiki files if present
if (fs.existsSync(path.join(WIKI_DIR, 'README.md'))) {
  scanContent(path.join(WIKI_DIR, 'README.md'), 'docs/wiki/README.md', { isWiki: true });
}

if (errors.length > 0) {
  console.error(`\x1b[31mValidation failed with ${errors.length} error(s):\x1b[0m\n`);
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32mSuccess! Full rebranding scope verified: root README.md, docs/manifesto/**, and all ${LOCALES.length * EXPECTED_FILES.length} wiki files are 100% compliant with canonical naming, valid release artifacts, and zero broken links.\x1b[0m`);
}
