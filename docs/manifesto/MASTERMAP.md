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
- [x] **Dual-Layer Error Architecture**: Namespaced semantic error codes (`CLI_SYNTAX_*`, `DOM_ENTITY_*`, `STO_*`, `ENG_*`, `SNK_*`), technical English envelopes on `stderr`, localized user messages and semantic exit codes `0`..`5` (`src-tauri/src/cli/error/`), with pure deterministic single-line JSON envelopes emitted in `--machine` mode with interactive suggestion blocks omitted.
- [x] **Typed Error Classification & Boundary Isolation**: Derive error codes strictly from typed `CliError` and `PersistenceError` variants without string matching or layer leakage; `RepositoryError` strictly encapsulated within persistence.
- [x] **Machine & Automated Mode**: `--machine` and `--json` flags with deterministic JSON output on stdout and structured JSON envelopes on stderr.
- [ ] **Machine Locale Config**: `cli_machine_locale` SQLite config key.
- [x] **Power User Reporting**: Hierarchical Unicode report tree (`--tree`), flexible date ranges (`--from`, `--to`, `-p`, `-t`), and report exports in HTML, JSON and CSV.
- [ ] **Additional Export Formats**: XML, ODS and XLSX exports.
- [x] **Beginner Interactive Guidance**: Levenshtein "Did you mean?" suggestions, missing-argument prompts in TTY mode, daily summary (`oxy today`, alias `summary`).
- [x] **Sinks & Action Masks Subsystem**: `oxy sink set csv|webhook`, `oxy sink test`, persistent action masks (`oxy mask set`, `oxy mask ls`, `oxy mask rm`) with runtime `$1..$9` token substitution.
- [x] **System Diagnostics & Database Tooling**: `oxy doctor` system/schema health verification, `oxy db backup`, `oxy db restore` via SQLite Online Backup API, and explicit database routing (`--db <path>`, `OXY_DB_PATH`).
- [x] **Legacy Code Elimination**: Purged dead legacy modules (`cli/manage/`, `cli/settings/`, `cli/timer/`, `cli/shared/parser.rs`), establishing tiered modular dispatchers.
- [x] **Dedicated CLI Test Suites**: `src-tauri/tests/unit/cli/`, `src-tauri/tests/integration/cli/`, `tests/unit/features/cli/`, `tests/integration/cli/`, including cross-runtime parity and error envelope tests.
- [x] **Frontend CLI Native Delegation & IPC Bridge**: Tauri IPC command `cli_execute` connecting desktop terminal directly to native Rust CLI with reactive `DataContext.refreshData()` GUI synchronization.
- [x] **Cross-Runtime CLI Parity Matrix**: 39 test vectors in `cli-parity-cases.json` executed by both Vitest and Cargo suites verifying identical outputs, exit codes, and error codes across runtimes.
- [x] **Browser Sandbox Noun-Verb Alignment & Modularization**: `SandboxCommandRouter` and `SandboxEmulatorStore` aligned with canonical syntax and decomposed into focused domain handlers and pure operation modules.

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

### Phase 14 — Critical Defect Remediation, Destructive Action Safety & Tiered PR Workflow 🚧 (Planned)

#### Group A (Parallel Track) — Layout & Visual Collision Fixes
- [ ] **Sidebar Action Button Collision Fix**: Restructure [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) bottom row into two independent flex zones (`truncate min-w-0` for date and `flex-shrink-0 gap-1.5` for actions), eliminating button overlap on timer displays and sorting arrows.
- [ ] **Technical Badge Purge**: Remove unnecessary technical `<Badge>MicroORM Tables</Badge>` from [`SidebarHeader.tsx`](../../src/layouts/parts/sidebar/SidebarHeader.tsx).
- [ ] **Creation Date Disambiguation**: Replace ambiguous creation date rendering in [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) with localized formatting via `new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })` to avoid US format confusion.
- [ ] **Copywriting & Label Corrections**: Correct grammatical issues across [`TaskEmptyState.tsx`](../../src/features/tasks/components/TaskEmptyState.tsx), fix banner text in [`ActiveTimerBanner.tsx`](../../src/features/tasks/components/ActiveTimerBanner.tsx) (`AKTYWNY POMIAR`), and refine project edit tooltip to `Edytuj projekt`.

#### Group B (Parallel Track) — Destructive Action Security & ConfirmDialog Guardrails
- [ ] **Footer Database Reset Removal**: Purge the direct destructive reset button (`Skasuj bazę danych (SQL Reset)`) from [`AppFooter.tsx`](../../src/layouts/components/AppFooter.tsx); convert into a safe navigation link to [`SettingsTab.tsx`](../../src/features/settings/SettingsTab.tsx) targeting the destructive operations card (`DestructiveResetCard`) with scoped reset categories (`BUSINESS`, `SETTINGS`, `SYSTEM`).
- [ ] **Task & Subtask Deletion Confirmation**: Introduce modal confirmation using `ConfirmDialog` in [`TaskActions.tsx`](../../src/features/tasks/components/TaskItem/TaskActions.tsx) and [`TaskItem.tsx`](../../src/features/tasks/components/TaskItem/TaskItem.tsx) displaying the count of linked subtasks and warnings for associated time logs before executing deletion.

#### Group C (Parallel Track) — Event-Tiered GitHub Actions PR Workflow & Architecture Checks
- [ ] **PR Verification Workflow**: Create [`.github/workflows/pr-checks.yml`](../../.github/workflows/pr-checks.yml) triggered on `pull_request: types: [opened, synchronize, reopened]`.
- [ ] **Path-Based Change Filtering**: Integrate `dorny/paths-filter@v3` to detect changes across `frontend` (`src/**`, `tests/**`) and `rust` (`src-tauri/**`).
- [ ] **Event-Tiered Test Execution Policy**:
  - **On `opened`**: Run the **entire test suite** for the affected stack group (full frontend Vitest suite if frontend changed, full `cargo test` if Rust changed, or both if both changed).
  - **On `synchronize` and `reopened`**: Execute **selective testing** restricted to changed code and affected dependents via `bun x vitest related --run` or `vitest --changed=origin/${{ github.base_ref }}`.
- [ ] **Three-Variant Architecture Testing Matrix**: Condition architecture tests on changed layers: Variant A (TS only -> `bun test tests/architecture/`), Variant B (Rust only -> `cargo test --test architecture_tests`), or Variant C (both changed -> run both suites concurrently).

---

### Phase 15 — PWA Capabilities Gating, Environmental Purity & Project Lifecycle Form 🚧 (Planned)

#### Group A (Parallel Track) — PWA Capabilities Gating & Runtime Purity
- [ ] **PWA Wording & Storage Abstraction**: Detect runtime environment in [`AppFooter.tsx`](../../src/layouts/components/AppFooter.tsx), [`Header.tsx`](../../src/layouts/components/Header.tsx), and [`TaskItem.tsx`](../../src/features/tasks/components/TaskItem/TaskItem.tsx); display `LocalStorage Engine` instead of `SQLite MicroORM`, `Storage Ready` instead of `SQL Ready`, and `Entity #id` instead of `SQLite table entry`.
- [ ] **Daemon Status & Indicator Gating**: Gate [`StatusIndicator.tsx`](../../src/layouts/components/StatusIndicator.tsx) and [`DaemonStatusBar.tsx`](../../src/layouts/components/DaemonStatusBar.tsx) behind `usePlatformCapabilities()`, showing `PWA READY` or `ONLINE` without desktop daemon connection messages.
- [ ] **Desktop Settings Gating**: Hide Tauri-specific settings in [`EngineConfig.tsx`](../../src/features/settings/components/EngineConfig.tsx) and [`AutomationSettings.tsx`](../../src/features/settings/components/AutomationSettings.tsx) (Autostart, Minimize to Tray, Always on Top, Daemon status row) when running in browser mode.
- [ ] **CLI Drawer Gating**: Hide the CLI tab in [`TabBar.tsx`](../../src/layouts/components/TabBar.tsx) and [`MediumTabBar.tsx`](../../src/layouts/parts/MediumTabBar.tsx) in browser runtimes unless explicit debug mode is enabled (`?debug=1`).

#### Group B (Parallel Track) — Adaptive User Guides & Documentation
- [ ] **Manual Tab PWA Customization**: Conditionally hide desktop C++/Rust compilation guides ([`CompilationGuideCard.tsx`](../../src/features/settings/components/CompilationGuideCard.tsx)) and daemon keyboard shortcuts in [`ManualTab.tsx`](../../src/features/settings/ManualTab.tsx) in browser mode.
- [ ] **Web-First User Guidance**: Add documentation for PWA installation, offline browser storage, and JSON backup/restore flows.

#### Group C (Parallel Track) — Adaptive Sidebar Project Form & Interactive Controls
- [ ] **Two-Tier Form Composition (Basic + Collapsible Drawer)**: Refactor [`SidebarProjectForm.tsx`](../../src/layouts/parts/sidebar/SidebarProjectForm.tsx) into a compact primary row (Project Name, color swatches, Save button, and a Chevron toggle) and an expandable drawer containing advanced options.
- [ ] **Color Palette Paintbrush Picker**: Add an interactive `Paintbrush` icon to the final palette swatch in [`SidebarProjectForm.tsx`](../../src/layouts/parts/sidebar/SidebarProjectForm.tsx) opening an HTML5 native/popover hex color picker.
- [ ] **Lightweight Emoji Picker**: Replace raw text input with a dedicated Base UI popover emoji selector in [`src/components/ui/emoji-picker/`](../../src/components/ui/emoji-picker/).
- [ ] **Smart Tag Suggestion Cloud**: Implement `useAllProjectTags()` hook extracting unique tags across existing projects, rendering clickable chip suggestions below the tag input.

#### Group D (Parallel Track) — Project Deletion vs Archival Lifecycle & Parity
- [ ] **Conditional Project Deletion Invariant**: Restrict project deletion (`Trash2`) in [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) and [`useProjectLifecycle.ts`](../../src/features/tasks/hooks/useProjectLifecycle.ts) to projects with exactly `00:00:00` logged time; enforce `Archive` for projects with logged history (`> 00:00:00`).
- [ ] **Cross-Runtime Lifecycle Parity**: Enforce matching deletion invariants across Rust command `delete_project` in `src-tauri/src/commands/persistence/project.rs` and browser persistence in `src/plugins/implementations/LocalStorageProjectsPersistence.ts`.

---

### Phase 16 — Cross-Runtime Billing Engine, Dynamic Currencies & Rate Inheritance 🚧 (Planned)

#### Group A (Parallel Track) — Cross-Runtime Data Models & Type Generation
- [ ] **Rust Domain Extensions**: Extend `Project` struct with `pub hourly_rate: Option<f64>` and `pub currency: Option<String>` in [`src-tauri/src/types/project.rs`](../../src-tauri/src/types/project.rs); extend `Task` struct with `pub hourly_rate: Option<f64>` in [`src-tauri/src/types/task.rs`](../../src-tauri/src/types/task.rs). Note: currency is maintained strictly at the Project level.
- [ ] **Type Synchronization**: Re-export updated bindings via `ts-rs` into [`src/bindings/Project.ts`](../../src/bindings/Project.ts) and [`src/bindings/Task.ts`](../../src/bindings/Task.ts).
- [ ] **SQLite Repository Migration**: Update table migrations and queries in `src-tauri/src/repositories/business/projects.rs` and `src-tauri/src/repositories/business/tasks.rs` to persist `hourly_rate` and `currency` fields.

#### Group B (Parallel Track) — Dual-Persistence & Zero-Override Rate Resolver Engine
- [ ] **Effective Rate Resolver**: Implement `resolveEffectiveHourlyRate(task, project): number` in [`src/features/reports/utils/billingCalculator.ts`](../../src/features/reports/utils/billingCalculator.ts).
- [ ] **Strict Zero-Override Rate Rule**: Guarantee that explicit `task.hourlyRate === 0` (e.g. non-billable / pro-bono work) evaluates strictly to `0` and never falls back to the parent project's hourly rate.
- [ ] **Default Inheritance Mode**: Treat `null` or `undefined` on task as default inheritance from `project.hourlyRate` (falling back to `0` if undefined).
- [ ] **Browser Storage Persistence**: Update `LocalStorageProjectsPersistence.ts` and `LocalStorageTasksPersistence.ts` to serialize and restore rate and currency properties.

#### Group C (Parallel Track) — Locale-Driven & Custom Currency Project Configuration
- [ ] **Locale-Aware Default Currency**: Automatically determine initial currency defaults based on active application locale (`pl` -> `PLN`, `en` -> `USD` or `GBP`, `de`/`fr`/`es`/`it`/`nl` -> `EUR`, `ja` -> `JPY`, `pt-br` -> `BRL`).
- [ ] **Custom Currency Extension**: Support selection from predefined suggestions (`PLN`, `EUR`, `USD`, `GBP`, `CHF`, `BRL`, `JPY`) plus arbitrary user input of custom currency codes/symbols, appending new values to user's currency selection list.
- [ ] **Project Rate UI**: Integrate hourly rate input and currency controls into [`SidebarProjectForm.tsx`](../../src/layouts/parts/sidebar/SidebarProjectForm.tsx) (advanced drawer) and [`EditProjectDialog.tsx`](../../src/features/projects/components/EditProjectDialog.tsx).
- [ ] **Task Rate Selector & Override Modes**: Integrate rate controls into task item details/popover in [`TaskItem.tsx`](../../src/features/tasks/components/TaskItem/TaskItem.tsx) with three explicit modes: Default (inherit project rate), Custom numeric rate, and Explicit 0 (non-billable / pro-bono).

---

### Phase 17 — Internationalization Architecture, Modular Keys & Multi-Locale MCP Validation 🚧 (Planned)

#### Group A (Parallel Track) — Modular Domain Keys & Type Aggregation
- [ ] **Decomposition of `keys.ts`**: Decompose [`src/common/i18n/keys.ts`](../../src/common/i18n/keys.ts) by extracting domain key union types into dedicated modules under `src/common/i18n/keys/`:
  - `app.ts` (`AppKey`), `calendar.ts` (`CalendarKey`), `cli.ts` (`CliKey`), `common.ts` (`CommonKey`), `database.ts` (`DatabaseKey`), `engine.ts` (`EngineKey`), `help.ts` (`HelpKey`), `project.ts` (`ProjectKey`), `report.ts` (`ReportKey`), `settings.ts` (`SettingsKey`), `task.ts` (`TaskKey`), `timer.ts` (`TimerKey`).
- [ ] **Canonical Type Aggregation**: Retain in `src/common/i18n/keys.ts` solely aggregated re-exports and the canonical `export interface DomainKeys` contract.

#### Group B (Parallel Track) — Extended Locales Integration (`ja`, `nl`, `it`)
- [ ] **Language Selection Modal**: Maintain clean primary quick-select bar while introducing full language selection dialog (`LanguageSelectionModal`) in settings supporting extended locales: Japanese (`ja`), Dutch (`nl`), and Italian (`it`).
- [ ] **Dictionary Schema Generation**: Scaffold matching dictionary json files for new locales across all domain dictionaries (`src/common/i18n/dictionaries/`).

#### Group C (Parallel Track) — Automated Multi-Locale MCP Validation
- [ ] **MCP Chrome Preview Validation**: Execute automated visual regression and translation completeness audits across all locales using Chrome MCP (`preview_*`).
- [ ] **Layout & Boundary Verification**: Verify that labels in German (`de`), Japanese (`ja`), and Dutch (`nl`) do not cause button overflow, text wrapping defects, or clipping across Compact, Medium, and Full layouts.

---

### Phase 18 — Reports Suite Modernization, Financial Analytics & Credits 🚧 (Planned)

#### Group A (Parallel Track) — Localized Date Formats & Chart Refinement
- [ ] **Short Localized Chart Dates**: Refactor XAxis date rendering in [`StackedBarActivityChart.tsx`](../../src/features/reports/components/StackedBarActivityChart.tsx) to format date keys using `new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' })`, producing localized labels (e.g., `czw. 10` in Polish, `Thu 10` in English, `Do. 10` in German).
- [ ] **Date Key Disambiguation**: Replace raw string slicing (`dateKey.slice(5)`) with robust UTC-safe calendar formatting supporting multi-locale switching.

#### Group B (Parallel Track) — Financial KPI Analytics & Revenue Aggregation
- [ ] **Financial Metric Calculation**: Extend [`reportCalculator.ts`](../../src/features/reports/utils/reportCalculator.ts) and [`useReportStatistics.ts`](../../src/features/reports/hooks/useReportStatistics.ts) to compute total period financial value ($\sum \text{durationHours} \times \text{effectiveRate}$).
- [ ] **Financial Revenue StatCard**: Add a primary KPI card for Total Period Value (e.g., `3 450,00 PLN`) into [`ReportStatsCards.tsx`](../../src/features/reports/components/ReportStatsCards.tsx), respecting active project currencies and zero-rate tasks.

#### Group C (Parallel Track) — Report Exploration, Tag Filtering & Inline Auditing
- [ ] **Tag-Based Period Filtering**: Add tag selector chips (`#client`, `#dev`, `#internal`) into [`ReportPeriodSelector.tsx`](../../src/features/reports/components/ReportPeriodSelector.tsx) to filter report datasets across projects and tasks.
- [ ] **Live Text Search Filter**: Add real-time search bar filtering report log rows by task name, project name, or note content.
- [ ] **Inline Log Correction & Deletion**: Add direct note editing, duration correction, and deletion actions within [`ReportLogList.tsx`](../../src/features/reports/components/ReportLogList.tsx) (`PlainDump`) for streamlined time audit maintenance.

#### Group D (Parallel Track) — Print Stylesheet, PWA Title Cleanup & Credits Refresh
- [ ] **Print / PDF Stylesheet**: Implement `@media print` CSS rules formatting [`ReportView.tsx`](../../src/features/reports/ReportView.tsx) into a clean, client-facing PDF document, stripping navigation sidebars, buttons, and decorative badges.
- [ ] **PWA Analytics Badge Cleanup**: Update [`ReportView.tsx`](../../src/features/reports/ReportView.tsx) to display `ANALIZY STATYSTYCZNE` (without `SQL`) when running in browser mode.
- [ ] **Credits & Technology Stack Refresh**: Update [`CreditsModal.tsx`](../../src/layouts/components/CreditsModal.tsx) to incorporate current core dependencies (React 19, @base-ui/react, Tauri v2, Recharts, Sonner, Geist Font Family, Google GenAI) and update author notes regarding Vibe Coding architecture practices.
