import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA Asset Paths Verification', () => {
  const distIndexPath = path.resolve(__dirname, '../../../dist/index.html');

  it('should reference assets and manifest under /TimeLog/app/ path', () => {
    expect(fs.existsSync(distIndexPath), 'dist/index.html must exist before checking asset paths').toBe(true);

    const htmlContent = fs.readFileSync(distIndexPath, 'utf-8');

    // 1. Script tag should point to /TimeLog/app/assets/
    expect(htmlContent).toMatch(/<script[^>]+src="\/TimeLog\/app\/assets\/index-[^"]+\.js"/);

    // 2. CSS stylesheet link should point to /TimeLog/app/assets/
    expect(htmlContent).toMatch(/<link[^>]+href="\/TimeLog\/app\/assets\/index-[^"]+\.css"/);

    // 3. Manifest link should point to /TimeLog/app/manifest.webmanifest
    expect(htmlContent).toContain('href="/TimeLog/app/manifest.webmanifest"');

    // 4. Service worker registration script should reference /TimeLog/app/registerSW.js
    expect(htmlContent).toContain('src="/TimeLog/app/registerSW.js"');

    // 5. Icons must also be referenced under /TimeLog/app/
    expect(htmlContent).toContain('href="/TimeLog/app/favicon.ico"');
    expect(htmlContent).toContain('href="/TimeLog/app/icons/icon-192.png"');
  });
});
