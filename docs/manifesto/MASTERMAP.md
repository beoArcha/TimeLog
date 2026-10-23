# MASTERMAP.md

## oXyFlow — Architecture & Product Roadmap

### 🎯 Vision

Build a lightweight, native-first productivity suite focused on flow, correctness, maintainability, and long-term sustainability.

oXyFlow is built around a **single business domain model** with **multiple runtime implementations** (Native Desktop via Tauri/Rust and Web Browser). Every architectural layer is independently replaceable while exposing a single, consistent contract to the rest of the application.

> For strict coding standards and layer rules, see [`ENGINEERING.md`](./ENGINEERING.md).  
> For UI spatial logic and design tokens, see [`USERINTERFACE.md`](./USERINTERFACE.md).  
> For UX principles, see [`USEREXPERIENCE.md`](./USEREXPERIENCE.md).  
> For CLI architecture, modular engine contracts, and persona operations, see [`CLI.md`](./CLI.md).  
> For AI operational guardrails, see [`../AGENTS.md`](../AGENTS.md).

---

## 🏛 System Architecture (v3)

```text
                         React Frontend (Views & Hooks)
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
                   EngineRouter               PersistenceRouter
                        │                             │
      ══════════════════╪═════════════════════════════╪══════════════════  Runtime Boundary
                        │                             │
           ┌────────────┴────────────┐   ┌────────────┴────────────┐
           ▼                         ▼   ▼                         ▼
    EngineCommands             EnginePlugin             PersistenceCommands   PersistencePlugin
   (Tauri IPC → Rust)        (Browser In-Memory)       (Tauri IPC → SQLite)  (Browser LocalStorage)
           │                         │                             │                  │
           └────────────┬────────────┘                             └────────┬─────────┘
                        ▼                                                   ▼
             Rust Reference Engine                                SQLite / CSV Sinks
        (Timers, Metrics, Validation)                             (Repositories & Cache)
```

### Frontend Spatial Composition

The UI is a deterministic function of four orthogonal dimensions: **`UI = f(runtime, layout, size, theme)`**

```text
                    App Entry (App.tsx)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
          AppTauri                      AppBrowser
   (PlatformCapabilities)        (PlatformCapabilities)
              │                             │
              └──────────────┬──────────────┘
                             ▼
                       LayoutManager
  (AppProviders + data-* state attributes + ThemeRegistry)
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
FullLayoutBuilder   MediumLayoutBuilder   CompactLayoutBuilder
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             ▼
            Composites (@components/*) & Views (@features/*)
                             │
                             ▼
               UI Primitives (@components/ui/*)
```

---

## 🗺 Development Roadmap & Status

### Phase 1 — Foundation ✅ (Completed)

- Dual-runtime abstraction (`EngineRouter`, `PersistenceRouter`)
- Rust reference engine & SQLite repository foundation
- TypeScript bindings generation via `ts-rs` (`src/bindings/`)
- Vitest unit/integration suite & GitHub Actions CI pipeline

### Phase 2 — Frontend Spatial Modernization ✅ (Completed)

- Separation of `AppTauri` and `AppBrowser` entry points with `PlatformCapabilitiesProvider`
- `LayoutManager` orchestration with `FullLayoutBuilder`, `MediumLayoutBuilder`, and `CompactLayoutBuilder`
- Decoupled visual scaling (`TextAndIconSize`: `small`, `medium`, `large`) driven purely by CSS Design Tokens

### Phase 3 — Runtime Contracts & Core Parity ✅ (Completed)

- Contract separation between business logic (`IEngine`) and data storage (`IPersistence`)
- Cross-runtime parity test suite (`CrossRuntimeParity.test.ts`) verifying Rust Engine vs Browser `EnginePlugin`
- CSV Sink implementation (`src-tauri/src/sinks/csv/`) and Native CLI module (`src-tauri/src/cli/`)

### Phase 4 — State Decomposition & Live Metrics ✅ (Completed)

- Context splitting by domain (ISP): `WindowShellContext`, `DataContext`, `SettingsContext`, `LocaleProvider`
- Hook decomposition (`useProjectsManager`, `useTasksManager`, `useTimerManager`, `useDataLifecycle`, `useAsyncActionRunner`)
- Zero-overhead live timer calculation hooks (`useLiveTaskElapsed`, `useLiveProjectElapsed`) reconciling engine snapshots with active ticks

### Phase 5 — Design System, AST Guardrails, a11y & i18n ✅ (Completed)

- Atomic UI Primitives (`src/components/ui/`) & Composite components (`src/components/`)
- Custom AST Architecture test suite (`tests/architecture/`) enforcing 8 structural rules (zero raw HTML primitives, zero inline theme ternaries, circular dependency detection, engine/persistence boundaries, timer calculation rules)
- Theme Dependency Inversion via `ThemeRegistry` (`light`, `dark`, `high-contrast`)
- Full localization across 6 languages (`en`, `pl`, `de`, `es`, `fr`, `pt-br`) with strongly typed keys (`keys.ts`)
- Playwright E2E test suite with Page Object Model (`tests/e2e/`) and Stryker mutation testing setup

---

### Phase 6 — Data Reliability, Engine ISP & Backend Unification ✅ (Completed)

- [x] JSON Backup & Restore UI (`BackupTab.tsx`) with schema validation and toast feedback
- [x] Database Explorer & Audit Trail UI (`DbExplorer.tsx` with `ConfirmDialog` and revision history)
- [x] Full SQLite Migration: `holidays`, `patches`, `config` in native Rust SQLite tables (`src-tauri/`) and frontend persistence commands
- [x] Backend State Override: native `override_state` transactional import command in Rust and `delete_time_log` command
- [x] Engine ISP Decomposition: `IEngine` decomposed into `timer`, `metrics`, `timeLogs`, `validation`, and `IRouter<T>` lifecycle router
- [x] Temporal Edge-Case Calculations: 72h multi-day logs, 48h active logs, 2024 leap year boundary, and 2025/2026 New Year boundary in TypeScript and Rust
- [x] Integration Quality Audit & Refactoring: Triple Decoupling, Test Data Builders (`entity-builders.ts`), BDD naming, E2E backup/restore in Playwright

### Phase 7 — Native Desktop Hardening ✅ (Completed)

- [x] System tray menu, localization, and event handlers (`src-tauri/src/tray/`)
- [x] Window management commands (always-on-top per layout, minimize-to-tray, dynamic resizing)
- [x] Global keyboard shortcuts (`useGlobalShortcuts.ts`)
- [x] IPC payload optimization: Replace full-state `core.load()` calls inside granular `PersistenceCommands` (`rename`, `getProjectId`, `getSubtasks`) with targeted Rust queries
- [x] System sleep / wake auto-pause: Deprecated and removed per KISS/YAGNI point-in-time calculation model
- [x] **Bindings Deduplication**: Consolidated `src-tauri/bindings/` and `src/bindings/` into a single export target (`src/bindings/`) configured via `.cargo/config.toml`

### Phase 8 — Productivity Platform & Ecosystem ✅ (Completed)

- [x] Periodical reports (`ReportView.tsx`) & interactive CLI emulator (`CliInterface.tsx`)
- [x] External Webhook / API push integration (`useExternalApiSync.tsx`) with resilient SQLite outbox queue & retry exponential backoff
- [x] Advanced analytics & graphical time distribution charts (`AnalyticsTab.tsx`, Recharts time distribution, project share pie charts)
- [x] Automated workflow triggers (`WorkflowRouter`, auto-stop hours limit, daily boundary crossing daemon)
- [x] Global CLI Drawer (`CliDrawer`), session synchronization (`CliSessionContext`), in-memory Sandbox Emulator, atomic `switch` command, and BDT & E2E Playwright test coverage

### Phase 9 — Comprehensive Test Quality, Methodology Standardization & Debt Elimination ✅ (Completed)

- [x] **Methodology Standardization**: Unify AAA for Unit, BDD/BDT for Integration, and User Journeys for E2E in `frontend_engineering_standards.md`
- [x] **AST Test Governance**: Implement architectural test forbidding snake_case test names and raw `document.getElementById` DOM access
- [x] **Legacy Integration Modernization**: Refactor 9 legacy suites (`tasks-view`, `reports-view`, `credits-modal`, `active-timer-banner`, `gui-events`, etc.) to builders and Triple Decoupling
- [x] **Cross-Runtime CLI Parity**: Create parity test validating identical syntax, status codes, and outputs between Frontend `CliEngine` and Rust `oxy_flow::cli`
- [x] **Rust Test Data Builders**: Implement `ProjectBuilder`, `TaskBuilder`, `TimeLogBuilder` in `src-tauri/tests/shared/builders/` and eliminate boilerplate struct literals
- [x] **Native CLI Subprocess Tests**: Add automated test exercising compiled binary CLI execution against real SQLite database
- [x] **E2E Terminal Journey**: Add `cli-terminal-workflow.spec.ts` in Playwright and eliminate copywriting locators across all specs
- [x] **CI Quality Gate**: Establish unified `bun run test:quality` validating zero test warnings, 100% Vitest pass, and 100% Cargo test pass

### Phase 10 — Decoupled Native CLI & Modular Subsystems 🚧 (In Progress)

- [x] **CLI Module Boundary**: `src-tauri/src/cli/` has zero Tauri GUI dependencies (enforced by `tauri_isolation_test.rs`) and consumes `Engine` and `Persistence` directly.
- [ ] **CLI Crate Extraction**: Move the CLI into a standalone crate (`crates/oxy-cli`).
- [x] **Dual-Layer Error Architecture**: Namespaced semantic error codes (`CLI_SYNTAX_*`, `DOM_ENTITY_*`, `STO_*`, `ENG_*`), technical English envelopes on `stderr`, localized user messages and semantic exit codes `0`..`5` (`src-tauri/src/cli/error/`).
- [x] **Typed Error Classification**: Derive error codes from typed `CliError` variants instead of matching message text, and emit the codes that are defined but not yet produced (`ENG_TIMER_ACTIVE`, `ENG_TIMER_INACTIVE`, `SNK_EXTERNAL_IO`, `MSK_*`, `CLI_SYNTAX_MISSING_TARGET`, `CLI_SYNTAX_UNKNOWN_COMMAND`, `STO_SQLITE_CONSTRAINT`).
- [x] **Machine & Automated Mode**: `--machine` and `--json` flags with deterministic JSON output.
- [ ] **Machine Locale Config**: `cli_machine_locale` SQLite config key.
- [x] **Power User Reporting**: Hierarchical Unicode report tree (`--tree`) and report exports in HTML, JSON and CSV.
- [ ] **Additional Export Formats**: XML, ODS and XLSX exports.
- [x] **Beginner Interactive Guidance**: Levenshtein "Did you mean?" suggestions, missing-argument prompts in TTY mode, daily summary (`oxy today`, alias `summary`).
- [x] **Sinks & Action Masks Subsystem**: `oxy sink set csv|webhook`, `oxy sink test`, persistent action masks (`oxy mask set`).
- [x] **Dedicated CLI Test Suites**: `src-tauri/tests/unit/cli/`, `src-tauri/tests/integration/cli/`, `tests/unit/features/cli/`, `tests/integration/cli/`, including cross-runtime parity and error envelope tests.

### Phase 11 — Multi-Platform Packaging, Distribution & Documentation Infrastructure ✅ (Completed)

- [x] **End-User Documentation**: Deliver comprehensive illustrated handbook (`docs/manifesto/USER_GUIDE.md`) covering project/task creation, active timer shortcuts, backup/restore, themes, and CLI quick-start.
- [x] **Installation & Trust Guide**: Create `docs/manifesto/INSTALLATION.md` detailing multi-platform steps for Windows (NSIS & Portable), macOS (Universal DMG & Gatekeeper bypass notes), and Linux (AppImage FUSE, DEB, RPM dependencies).
- [x] **Showcase Landing & Release Wiki**: Implement static product showcase in `docs/wiki/` (GitHub Pages compatible Docsify engine) featuring screenshots, architecture highlights, and direct release download buttons; automated via independent release workflow [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml).
- [x] **Cross-Platform Local Build Scripts**: Provide robust, error-checked build scripts (`scripts/build-release.ps1` and `scripts/build-release.sh`) with automated pre-flight quality checks (typecheck, lint, test).
- [x] **Windows CLI Console Attachment**: Fix Windows GUI subsystem console detachment in `src-tauri/src/main.rs` via `AttachConsole(ATTACH_PARENT_PROCESS)`, enabling unified desktop and terminal operation from a single binary.
- [x] **Cryptographic Verification & Checksums**: Automate `SHA256SUMS.txt` generation across all release packages in `.github/workflows/release.yml`.

### Phase 12 — Production Hardening, UX/UI Ergonomics, Defect Remediation & v1.8 GA Release ✅ (Completed)

- [x] **First-Time User Experience (FTUX)**: Welcoming empty state in the project sidebar (`ProjectEmptyState.tsx`) with guided one-click project template generation.
- [x] **Active Timer Concurrency Safeguard**: Atomic cascade stopping and committing active timer logs before project or task archiving/deletion in `useProjectsManager` and `useTasksManager`.
- [x] **UI Ergonomics & Typography Refactoring**: Design System primitives refactor (`Heading`, `Text`, `Caption`, `Overline`, `MonoText`, `MetricText`, `List`, `ListItem`, `CodeBlock`), complete elimination of arbitrary `text-[...px]` and raw `<h1-h6>` elements, accessible landmarks across Compact, Medium, and Full modes.
- [x] **Input Sanitization & Boundary Hardening**: Sanitized extreme inputs (whitespace-only, strings $>255$ characters, special characters) and debounced rapid action invocations.
- [x] **Temporal Calculation Invariants**: Validated multi-day logs and daylight saving shifts against monotonic UTC points-in-time.
- [x] **Official v1.8 GA Signed Open-Source Release**: Full test matrix verified (188 Vitest files, 1116 tests, 56 Rust architecture tests, 182 native Rust tests, 0 ESLint warnings, 0 typecheck errors) under MPL-2.0.

### Phase 13 — React Architecture Refactoring, Design System Unification & Data Integrity ✅ (Completed)

- [x] **Canonical Domain Types & Sizing Scale**: Standardized `UiSize` canonical scale across primitives, unified `AppTabId` (`'tasks' | 'settings' | 'reports' | 'db-explorer'`), replaced loose primitives and duplicated models with strict domain bindings.
- [x] **Polymorphic UI & Design System Primitives**: Refactored primitive controls (`Badge`, `Button`, `Heading`, `Text`, `Caption`, `MonoText`) with polymorphic `as` prop support, zero raw HTML tags outside `src/components/ui/`.
- [x] **Design System Consolidation**: Replaced duplicate presentation controls with canonical composites (`SegmentedControl`, `StatCard`, `Tabs`), completely eliminating manual button grids and hardcoded badge style maps.
- [x] **Component Decomposition & Prop Drill Elimination**: Split task monoliths (`TaskItem`, `SubtaskItem`, `TaskListView`, `Sidebar`) into focused subcomponents, replaced 8-level 19-parameter prop drilling with direct contextual domain managers (`useProjects`, `useTasks`, `useTimer`).
- [x] **Report Subsystem Composition**: Decomposed `ReportsTab` into declarative orchestrators and isolated analytical subviews (`ReportHeader`, `ReportChartsSection`, `ReportTableSection`).
- [x] **Database Explorer Data Integrity & Persistence Boundary**: Migrated all raw database inspection tables to canonical `DataTable<T>`, eliminated direct persistence coupling from presentation layers, and extended `persistence-boundary.rule.ts` architecture testing to strictly safeguard `features/`.
- [x] **Unified Leave Management**: Unified `HolidaysLeavesView` and `HolidaysLeavesTable` into a single shared source of truth.
- [x] **Quality Gate & Coverage Verification**: 100% Vitest pass across 195 test files (1,160 tests), 0 ESLint warnings, 0 typecheck errors, and global test coverage exceeding 87% (all coverage thresholds met).
