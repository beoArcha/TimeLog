# Project Metadata & Canonical Naming Standards

Instructions and single source of truth rules for maintaining application identity, author attribution, build naming, and version updates across polyglot configurations in oXyFlow TimeLog.

---

## 1. Canonical Naming & Identity Invariants

| Dimension | Canonical Value | Target Usage |
| :--- | :--- | :--- |
| **Short Name** | `TimeLog` (lowercase `timelog`) | Built executable binary (`TimeLog.exe`), bundle package name (`package.json.name`), process identifier. |
| **Long Name** | `oXyFlow TimeLog` | Application window title, taskbar hover, credits dialog, documentation headings, user-facing branding. |
| **Companion CLI** | `oxy` | Standalone native headless CLI binary and in-app terminal command (`oxy start`, `oxy status`, etc.). |
| **Author** | `Marcin 'beoArcha' Stefan` | `package.json.author`, `Cargo.toml.authors`, copyright notices, and credits dialog. |
| **License** | `MPL-2.0` | Mozilla Public License Version 2.0 across all packages. |
| **Identifier** | `com.oxytime.timelog` / `com.oxytime.oxyflow` | OS bundle reverse-DNS identifier and local appdata directory. |

---

## 2. Single Source of Truth (SSOT): `metadata.json`

All metadata fields and version numbers are authored in a single file at the repository root:
`metadata.json`

```json
{
  "name": "TimeLog",
  "shortName": "TimeLog",
  "longName": "oXyFlow TimeLog",
  "identifier": "com.oxytime.timelog",
  "author": "Marcin 'beoArcha' Stefan",
  "description": "Ultra-lightweight, local-first work timer and task tracker built with Rust, Tauri v2, SQLite, and React 19.",
  "license": "MPL-2.0",
  "repository": "https://github.com/beoArcha/TimeLog",
  "homepage": "https://github.com/beoArcha/TimeLog",
  "version": "1.10.4",
  "versions": {
    "major": 1,
    "minor": 10,
    "release": 4,
    "subversions": {
      "engine": 22,
      "components": 3,
      "translations": 2,
      "front": 15
    }
  }
}
```

Never hand-edit version numbers or author strings in secondary files without synchronizing.

---

## 3. Downstream Polyglot Targets

Tauri, Rust Cargo, and npm/bun require individual configuration files. The synchronization script (`scripts/sync_metadata.js`) propagates values from `metadata.json` into:

| File | Target Fields |
| :--- | :--- |
| `package.json` | `name`, `version`, `author`, `description`, `license` |
| `src-tauri/tauri.conf.json` | `productName`, `version`, `app.windows[0].title` |
| `src-tauri/Cargo.toml` | `version`, `authors`, `description` |
| `src/versions.json` | `major`, `minor`, `release`, `subversions` (kept for React imports) |
| `src-tauri/src/common/constants.rs` | `APP_NAME` |

---

## 4. How to Update Metadata & Versions

### 4.1. Automatic Version Bumping (CI / Workflows)
For routine release or development version increments:
- Bump main branch (even minor):
  ```bash
  bun scripts/bump_versions.js --main
  ```
- Bump release branch (odd minor):
  ```bash
  bun scripts/bump_versions.js --release
  ```
This script updates `metadata.json` and automatically triggers `scripts/sync_metadata.js`.

### 4.2. Manual Metadata Updates (Author, Descriptions, URLs)
When changing metadata fields manually:
1. Edit `metadata.json`.
2. Run synchronization:
   ```bash
   bun run metadata:sync
   ```
3. Verify that all targets are synchronized:
   ```bash
   bun run metadata:check
   ```
4. Run project verification:
   ```bash
   bun run check
   ```

---

## 5. Pre-Commit Checklist

Before committing changes related to versions or branding:
- [ ] `metadata.json` contains the intended version and metadata values.
- [ ] `bun run metadata:check` exits with status `0` (`[OK] All project files are in sync with metadata.json.`).
- [ ] `bun run docs:validate` passes.
- [ ] `bun run check` passes without TypeScript, ESLint, or Rust Clippy warnings.
