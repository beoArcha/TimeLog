# Changelog

All notable changes to **oXyFlow TimeLog** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Versioned Success Envelope for Entity CLI Commands (TASK-301 part 2)**:
  - Migrated machine output (`--json`/`--machine`) of all entity commands (`project ls|add|rename|archive`, `task ls|add|done|rename|rate|reparent|move|archive`, `log ls|add|edit|rm`) to versioned `SuccessEnvelope` (`oxy.project.*`, `oxy.task.*`, `oxy.log.*`, `schemaVersion: 1`).
  - Added typed payload structs (`ProjectListPayload`, `TaskListPayload`, `LogListPayload`, `EntityActionPayload`, `LogRemovePayload`) with camelCase serialization and TypeScript bindings.
  - Mirrored all entity command envelope output in the browser sandbox emulator (`src/features/cli/sandbox/`).
  - Added comprehensive contract tests verifying valid JSON, envelope schemas, and recursive camelCase keys across all migrated commands.

### Fixed

- **`start -q` / `switch -q` Print the Time Log ID**: quiet `start` and `switch` print only the ID of the time log they open (nothing when the task is already running), in the native CLI and the sandbox emulator.
- **Consistent `-q` / `--quiet` Output for Scripts**:
  - Mutations (`project`, `task` and `log` add, edit, rename, archive and remove) print only the affected entity's full ID, so `ID=$(oxy task add X -q)` captures a bare UUID.
  - Quiet lists print bare rows without the `✅` status prefix, header or truncation footer; an empty quiet list prints nothing.
  - Errors are still reported on stderr with unchanged exit codes.
  - The browser sandbox emulator mirrors the same contract, and `-q` no longer swallows a following positional (`task add -q <name>`).
- **Timezone-Aware Time Log Editing & DST Validation (PR #104)**:
  - Replaced iterative local-to-UTC conversion with offset-candidate resolution that verifies the exact local wall-clock round trip.
  - Rejects non-existent local times during DST gaps and ambiguous local times during DST overlaps instead of silently shifting or selecting an arbitrary instant.
  - Preserves explicit ISO 8601 timestamps with UTC markers or offsets as exact instants.
  - Added edge-case tests for Warsaw and New York DST transitions, 30-minute Lord Howe transitions, Samoa's skipped civil date, explicit offsets, leap days, and calendar/year boundaries.
- **Stop and Forbid Timer on Completed Tasks (Rust & Browser Engine Parity)**:
  - Enforced unconditional active timer termination when completing a task or any of its parent tasks in `useTasksManager` (`handleToggleTaskComplete`), regardless of workflow auto-stop configuration.
  - Added strict task completion check in Rust engine (`start_timer`, `switch_timer`) and browser engine (`BrowserTimerEngine`), returning strongly-typed `EngineError::TaskAlreadyCompleted` / `ERR_TASK_ALREADY_COMPLETED`.
  - Mapped `TaskAlreadyCompleted` to `DOM_BUSINESS_VIOLATION` in native CLI with POSIX exit code 1.
- **DB Explorer Persistence & Sync Error Propagation**:
  - Ensured DB Explorer (`TimeLogsTable` and `TimeLogTableRow`) handles and displays persistence and synchronization errors gracefully during time log editing.
  - Kept row edit mode open when a save fails or repository reload does not complete, preventing premature closure with false success.
  - Rendered localized error feedback in an accessible `<Alert>` region with `role="alert"` and `aria-live="polite"` using domain translations (`SyncErrorReason`, common error keys, and repository error messages).
  - Cleared error states and validation flags upon edit cancellation or subsequent successful save.
- **DB Explorer Audit Reason Integrity & Validation**:
  - Initialized the audit reason input in DB Explorer (`TimeLogTableRow`) as an empty string instead of defaulting to `SyncErrorReason`.
  - Added strict validation blocking save when the audit reason is empty or contains only whitespace, setting `aria-invalid="true"` and visual error indicators on the input.
  - Updated `TimeLogsTable` and `useTimerManager` to accept and forward `auditSource: "GUI Edit"` along with the explicit, validated reason to the engine (`EngineRouter.getInstance().timeLogs.editTimeLog`).
- **CI Frontend Setup Resilience**:
  - Added an npm fallback in `.github/actions/setup-frontend/action.yml` when `oven-sh/setup-bun` encounters upstream GitHub Release asset proxy timeouts or HTTP 504 Gateway Time-out errors.
- **ZIP32 Format Boundary & ZIP64 Sentinel Reservation**:
  - Reserved ZIP64 sentinel boundaries in `zipBuilder`: capped maximum allowed ZIP32 entry count at 65534 (`0xFFFE`) and maximum entry size and local header offset at `0xFFFFFFFE` (`4,294,967,294` bytes) to prevent producing invalid standard ZIP archives with ambiguous ZIP64 sentinel headers (`0xFFFF` / `0xFFFFFFFF`).
  - Added boundary validation test coverage for entry count limits (65534 boundary pass and 65535 boundary fail) and 4GB entry size and header offset boundaries.
- **CSV Formula Injection (CWE-1236) Unicode Whitespace Parity**:
  - Unified Unicode White_Space and Control character detection in `CsvExporterPlugin.ts` with the Rust reference implementation (`char::is_whitespace() || char::is_control()`), neutralizing formula injection triggers preceded by Unicode spaces (U+00A0 NBSP, U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F, U+3000).
  - Explicitly excluded Unicode format characters (Cf: U+200B zero-width space, U+FEFF BOM) from whitespace categorization to guarantee 100% cross-runtime parity with Rust.
  - Preserved valid integer, float, and scientific notation numbers from apostrophe neutralization across both runtimes.
  - Added shared 60-vector cross-runtime fixture matrix in `tests/shared/fixtures/csv-formula-parity-cases.json` executed by both Vitest and Cargo test suites.
- **SQLite Time Log History Migration Compatibility**:
  - Added migration 9 to rebuild legacy `time_logs_history` tables where `reason` is still `NOT NULL`, making the column nullable without losing existing audit records or the `time_logs` foreign-key cascade.
  - Added migration regression coverage for v8 databases, NULL-reason inserts, history preservation, foreign-key cascade behavior, and idempotent initialization.
- **Playwright CI Browser Installation**:
  - Removed the unnecessary Google Chrome download and aligned the E2E project with Playwright-managed Chromium.
  - Separated Linux browser dependencies from browser installation, increased the download connection timeout, and added bounded retries for transient download failures.
- **Composite UI Component Behavior**:
  - Migrated `CollapsibleCard` to the shared Base UI collapsible primitive, kept `headerRight` actions independent, and preserved collapsed child state.
  - Kept `PromptDialog` open after synchronous or asynchronous confirmation failures, displayed the error, and prevented unhandled Promise rejections.
  - Removed the duplicate `SegmentedControl` change callback path.
  - Corrected `ToggleGroupItem` precedence so item-level variant and size overrides take effect.

### Breaking Changes

- **Versioned `--json` / `--machine` Envelope for Flow Commands**:
  - `start`, `stop`, `switch` and `status` now print `{ "schema": "oxy.<command>", "schemaVersion": 1, "data": {...}, "meta": { "generatedAt", "generator" } }` instead of the previous flat object; the former `"status": "ok"` field is removed and there is no v1 compatibility mode.
  - Keys are camelCase (`activeTaskIds`, `stoppedCount`, `stoppedTaskIds`, `timeLogId`) and `action` values are camelCase (`alreadyRunning`).
  - `--machine` prints one compact line; `--json` is indented only on a terminal and compact when piped.
  - The browser sandbox emulator mirrors the envelope for the same four commands.

- **Identity & OS Bundle Identifier**:
  - Changed reverse-DNS identifier from `com.oxytime.timelog` / `com.oxytime.oxyflow` to `com.oxyflow.timelog`.
  - Application data directory is now unified across GUI and CLI using native OS directories: Windows (`%APPDATA%\com.oxyflow.timelog`), Linux (`$XDG_DATA_HOME/com.oxyflow.timelog` with fallback to `~/.local/share/com.oxyflow.timelog`), and macOS (`~/Library/Application Support/com.oxyflow.timelog`). Previous data is not automatically migrated (manual migration via JSON backup export/import).
- **CLI Binary & Alias Naming**:
  - The actual executable and primary CLI command is `oxy`.
  - `oxytime` is retained as a technical alias / helper shortcut.
  - Legacy alias `oxyflow` is completely removed.
- **Installer & Release Package Naming**:
  - Release binaries and installer bundles use canonical, unversioned asset names matching `README.md` download links:
    - Windows: `oXyFlow_TimeLog-Setup-x64.exe` (NSIS setup wizard) and `oXyFlow_TimeLog-Standalone-x64.exe` (portable standalone)
    - macOS: `oXyFlow_TimeLog-Universal.dmg` (universal disk image for Apple Silicon & Intel)
    - Linux: `oXyFlow_TimeLog-x86_64.AppImage`, `timelog_amd64.deb`, and `timelog.x86_64.rpm`
  - Version numbers are omitted from release asset filenames because versioning is provided by the release tag. Legacy download links cease functioning.
- **Configuration File Rename**:
  - Renamed development/app server configuration file from `dev.config.json` to `app.config.json`.
- **Rust Backend Crate Rename**:
  - Renamed the core crate in `src-tauri/Cargo.toml` from `oxy-flow` to `oxyflow-timelog`, with internal library crate imports referencing `oxyflow_timelog::`.
- **PWA Manifest Branding**:
  - Updated web manifest application name to `TimeLog by oXyFlow` (`short_name`: `TimeLog`), adhering to group brand (`oXyFlow`) and product name (`TimeLog`) hierarchy.
- **Canonical Architecture Governance**:
  - Added authoritative specification `docs/manifesto/NAMING.md` establishing group (`oXyFlow`) vs. product (`TimeLog`) hierarchy and domain disambiguation.

### Added

- **CLI Streaming Writer Seam & Atomic Export Writes** (`feat/cli-export-streaming`):
  - Introduced streaming export writer seam `export_to_writer` in `src-tauri/src/cli/exporters/` accepting any sink implementing `std::io::Write`.
  - Added dedicated streaming writer functions for all supported formats: `write_csv`, `write_json`, `write_html`, `write_xml`, `write_xlsx`, and `write_ods`.
  - Implemented safe, atomic file writing with `atomic_write_to_file` using `std::io::BufWriter` to a temporary `.tmp` file in the destination directory and atomic rename on completion, ensuring no partial or corrupted files remain upon write errors.
  - Refactored `export_to_file` and `export_schema_to_file` to delegate to `atomic_write_to_file` while preserving 100% backward compatibility for all existing CLI commands, exit codes, and error mapping contracts.
  - Added comprehensive unit test coverage in `src-tauri/tests/unit/cli/exporter_streaming_test.rs` validating multi-format streaming, format output parity, atomic file creation/overwrites, directory validation, and clean temp file cleanup upon failure.
- **Canonical XML Report XSD Schema Validation Suite (`TASK-B4-XML-XSD-VALIDATION`)**:
  - Implemented comprehensive cross-runtime canonical XSD validation suite in TypeScript/Vitest (`tests/integration/exporters/XmlReportXsdValidation.test.ts`, `tests/unit/plugins/exporters/XmlExporterPlugin.test.ts`) and Rust CLI (`src-tauri/tests/unit/cli/exporter_xml_xsd_test.rs`).
  - Verified structural compliance against `schemas/xml/report/v1/report.xsd` across all report data scenarios: full hierarchy (Project -> Task -> Subtask + entries), minimal reports (omitted optional fields), empty reports (zero durations, self-closing tags), and special characters/entities (`&`, `<`, `>`, `"`, `'`, control characters, Unicode diacritics, and emoji).
  - Enforced strict canonical XSD data type compliance (`xs:nonNegativeInteger` for duration seconds, `xs:dateTime` ISO 8601 for generatedAt, `xs:decimal` for percentages) and canonical element sequence ordering.
  - Added robust negative validation coverage asserting failure on invalid schema versions, missing canonical sections, out-of-order tags, and malformed types.

- **Cross-Runtime Audit Source & Reason Parity Test Suite**:
  - Established shared cross-runtime test matrix fixture `tests/shared/fixtures/audit-parity-cases.json` covering 41 vectors across default source, raw enum identifiers, UI label strings, optional reason for `SystemPatch`, mandatory reason validation for manual edits (`ERR_AUDIT_REASON_REQUIRED`), and invalid source detection (`ERR_AUDIT_SOURCE_INVALID`).
  - Added comprehensive BDT test coverage in `tests/integration/engine/CrossRuntimeParity.test.ts` executing the shared matrix against Browser `EnginePlugin` and verifying payload mapping in Desktop Tauri `EngineCommands`.
  - Added dedicated Rust integration test suite in `src-tauri/tests/engine_lifecycle_test.rs` validating the shared fixture against the Rust reference engine implementation.
- **TagFilterGroup Component Barrel Export** (`TASK-A5-TAG-FILTER-EXPORTS`):
  - Exported `TagFilterGroup` and its associated types from `src/components/index.ts` to complete composite component exports in the primary components barrel.

- **Report Print / PDF Stylesheet & PWA Analytics Clean-Up** (Phase 18 Group D):
  - Added dedicated `@media print` CSS rules in `src/styles/index.css` stripping navigation sidebars, headers, period filters, and action buttons, while forcing clean contrast (black text, white background, no drop-shadows or backdrops, avoid-break inside tables and cards) for client-ready PDF generation.
  - Added "Print / PDF" action button with `Printer` icon in `ReportView` `ViewHeader` triggering native `window.print()`.
  - Switched hardcoded `SqlAnalyticsEngine` badge in `ReportView` to dynamically resolve via `usePlatformCapabilities().isDesktop`, displaying `SqlAnalyticsEngine` on desktop and `AnalyticsEngine` (without "SQL") in browser/PWA mode.
  - Added and synchronized `Print` and `AnalyticsEngine` i18n keys across all 10 supported locales (`en`, `pl`, `de`, `es`, `pt-br`, `fr`, `uk`, `ja`, `nl`, `it`).
- **Credits & Technology Stack Modernization** (Phase 18 Group D):
  - Refreshed `CreditsModal.tsx` dependency acknowledgements to reflect the current core tech stack: React 19, @base-ui/react, Tauri v2, Recharts, Sonner, Geist Font Family, Google GenAI, Motion, and Tailwind CSS v4.
  - Updated author notes with architectural principles and Vibe Coding practices (clean boundary separation, dual-runtime parity, contract-driven architecture, and rigorous quality guardrails).
  - Added and synchronized all tech stack and architecture i18n keys across all 10 translation dictionaries.

- **Extended Locales & 10-Language i18n Suite** (PR #45, #46, #47):
  - Expanded supported language suite from 6 to 10 locales: added full translation dictionaries for Japanese (`ja`), Dutch (`nl`), Italian (`it`), and completed Ukrainian (`uk`) across all 12 translation domains.
  - Introduced `LanguageSelectionModal` in Settings (`@features/settings/components/LanguageSelectionModal`) with accessible Base UI `RadioGroup` keyboard navigation, active system resolution badges, and custom override status indicator.
  - Decoupled `LanguageSettingsCard` and implemented `CustomTranslationsEditor`, allowing users to define, persist, and delete granular key-value translation overrides per domain directly from the settings interface without modifying dictionary files.
  - Centralized locale constants and OS locale resolution (`resolveSystemLocale`) in `@common/i18n/locales.ts` (`STANDARD_LOCALES`, `SUPPORTED_LOCALES`, `LOCALE_METADATA`).
  - Added modular domain key union definitions in `src/common/i18n/keys/` (`app.ts`, `settings.ts`, etc.) and synchronized type contracts.
  - Enforced automated `I18nQualityRule` architectural guardrails and quality gates verifying 100% key parity, zero empty strings, and placeholder parity (`{name}`, `{code}`, `{count}`) across all 12 domains in 10 languages.
- **CLI Machine Locale Configuration & Diagnostic Stream Separation** (PR #44):
  - Added persistent `cli_machine_locale` SQLite configuration key manageable via `oxy config set cli_machine_locale <locale>` and `oxy config get cli_machine_locale`.
  - Machine and automation runs default to English (`en`) for predictable automated ingestion, while respecting user-configured `cli_machine_locale` overrides.
  - Centralized error envelope locale resolution (`resolve_envelope_locale`) and configured logger backend (`env_logger`) writing exclusively to `stderr`, preserving deterministic machine-readable stdout streams (`--machine`, `--json`).
- **Multi-Agent Workflow Standards & Review Governance** (PR #48):
  - Codified PR commit discipline, atomic branch ownership, review chaining protocols, and test exemption guidelines for non-code artifacts (`.agents/`, `docs/`, `*.md`) in `.agents/rules/`.
- **Shared Design System Components**:
  - Added reusable empty-state, status-dot, and icon-box patterns for consistent status and empty-view presentation.
  - Rebuilt the animated drawer on the accessible Base UI Dialog lifecycle, retaining Escape and backdrop dismissal and CSS entry/exit transitions.

### Changed

- **CLI Report Export Documentation Parity**:
  - Updated `docs/manifesto/CLI.md` to reflect that CSV, HTML, JSON, and XML report exporters serialize payloads in memory before writing to disk via `std::fs::write`.
  - Documented that ODS and XLSX formats are generated natively in Rust via `spreadsheet-ods` and `rust_xlsxwriter`, while the custom ZIP32 builder with MS-DOS timestamps and 32-bit boundary validation resides in the TypeScript browser plugin layer (`src/plugins/exporters/zipBuilder.ts`).
  - Marked unbuffered disk streaming as `[PLANNED]` pending completion of task B3.
- **Engineering Standards & i18n Locales Specification**:
  - Aligned `AGENTS.md` and frontend engineering standards with the full suite of 10 supported locales (`en`, `pl`, `de`, `es`, `fr`, `pt-br`, `uk`, `ja`, `nl`, `it`).
  - Formalized the `I18N_DOMAINS` domain contract from `src/common/i18n/keys.ts`, clarifying that new keys must be defined in modular domain key files (`src/common/i18n/keys/<domain>.ts`) and localized across all 10 locales in domain dictionaries (`src/common/i18n/dictionaries/<domain>.json`).

- **Accessible Radio Semantics & Localized Settings**:
  - Refactored `LanguageSelectionModal` to delegate radio semantics, keyboard arrow navigation, and roving focus exclusively to the Base UI `RadioGroupItem` primitive, eliminating redundant wrapper roles and focus traps.
  - Localized all settings modal labels, descriptions, validation alerts, and placeholders across all 10 locales using `translate()`.

- **Theme-Safe UI Components**:
  - Replaced hardcoded dark-theme colors in DbExplorer, CLI, task status, and tray views with semantic design tokens and shared project-color resolution for palette and custom HEX values.
  - Removed unused theme props from layout components and orchestration; components now consume theme-independent semantic tokens.
- **Shared Project Forms and Layout Composition**:
  - Extracted reusable project fields for name, emoji, color, description, tags, rates, and concurrency across project creation and editing surfaces.
  - Adopted semantic Area, HStack, VStack, and InlineCluster primitives in layout composition.
  - Simplified DbExplorer table selection and rendering, and localized connection/daemon status labels across all six locales.

---

## [1.12.7] - 2026-11-02

### Added in 1.12.7

- **Accessible Emoji Selector & Unicode Grapheme Normalization**:
  - Implemented `EmojiPicker` (`@components/ui/emoji-picker`) based on `@base-ui/react/popover` with category navigation (`work`, `status`, `creative`, `life`), keyword search, and custom emoji support.
  - Implemented `getFirstGrapheme` utility utilizing `Intl.Segmenter` to prevent truncation of multi-byte, ZWJ sequences, skin-tone modifiers, and regional indicator flag emojis.
  - Integrated `EmojiPicker` into `SidebarProjectForm` and `EditProjectDialog`, removing legacy `maxLength={2}` restriction that truncated complex emojis.
  - Added 6-language translations (`SelectEmoji`, `ClearEmoji`, `SearchEmoji`) across `src/common/i18n/dictionaries/project.json` and synchronized `ProjectKey` in `src/common/i18n/keys.ts`.
  - Added unit test suite in `tests/unit/components/EmojiPicker.test.tsx` and extended `tests/unit/layouts/parts/EditProjectDialog.test.tsx`.

- **PWA vs Desktop Reset Semantics & Accessible ConfirmDialog UX**:
  - Replaced manual typing prompt dialog with accessible Base UI `ConfirmDialog` (`@components/ConfirmDialog`) styled with the destructive design token variant.
  - Runtime awareness via `usePlatformCapabilities`: distinguishes between browser LocalStorage (`supportsTray: false` -> "Clear browser data" / "Wyczyść dane przeglądarki") and desktop SQLite database (`supportsTray: true` -> "Reset SQLite database" / "Zresetuj bazę SQLite").
  - Delegated reset execution to `DataContext.handleResetLocalStorage()`, triggering `PersistenceRouter.getInstance().core.reset()` and eliminating obsolete `localStorage.removeItem('oxytime_state_db_6')`.
  - Added full 6-language translations (`en`, `pl`, `de`, `es`, `fr`, `pt-br`) across `src/common/i18n/dictionaries/engine.json` and synchronized `EngineKey` in `src/common/i18n/keys.ts`.
  - Added isolated unit test suite in `tests/unit/features/settings/DestructiveResetCard.test.tsx` and updated `SettingsTab.test.tsx`.

- **Legacy Backup Migration & Tolerance (`backupMigrator`)**:
  - Implemented `migrateLegacyBackup` in `src/common/utils/backupMigrator.ts` providing automated normalization for legacy localStorage dumps and previous backup structures.
  - Integrated migration pipeline into `validateBackupPayload` in `src/common/utils/backupValidator.ts`.
  - Added unit test suite in `tests/unit/common/utils/backupMigrator.test.ts`.
- **Web Application & Progressive Web App (PWA) Deployment (`/app/`)**:
  - Configured standalone web build script (`bun run build:web`) with base path `/TimeLog/app/` for GitHub Pages hosting alongside Docsify documentation.
  - Integrated `vite-plugin-pwa` with webmanifest generation, offline asset precaching, and responsive PWA icon assets (`192x192`, `512x512`) in `public/icons/`.
  - Added reusable GitHub Actions workflow `.github/workflows/build-web.yml` and unified Pages deployment in `.github/workflows/pages.yml` serving Docsify wiki at `/` and the PWA web app at `/app/`.
  - Gated desktop-specific features (`autoStart`, `minimizeToTray`, `alwaysOnTop`) and restricted selectable layouts strictly to `medium` and `full` in browser runtime via `PlatformCapabilitiesContext`.

### Changed in 1.12.7

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
  - Aligned desktop build output to short executable name `TimeLog.exe` / `timelog` with long window title `oXyFlow TimeLog`.
  - Added permanent `.learn` reference in `.agents/rules/project_metadata_standards.md` detailing step-by-step update procedures.

### Removed in 1.12.7

- **Redundant `src/versions.json`**:
  - Eliminated redundant `src/versions.json` in favor of direct imports from the root `metadata.json` SSOT across all frontend layouts and CLI components.

---

## [1.10.1] - 2026-10-24

### Added in 1.10.1

- **Frontend CLI Delegation & IPC Bridge (`cli_execute`)**:
  - Implemented `cli_execute` Tauri IPC command in `src-tauri/src/commands/cli.rs` and frontend `CliRouter` (`src/common/cli/CliRouter.ts`) with `TauriCliClient`, delegating in-app terminal commands directly to the native Rust CLI engine.
  - Added reactive UI synchronization: executing mutating CLI commands triggers `DataContext.refreshData()`, updating GUI views immediately with SQLite.
- **Cross-Runtime CLI Parity Matrix**:
  - Expanded `tests/shared/fixtures/cli-parity-cases.json` from 7 to 39 cross-runtime parity test vectors covering Flow (11), Project (8), Task (12), Log (5), and Syntax/Error (3) scenarios with expected exit codes (`0`..`5`) and error codes.
  - Implemented cross-runtime parity assertion suites in Vitest (`cli-cross-runtime-parity.test.ts`) and Cargo (`parity_matrix_test.rs`).
- **Canonical Noun-Verb Syntax in Sandbox Emulator**:
  - Implemented `SandboxCommandRouter` providing canonical noun-verb command structure (`project`, `task`, `log`, `start`, `stop`, `switch`, `status`, `today`) with flag parsing and backward-compatible redirects for legacy flat commands.

### Changed in 1.10.1

- **Version Bump**:
  - Bumped release version to `1.10.1` across `package.json`, `src/versions.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.
- **Sandbox Architecture Modularization**:
  - Decomposed `sandboxCommandRouter.ts` (768 LOC) and `sandboxEmulatorStore.ts` (421 LOC) into domain handlers (`handlers/sandboxProjectHandlers.ts`, `sandboxTaskHandlers.ts`, `sandboxLogHandlers.ts`, `sandboxFlowHandlers.ts`), pure operations (`store/sandboxProjectOps.ts`, `sandboxTaskOps.ts`, `sandboxTimerOps.ts`), and dedicated localStorage persistence (`store/sandboxStorage.ts`), adhering to file length limits (aim $\le 300$ LOC).

### Fixed in 1.10.1

- **Atomic Task Switching & Timer Parity**:
  - Aligned `switch <task-id>` in sandbox emulator to atomically stop active timer and start new timer in a single transaction.
  - Aligned `stop` command semantics in sandbox emulator: attempting to stop an inactive timer returns error code `5` (`ENG_TIMER_INACTIVE`) matching native Rust CLI behavior instead of silent success.
  - Fixed sandbox log duration display format (`durationStr || formatSeconds(durSecs)`) to match native Rust CLI output ("45m").

---

## [1.10.0] - 2026-10-24

### Added in 1.10.0

- **Database Routing & Custom Storage Path (`--db`, `OXY_DB_PATH`)**:
  - Added global `--db <path>` flag and `OXY_DB_PATH` environment variable support in `paths.rs` allowing explicit SQLite database targeting, with fallback to standard OS paths.
- **System & Database Health Diagnostics (`oxy doctor`)**:
  - Implemented `oxy doctor` diagnostics verifying database file accessibility and write permissions, SQLite integrity (`PRAGMA integrity_check`), core schema tables (`projects`, `tasks`, `subtasks`, `time_logs`, `config`, etc.), and external sink configurations.
  - Supports `--json` / `--machine` output returning structured `{ overall_status, checks }` envelopes.
- **Native Database Tooling (`oxy db backup`, `oxy db restore`)**:
  - Implemented `oxy db backup <path>` and `oxy db restore <path>` utilizing the SQLite Online Backup API (`rusqlite::backup::Backup`) for consistent, lock-free snapshots and recovery.
- **Action Masks Runtime Macro Expansion**:
  - Implemented CLI preprocessor intercepting registered action masks (`cli_aliases`), substituting positional tokens `$1` through `$9` with whitespace-safe quotation, and transparently executing expanded commands while preserving global flags (`--db`, `--json`, `--machine`).
- **Flexible Date Range & Filtered Reporting**:
  - Added `--from <YYYY-MM-DD>` and `--to <YYYY-MM-DD>` flags to `oxy report`, supporting arbitrary historical reporting intervals.
  - Added project (`-p`) and task (`-t`) filtering for report queries.
- **Global Timer Cascade Stop**:
  - Added `--all` flag to `oxy stop` (`oxy timer stop`), atomically terminating all active tracking sessions across all projects.
- **Backend Error Handling Verification & Parity**:
  - Added unit test suite `src-tauri/tests/unit/cli/manage_test.rs` covering exit codes for unimplemented commands and entity validation failures.
  - Added integration test `test_given_unhealthy_sink_when_testing_sinks_then_fails_with_exit_code_1_and_snk_external_io` in `src-tauri/tests/integration/cli/subsystems/sinks_test.rs`.
  - Added unit tests for ISO 8601 timestamp parsing and error propagation in `src-tauri/tests/unit/workflow/daemon_test.rs`.
  - Extended cross-runtime CLI parity fixtures (`cli-parity-cases.json`) with entity not found error cases.

### Changed in 1.10.0

- **Version Bump**:
  - Bumped version to `1.10.0` across `package.json`, `src/versions.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`, conforming to the even minor version invariant on `main`.
- **CLI Error Contract & Exit Codes**:
  - Standardized machine mode error envelopes: under `--machine` / `-m` and `--json` / `-j`, error payloads emit clean single-line JSON to `stderr` with the `"user"` suggestion block omitted to guarantee deterministic automation parsing.
  - Standardized semantic exit codes across all commands: `0` (Success), `1` (Generic failure / Business violation / Sink I/O), `2` (Syntax error), `3` (Storage error), `4` (Entity error), `5` (Engine error).

### Fixed in 1.10.0

- **Layer Encapsulation & Repository Error Boundary**:
  - Strictly encapsulated `RepositoryError` within the persistence layer; eliminated abstraction leakage where `RepositoryError` was directly convertible to `AppError` or `CliError`.
  - Added `PersistenceError::ConstraintViolation` capturing SQLite foreign key and uniqueness constraint failures, mapping to `"STO_SQLITE_CONSTRAINT"` at the IPC boundary.
  - Standardized entity lookup errors in Tauri persistence commands (`commands/persistence/project.rs`, `task.rs`) to typed `PersistenceError::NotFound`, eliminating ad-hoc string formatting and emitting canonical `"DOM_ENTITY_NOT_FOUND"` error codes.
  - Replaced error-swallowing `.ok()` timestamp parsing in workflow daemon steps (`workflow_run_daemon_step`) with explicit ISO 8601 validation propagating `EngineError::ParseTime` and returning `"DOM_INVALID_TIMESTAMP"`.
- **CLI Command Syntax & Diagnostics**:
  - Fixed command syntax classification: unimplemented subcommands (such as `oxy manage project list`) now return exit code `2` (`EXIT_CODE_CLI_SYNTAX`) with `CLI_SYNTAX_UNKNOWN_COMMAND` instead of a silent no-op.
  - Fixed sink error classification: `oxy sink set-csv` with empty or whitespace-only paths returns exit code `2` (`CLI_SYNTAX_INVALID_ARGS`), while inaccessible filesystem destinations return exit code `1` (`SNK_EXTERNAL_IO`) instead of leaking SQLite storage errors.
  - Fixed sink diagnostic reporting: `oxy sink test` reports full diagnostics and returns exit code `1` (`SNK_EXTERNAL_IO`) when any configured sink fails its synthetic health check.
  - Wired entity name validation: creating or renaming projects, tasks, or subtasks via `oxy manage` now validates non-empty names against `Engine` validation rules, returning exit code `1` (`ENG_OPERATION_FAILED`) on blank inputs.

### Removed in 1.10.0

- **Legacy CLI Zombie Code**:
  - Physically deleted deprecated legacy CLI modules (`src-tauri/src/cli/manage/`, `src-tauri/src/cli/settings/`, `src-tauri/src/cli/timer/`, `src-tauri/src/cli/shared/parser.rs`), consolidating all CLI commands onto modular tiered handlers (`tier1_flow`, `tier2_entities`, `tier3_subsystems`).

---

## [1.8.2] - 2026-10-23

### Fixed in 1.8.2

- **Atomic Timer Start & Rollback (`Engine::start_timer`)**:
  - Replaced multi-connection autocommit operations in `Engine::start_timer` with an atomic SQLite transaction using `TransactionBehavior::Immediate` in `repositories::business::time_logs::start_active_log`.
  - Added full rollback on failure: any error during timer start or switch (such as I/O error or constraint failure) triggers an automatic SQLite rollback, preserving previous active timers and preventing state loss.
  - Eliminated N+1 project queries and silent error swallowing: removed `_ => Ok(None)` and `if let Ok` masking, replacing sequential checks with `CLOSE_ACTIVE_LOGS_NON_CONCURRENT` SQL query and strictly propagating errors via `?`.
  - Resolved TOCTOU race condition: concurrent timer starts across multiple threads now serialize on `Immediate` write locks, preventing multiple active logs for projects with `allow_concurrency = false`.
  - Hardened frontend state synchronization in `useTimerManager.ts`: added `try ... finally` block to guarantee `repositoryState` re-syncs with persisted state (`core.load()`) even when timer start/stop commands throw errors.
- **Backend Persistence Recovery & Data Loss Prevention**:
  - Replaced lossy `.ok()` error swallowing during SQLite row mapping (`projects.rs`, `tasks.rs`, `holidays.rs`, `workflow.rs`) with explicit deserialization error propagation via `RepositoryError::Serialization`, preventing database corruption and silent `NULL` overwrites on edit.
  - Fixed `override_state` transactional isolation: partial imports now strictly preserve unmentioned entity domains (projects/tasks/logs) instead of wiping unrelated tables.
  - Replaced silent directory creation failure (`paths.rs`) with explicit I/O error propagation, preventing misleading application launch on corrupted settings.
- **Frontend LocalStorage Quarantine & Parity**:
  - Hardened `LocalStorageStateStore` against silent database wipes: corrupted JSON syntax errors now transition the store into a quarantined state (`isCorrupted`), preventing corrupted storage from being overwritten by an empty default state.
  - Enforced missing entity validation: `LocalStorageTasksPersistence` and `LocalStorageTimeLogsPersistence` now throw typed `PersistenceException` (`ERR_PERSISTENCE_TASK_NOT_FOUND`, `ERR_PERSISTENCE_LOG_NOT_FOUND`) on update/delete of non-existent IDs.
  - Eliminated empty `catch` blocks in frontend persistence services, ensuring logging and error visibility via `ErrorHandler`.
- **CLI & Engine Error Contract & Exit Codes**:
  - Fixed `time_logs.delete` and `oxy log rm`: deleting non-existent time logs now returns `DOM_ENTITY_NOT_FOUND` with exit code `4` (`EXIT_CODE_ENTITY_ERROR`) instead of apparent success (`0`).
  - Fixed `Engine::stop_timer`: stopping an idle timer now returns `ENG_TIMER_INACTIVE` with exit code `5` (`EXIT_CODE_ENGINE_ERROR`).
  - Added dedicated `EntityType::TimeLog`, `EntityType::ConfigKey`, `EntityType::MaskAlias` with clear error messages, eliminating incorrect mapping of time logs to tasks.
  - Reclassified missing config key and mask alias lookups from syntax errors (`2`) to entity not found errors (`4`).
  - Isolated export file I/O failures to typed `SinkError::Io` with error code `SNK_EXTERNAL_IO` and exit code `1`, avoiding misleading SQLite error codes.
  - Unified duration calculations across CLI glance and today handlers by delegating directly to `Engine::calculate_log_elapsed` and propagating `EngineError::ParseTime`.

### Added in 1.8.2

- **Transactional Rollback & Multi-Threaded Concurrency Tests**:
  - Added `src-tauri/tests/integration/timer/atomic_start_test.rs` validating rollback on simulated SQLite insert failures and task existence validation.
  - Added rollback test in `src-tauri/tests/integration/timer/atomic_switch_test.rs`.
  - Added multi-threaded test `src-tauri/tests/integration/timer/concurrency_test.rs` utilizing `std::thread::spawn` to verify active timer consistency during concurrent starts.
- **Fault Injection & Error Contract Test Suites**:
  - Added integration tests for non-existent log deletion, idle timer stopping, missing config key lookup, missing mask alias removal, and invalid export target paths.
  - Added unit and fault injection tests for SQLite JSON corruption and LocalStorage quarantine behavior.

---

## [1.8.0] - 2026-10-21

### Added in 1.8.0

- **First-Time User Experience (FTUX) & Starter Templates**:
  - Integrated `ProjectEmptyState` in the sidebar presenting 4 starter project templates:
    - *Software Engineering* (`dev`, `engineering`, `qa`)
    - *Client Consulting* (`client`, `consulting`, `billable`)
    - *Learning & Research* (`study`, `research`, `learning`)
    - *Content & Design* (`content`, `design`, `publishing`)
  - Complete internationalization across all 6 supported locales (`en`, `pl`, `de`, `es`, `fr`, `pt-br`).
  - Instant one-click project setup with pre-configured icons, curated theme palette colors, and tags.
- **Architectural AST Governance (Rule of 3 Nested Ifs)**:
  - TypeScript AST architecture rule (`tests/architecture/rules/max-nested-ifs.rule.ts`) and spec forbidding nested `if` statements 3 or more levels deep.
  - Rust AST architecture rule (`src-tauri/tests/architecture/rules/max_nested_ifs.rs`) and test suite enforcing maximum nested `if` depth of 2.
  - Codified Rule of 3 Ifs into `AGENTS.md` Non-Negotiable Rules and updated development standards.
- **Accessible Base UI Dialog Migrations**:
  - Created `EditProjectDialog` with focus trapping, `Escape` key handling, accessible landmarks, and keyed inner form mounting.
  - Migrated `PatchLogsTable` manual motion overlays to Base UI `Dialog` primitive.
  - Added semantic HTML landmarks (`<aside id="projects-sidebar">`, `<main id="tasks-main">`).
- **Comprehensive Headless Native CLI (`oxy`)**:
  - Subcommands for project, task, and timelog lifecycle (`create`, `archive`, `list`, `start`, `stop`, `switch`, `today`).
  - Dual-layer error architecture with structured exit codes (`0` to `5`) and standardized stderr error envelopes.
  - Automation flags `--machine` and `--json` for headless script ingestion.
  - Unicode report tree (`--tree`) and multi-format exporters (CSV, JSON, HTML).
  - External event sinks with retry backoff (`csv`, `webhook`).

### Changed in 1.8.0

- **Version Bump**: Synchronized project version to `1.8.0` across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.
- **Backend Refactoring & Code Quality**:
  - Flattened deeply nested logic in CLI handlers (`task.rs`, `project.rs`, `timelog.rs`), metrics calculations (`range.rs`), and workflow daemons (`daemon.rs`) using guard clauses and dedicated domain dispatchers.
  - Enhanced persistence layers to adhere strictly to SOLID, KISS, and DRY principles without primitive obsession.
- **Test Architecture Reorganization**:
  - Segregated Rust architecture rules into modular files under `src-tauri/tests/architecture/rules/` with unit tests in `src-tauri/tests/architecture/unit/`.

### Fixed in 1.8.0

- **Windows Console Subsystem**: Unified CLI and GUI execution from a single binary via Windows parent console attachment (`AttachConsole`).
- **State Synchronization**: Eliminated state tearing and unnecessary effects in project editing forms via clean React 19 keyed form instances.

---

## [1.6.12] - 2026-10-18

### Added in 1.6.12

- External Webhook / API push synchronization with resilient SQLite outbox queue.
- Interactive CLI drawer (`CliDrawer`) with in-memory sandbox emulator.
- Advanced analytics tab with time distribution breakdown.

### Changed in 1.6.12

- Refactored legacy integration suites to Test Data Builders and Triple Decoupling.
- Improved live timer tick calculation performance via `useLiveTaskElapsed`.

---

## [1.0.0] - 2026-10-01

### Added in 1.0.0

- Initial dual-runtime release of oXyFlow (Tauri native desktop and Web browser).
- MicroORM local SQLite persistence and in-memory fallback.
- Multi-language dictionary localization (6 languages) and accessible theme tokens.
- MPL-2.0 open-source licensing.
