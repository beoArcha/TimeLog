import fs from 'node:fs';
import path from 'node:path';

const WIKI_DIR = path.resolve(import.meta.dirname, '../docs/wiki');
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

const EMOJI_HEADING_REGEX = /^#{1,6}\s+[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

let errors = [];

console.log('--- Validating oXyFlow Documentation Parity & Integrity ---\n');

// 1. Verify directory parity
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

// 2. Scan content for forbidden strings and emojis in headings
function scanFile(filePath, relPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for obsolete database identifier
    if (line.includes('timelog.db')) {
      errors.push(`${relPath}:${lineNum} - Contains obsolete database identifier 'timelog.db' (should be 'oxytime.db')`);
    }

    // Check for non-existent 'oxy list'
    if (/\boxy list\b/.test(line) && !line.includes('oxy project ls') && !line.includes('oxy task ls')) {
      errors.push(`${relPath}:${lineNum} - Contains invalid CLI command 'oxy list'`);
    }

    // Check for decorative emojis in headings
    if (EMOJI_HEADING_REGEX.test(line.trim())) {
      errors.push(`${relPath}:${lineNum} - Heading contains decorative emoji: "${line.trim()}"`);
    }
  });

  // Check internal markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2].trim();
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('#')) {
      continue;
    }

    // Resolve relative or absolute wiki link
    let targetFile;
    if (url.startsWith('/')) {
      targetFile = path.join(WIKI_DIR, url.slice(1));
    } else {
      targetFile = path.resolve(path.dirname(filePath), url);
    }

    // Strip anchor if present
    const cleanTarget = targetFile.split('#')[0];
    if (cleanTarget && !fs.existsSync(cleanTarget)) {
      errors.push(`${relPath} - Broken internal link to: ${url}`);
    }
  }
}

for (const locale of LOCALES) {
  const dir = path.join(WIKI_DIR, locale);
  if (!fs.existsSync(dir)) continue;

  for (const file of EXPECTED_FILES) {
    const fullPath = path.join(dir, file);
    if (fs.existsSync(fullPath)) {
      scanFile(fullPath, `${locale}/${file}`);
    }
  }
}

// Also scan root README.md
if (fs.existsSync(path.join(WIKI_DIR, 'README.md'))) {
  scanFile(path.join(WIKI_DIR, 'README.md'), 'README.md');
}

if (errors.length > 0) {
  console.error(`\x1b[31mValidation failed with ${errors.length} error(s):\x1b[0m\n`);
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32mSuccess! All ${LOCALES.length * EXPECTED_FILES.length} documentation files are 100% in parity with zero broken links or invalid identifiers.\x1b[0m`);
}
