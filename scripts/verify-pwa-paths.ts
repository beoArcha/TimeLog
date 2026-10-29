import fs from 'node:fs';
import path from 'node:path';

const distIndexPath = path.resolve(import.meta.dirname, '../dist/index.html');

console.log(`[verify-pwa-paths] Checking ${distIndexPath}...`);

if (!fs.existsSync(distIndexPath)) {
  console.error(`[verify-pwa-paths] ERROR: ${distIndexPath} does not exist. Run build first.`);
  process.exit(1);
}

const htmlContent = fs.readFileSync(distIndexPath, 'utf-8');

const checks: { description: string; test: () => boolean }[] = [
  {
    description: 'Script tag references /TimeLog/app/assets/index-*.js',
    test: () => /<script[^>]+src="\/TimeLog\/app\/assets\/index-[^"]+\.js"/.test(htmlContent),
  },
  {
    description: 'CSS link references /TimeLog/app/assets/index-*.css',
    test: () => /<link[^>]+href="\/TimeLog\/app\/assets\/index-[^"]+\.css"/.test(htmlContent),
  },
  {
    description: 'Manifest link references /TimeLog/app/manifest.webmanifest',
    test: () => htmlContent.includes('href="/TimeLog/app/manifest.webmanifest"'),
  },
  {
    description: 'Service worker registration references /TimeLog/app/registerSW.js',
    test: () => htmlContent.includes('src="/TimeLog/app/registerSW.js"'),
  },
  {
    description: 'Favicon references /TimeLog/app/favicon.ico',
    test: () => htmlContent.includes('href="/TimeLog/app/favicon.ico"'),
  },
  {
    description: 'Icon references /TimeLog/app/icons/icon-192.png',
    test: () => htmlContent.includes('href="/TimeLog/app/icons/icon-192.png"'),
  },
];

let failed = false;
for (const check of checks) {
  if (check.test()) {
    console.log(`  ✓ ${check.description}`);
  } else {
    console.error(`  ✗ FAILED: ${check.description}`);
    failed = true;
  }
}

if (failed) {
  console.error('[verify-pwa-paths] Verification failed.');
  process.exit(1);
}

console.log('[verify-pwa-paths] All PWA asset paths verified successfully.');
