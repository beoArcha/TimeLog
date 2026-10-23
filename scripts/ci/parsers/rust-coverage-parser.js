import fs from 'node:fs';
import { RUST_MODULES } from '../constants.js';
import { extractFilePath, findFilesRecursive, safeReadJson } from '../fs-utils.js';

/**
 * Extracts line coverage from Tarpaulin file trace data.
 *
 * @param {any} fileData Array of hits or object with covered/coverable properties.
 * @returns {{ covered: number, total: number }}
 */
function extractTarpaulinMetrics(fileData) {
  let cov = 0;
  let tot = 0;

  if (Array.isArray(fileData)) {
    for (const item of fileData) {
      if (item === null || item === undefined) continue;
      tot++;
      if (typeof item === 'number' && item > 0) cov++;
      else if (typeof item === 'object' && (item.count > 0 || item.hits > 0 || item.hit > 0)) cov++;
    }
  } else if (fileData && typeof fileData === 'object') {
    cov = fileData.covered ?? 0;
    tot = fileData.coverable ?? 0;
  }

  return { covered: cov, total: tot };
}

/**
 * Parses Cobertura XML content when Tarpaulin JSON is not present.
 *
 * @param {string} content XML file content.
 * @param {Map<string, { covered: number, total: number }>} fileMap Map to populate.
 * @returns {number | null} Overall line rate percentage if declared in XML.
 */
function parseCoberturaXmlContent(content, fileMap) {
  let overallPct = null;
  const rateMatch = content.match(/line-rate="([0-9.]+)"/);
  if (rateMatch && rateMatch[1]) {
    overallPct = parseFloat(rateMatch[1]) * 100;
  }

  const classRegex = /<class[^>]+filename="([^"]+)"[^>]*>([\s\S]*?)<\/class>/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const filename = extractFilePath(match[1]);
    if (!filename) continue;

    const classBody = match[2];
    const lineRegex = /<line[^>]+hits="(\d+)"/g;
    let lineMatch;
    let cov = 0;
    let tot = 0;

    while ((lineMatch = lineRegex.exec(classBody)) !== null) {
      tot++;
      if (parseInt(lineMatch[1], 10) > 0) cov++;
    }

    if (tot > 0) {
      fileMap.set(filename, { covered: cov, total: tot });
    }
  }

  return overallPct;
}

/**
 * Computes coverage breakdown per Rust submodule.
 *
 * @param {Map<string, { covered: number, total: number }>} fileMap Map of per-file coverage.
 * @returns {import('../types.js').ModuleCoverageBreakdown[]}
 */
function computeRustBreakdown(fileMap) {
  /** @type {import('../types.js').ModuleCoverageBreakdown[]} */
  const breakdown = [];

  for (const mod of RUST_MODULES) {
    let modTot = 0;
    let modCov = 0;

    for (const [filePath, data] of fileMap.entries()) {
      const normalized = extractFilePath(filePath);
      if (!normalized) continue;

      if (
        normalized.includes(mod.token) ||
        normalized.startsWith(mod.token.slice(1)) ||
        normalized.includes(mod.name)
      ) {
        modTot += data.total;
        modCov += data.covered;
      }
    }

    if (modTot > 0) {
      breakdown.push({
        name: mod.name,
        lines: (modCov / modTot) * 100,
        covered: modCov,
        total: modTot
      });
    }
  }

  return breakdown;
}

/**
 * Discovers and merges Rust coverage reports across unit and integration test artifacts.
 *
 * @param {string[]} [searchDirs=['coverage-reports', 'coverage', 'coverage-rust', '.']]
 * @returns {import('../types.js').LayerCoverageReport | null} Parsed Rust coverage report or null.
 */
export function parseRustCoverage(searchDirs = ['coverage-reports', 'coverage', 'coverage-rust', '.']) {
  let jsonFiles = [];
  let xmlFiles = [];

  for (const dir of searchDirs) {
    jsonFiles.push(...findFilesRecursive(dir, /tarpaulin.*\.json$/));
    xmlFiles.push(...findFilesRecursive(dir, /cobertura.*\.xml$/));
  }
  jsonFiles = [...new Set(jsonFiles)];
  xmlFiles = [...new Set(xmlFiles)];

  /** @type {Map<string, { covered: number, total: number }>} */
  const fileMap = new Map();
  let overallCovered = 0;
  let overallCoverable = 0;
  let overallPct = null;

  let unitCovered = 0;
  let unitCoverable = 0;
  let intCovered = 0;
  let intCoverable = 0;

  for (const file of jsonFiles) {
    /** @type {any} */
    const raw = safeReadJson(file);
    if (!raw) continue;

    const norm = file.replace(/\\/g, '/').toLowerCase();
    const isUnit = norm.includes('unit');
    const isInt = norm.includes('integration');

    if (raw.covered !== undefined && raw.coverable !== undefined) {
      overallCovered = raw.covered;
      overallCoverable = raw.coverable;
      if (isUnit) {
        unitCovered += raw.covered;
        unitCoverable += raw.coverable;
      } else if (isInt) {
        intCovered += raw.covered;
        intCoverable += raw.coverable;
      }
    }

    if (raw.files && typeof raw.files === 'object') {
      const entries = Array.isArray(raw.files)
        ? raw.files.map((f) => [extractFilePath(f), f])
        : Object.entries(raw.files).map(([k, v]) => [extractFilePath(k), v]);

      for (const [cleanPath, fileData] of entries) {
        if (!cleanPath) continue;
        const { covered: cov, total: tot } = extractTarpaulinMetrics(fileData);

        if (tot > 0) {
          const existing = fileMap.get(cleanPath);
          if (existing) {
            fileMap.set(cleanPath, {
              covered: Math.max(existing.covered, cov),
              total: Math.max(existing.total, tot)
            });
          } else {
            fileMap.set(cleanPath, { covered: cov, total: tot });
          }
        }
      }
    }
  }

  if (fileMap.size === 0) {
    for (const file of xmlFiles) {
      if (!fs.existsSync(file)) continue;
      try {
        const content = fs.readFileSync(file, 'utf8');
        const rate = parseCoberturaXmlContent(content, fileMap);
        if (rate !== null && overallPct === null) {
          overallPct = rate;
        }
        if (fileMap.size > 0) break;
      } catch {
        // Continue searching candidate files
      }
    }
  }

  if (overallCoverable === 0 && fileMap.size > 0) {
    for (const data of fileMap.values()) {
      overallCovered += data.covered;
      overallCoverable += data.total;
    }
  }

  if (overallCoverable > 0) {
    overallPct = (overallCovered / overallCoverable) * 100;
  }

  if (overallPct === null && fileMap.size === 0) {
    return null;
  }

  const breakdown = computeRustBreakdown(fileMap);

  return {
    linesPct: overallPct ?? 0,
    all: { linesPct: overallPct ?? 0 },
    unit: unitCoverable > 0 ? { linesPct: (unitCovered / unitCoverable) * 100 } : undefined,
    integration: intCoverable > 0 ? { linesPct: (intCovered / intCoverable) * 100 } : undefined,
    covered: overallCovered,
    coverable: overallCoverable,
    breakdown
  };
}
