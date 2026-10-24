import fs from 'node:fs';
import path from 'node:path';

/**
 * Detects whether a buffer is encoded in UTF-16LE or UTF-8.
 * PowerShell on Windows redirects process stdout with UTF-16LE encoding by default.
 *
 * @param {Buffer} buffer Raw file buffer.
 * @returns {'utf16le' | 'utf8'} Detected character encoding.
 */
export function detectTextEncoding(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return 'utf16le';
  }

  // Windows UTF-16LE streams without BOM contain null bytes at alternating odd offsets for ASCII text.
  let nullByteCount = 0;
  const sampleLength = Math.min(buffer.length, 100);
  for (let i = 0; i < sampleLength; i++) {
    if (buffer[i] === 0) {
      nullByteCount++;
    }
  }

  return nullByteCount > 10 ? 'utf16le' : 'utf8';
}

/**
 * Normalizes file path representations across various coverage and test formats.
 * Tarpaulin JSON serializes PathBuf as an array of path segments e.g. ["src", "engine", "mod.rs"].
 *
 * @param {unknown} raw Raw path representation from JSON or XML.
 * @returns {string} Normalized POSIX path string.
 */
export function extractFilePath(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.replace(/\\/g, '/');

  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map(String).join('/');
  }

  if (typeof raw === 'object' && raw !== null) {
    /** @type {Record<string, unknown>} */
    const obj = /** @type {*} */ (raw);
    if (obj.path) return extractFilePath(obj.path);
    if (obj.filename) return extractFilePath(obj.filename);
    if (obj.name) return extractFilePath(obj.name);
    if (obj.file) return extractFilePath(obj.file);
  }

  return String(raw).replace(/\\/g, '/');
}

/**
 * Recursively locates all files matching the supplied regular expression.
 *
 * @param {string} dir Root directory to search.
 * @param {RegExp} pattern Regular expression to test filename.
 * @returns {string[]} List of matching absolute or relative file paths.
 */
export function findFilesRecursive(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Reads and parses a JSON file safely, returning null on missing files or parse errors.
 *
 * @template T
 * @param {string} filePath Path to the JSON file.
 * @returns {T | null} Parsed JSON payload or null.
 */
export function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Ensures that the destination directory exists, creating parents recursively.
 *
 * @param {string} targetPath File or directory path.
 * @returns {void}
 */
export function ensureDirExists(targetPath) {
  const dir = path.extname(targetPath) ? path.dirname(targetPath) : targetPath;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
