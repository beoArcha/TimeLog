import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolveInternalLink } from '../../../scripts/validate-docs.js';

describe('Documentation Link Validator (validate-docs.js)', () => {
  let tempRoot: string;
  let docsDir: string;
  let manifestoDir: string;
  let wikiDir: string;
  let wikiEnDir: string;
  let srcComponentsDir: string;
  let otherDir: string;

  let specMd: string;
  let guideMd: string;
  let targetParentMd: string;

  beforeAll(() => {
    // Create an isolated sandbox directory structure
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'timelog-doc-validator-test-'));
    docsDir = path.join(tempRoot, 'docs');
    manifestoDir = path.join(docsDir, 'manifesto');
    wikiDir = path.join(docsDir, 'wiki');
    wikiEnDir = path.join(wikiDir, 'en');
    srcComponentsDir = path.join(tempRoot, 'src', 'components');
    otherDir = path.join(tempRoot, 'other');

    fs.mkdirSync(manifestoDir, { recursive: true });
    fs.mkdirSync(wikiEnDir, { recursive: true });
    fs.mkdirSync(srcComponentsDir, { recursive: true });
    fs.mkdirSync(otherDir, { recursive: true });

    // Populate sandbox files
    specMd = path.join(manifestoDir, 'spec.md');
    fs.writeFileSync(specMd, '# Spec\n');

    guideMd = path.join(wikiEnDir, 'guide.md');
    fs.writeFileSync(guideMd, '# Guide\n');

    const sidebarMd = path.join(wikiDir, '_sidebar.md');
    fs.writeFileSync(sidebarMd, '* [Guide](/en/guide.md)\n');

    targetParentMd = path.join(tempRoot, 'target-parent.md');
    fs.writeFileSync(targetParentMd, '# Target Parent\n');

    // Duplicate basename 'button.tsx' in two distinct directories to test loose search elimination
    fs.writeFileSync(path.join(srcComponentsDir, 'button.tsx'), 'export const Button = () => null;\n');
    fs.writeFileSync(path.join(otherDir, 'button.tsx'), 'export const OtherButton = () => null;\n');
  });

  afterAll(() => {
    // Clean up temporary sandbox directory
    if (tempRoot && fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('verifies that valid relative links pass', () => {
    // From docs/manifesto/spec.md to src/components/button.tsx
    const relToSrc = resolveInternalLink(specMd, '../../src/components/button.tsx');
    expect(relToSrc).toBe(true);

    // From docs/manifesto/spec.md to docs/wiki/_sidebar.md
    const relToSidebar = resolveInternalLink(specMd, '../wiki/_sidebar.md');
    expect(relToSidebar).toBe(true);

    // Same-directory relative reference
    const selfRel = resolveInternalLink(specMd, './spec.md');
    expect(selfRel).toBe(true);
  });

  it('verifies that invalid relative paths fail', () => {
    const missingSibling = resolveInternalLink(specMd, './nonexistent.md');
    expect(missingSibling).toBe(false);

    const missingInSrc = resolveInternalLink(specMd, '../../src/components/nonexistent.tsx');
    expect(missingInSrc).toBe(false);
  });

  it('verifies that paths with ../ resolve correctly to parent files and fail if pointing to non-existent files', () => {
    // Exactly 2 levels up reaches tempRoot/target-parent.md
    const validParentLink = resolveInternalLink(specMd, '../../target-parent.md');
    expect(validParentLink).toBe(true);

    // Only 1 level up lands in tempRoot/docs/ where target-parent.md does not exist
    const shallowParentLink = resolveInternalLink(specMd, '../target-parent.md');
    expect(shallowParentLink).toBe(false);

    // 2 levels up to non-existent file
    const missingParentLink = resolveInternalLink(specMd, '../../missing-parent.md');
    expect(missingParentLink).toBe(false);
  });

  it('verifies that a link to a wrong directory fails even if a file with the same basename exists elsewhere', () => {
    // button.tsx exists in src/components/ and other/, but NOT in src/wrong_dir/
    const wrongDirLink = resolveInternalLink(specMd, '../../src/wrong_dir/button.tsx');
    expect(wrongDirLink).toBe(false);

    const nonExistentModuleLink = resolveInternalLink(specMd, '../../somewhere/button.tsx');
    expect(nonExistentModuleLink).toBe(false);
  });

  it('verifies that markdown anchors are stripped and base file existence is verified', () => {
    // Pure fragment link in the same document
    const localAnchor = resolveInternalLink(specMd, '#quick-start');
    expect(localAnchor).toBe(true);

    // Cross-file link with section anchor to existing file
    const crossFileWithAnchor = resolveInternalLink(specMd, '../../target-parent.md#installation-guide');
    expect(crossFileWithAnchor).toBe(true);

    // Cross-file link with section anchor to non-existent file
    const missingFileWithAnchor = resolveInternalLink(specMd, '../../nonexistent.md#architecture');
    expect(missingFileWithAnchor).toBe(false);
  });

  it('verifies root-relative wiki link resolution against WIKI_DIR', () => {
    // Wiki root-relative link starting with '/' when isWiki is true
    const validWikiLink = resolveInternalLink(guideMd, '/en/guide.md', { isWiki: true, wikiDir });
    expect(validWikiLink).toBe(true);

    const validSidebarLink = resolveInternalLink(guideMd, '/_sidebar.md', { isWiki: true, wikiDir });
    expect(validSidebarLink).toBe(true);

    const invalidWikiLink = resolveInternalLink(guideMd, '/en/missing.md', { isWiki: true, wikiDir });
    expect(invalidWikiLink).toBe(false);

    // Backward compatibility: passing boolean true for isWiki
    const boolWikiLink = resolveInternalLink(guideMd, '../_sidebar.md', true);
    expect(boolWikiLink).toBe(true);
  });
});
