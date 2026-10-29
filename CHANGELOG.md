# Changelog

All notable changes to **oXyFlow** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added in Unreleased

- **Legacy Backup Migration & Tolerance (`backupMigrator`)**:
  - Implemented `migrateLegacyBackup` in `src/common/utils/backupMigrator.ts` providing automated normalization for legacy localStorage dumps and previous backup structures.
  - Integrated migration pipeline into `validateBackupPayload` in `src/common/utils/backupValidator.ts`.
  - Added unit test suite in `tests/unit/common/utils/backupMigrator.test.ts`.
- **Web Application & Progressive Web App (PWA) Deployment (`/app/`)**:
  - Configured standalone web build script (`bun run build:web`) with base path `/TimeLog/app/` for GitHub Pages hosting alongside Docsify documentation.
  - Integrated `vite-plugin-pwa` with webmanifest generation, offline asset precaching, and responsive PWA icon assets (`192x192`, `512x512`) in `public/icons/`.
  - Added reusable GitHub Actions workflow `.github/workflows/build-web.yml` and unified Pages deployment in `.github/workflows/pages.yml` serving Docsify wiki at `/` and the PWA web app at `/app/`.
  - Gated desktop-specific features (`autoStart`, `minimizeToTray`, `alwaysOnTop`) and restricted selectable layouts strictly to `medium` and `full` in browser runtime via `PlatformCapabilitiesContext`.

### Changed in Unreleased

- **Zero-Data Clean Slate Initial State & Storage Partitioning**:
  - Refactored `LocalStorageStateStore.load()` to initialize with clean empty collections (`projects: []`, `tasks: []`, `logs: []`) on fresh application launches, eliminating forced demo data pollution.
  - Purged personal vacation items from `DEFAULT_HOLIDAYS` in `InitialData.ts`, retaining official statutory holidays only.
  - Partitioned storage keys in `src/common/constants/storage-keys.ts` (`DOMAIN_STORAGE_KEYS.BUSINESS`, `SETTINGS`, `SYSTEM`) allowing atomic cleanup of business data without affecting user preferences.
- **Documentation & Brand Identity Overhaul (`README.md`)**:
  - Overhauled root `README.md` to establish the canonical product name **oXyFlow TimeLog**, incorporating official badges, binary download matrices for Windows, macOS, and Linux, and a dedicated "CLI in 30 Seconds" terminal tour.
  - Aligned architecture diagrams and feature specifications with v1.10.x capabilities (offline SQLite, native `oxy` CLI, multi-density layouts, Recharts analytics, real-time sinks, and 6-language localization).
- **Single Source of Truth Metadata Centralization & Canonical Build Naming**:
  - Established root `metadata.json` as the unified source of truth for versioning, canonical names (Short: `TimeLog`, Long: `oXyFlow TimeLog`), and author attribution (**Marcin 'beoArcha' Stefan**).
  - Implemented `scripts/sync_metadata.js` (`bun run metadata:sync`, `bun run metadata:check`) synchronizing `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and backend constants.
  - Aligned desktop build output to short executable name `TimeLog.exe` / `timelog` with long window title `oXyFlow TimeLog` .
  - Added permanent `.learn` reference in `.agents/rules/project_metadata_standards.md` detailing step-by-step update procedures.

### Removed in Unreleased

- **Redundant `src/versions.json`**:
  - Eliminated redundant `src/versions.json` in favor of direct imports from the root `metadata.json` SSOT across all frontend layouts and CLI components.

---

## [1.10.1] - 2026-10-24

### Added in 1.10.1
