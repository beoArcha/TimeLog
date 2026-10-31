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

### Phase 10 — Decoupled Native CLI & Modular Subsystems 🔒 (Closed)

> Closed with open items redistributed: Machine Locale Config → Phase 17 (Group D), Additional Export Formats → Phase 18 (Group E), CLI Crate Extraction → Phase 19 (Group A).

- [x] **CLI Module Boundary**: `src-tauri/src/cli/` has zero Tauri GUI dependencies (enforced by `tauri_isolation_test.rs`) and consumes `Engine` and `Persistence` directly.
- [x] **Dual-Layer Error Architecture**: Namespaced semantic error codes (`CLI_SYNTAX_*`, `DOM_ENTITY_*`, `STO_*`, `ENG_*`, `SNK_*`), technical English envelopes on `stderr`, localized user messages and semantic exit codes `0`..`5` (`src-tauri/src/cli/error/`), with pure deterministic single-line JSON envelopes emitted in `--machine` mode with interactive suggestion blocks omitted.
- [x] **Typed Error Classification & Boundary Isolation**: Derive error codes strictly from typed `CliError` and `PersistenceError` variants without string matching or layer leakage; `RepositoryError` strictly encapsulated within persistence.
- [x] **Machine & Automated Mode**: `--machine` and `--json` flags with deterministic JSON output on stdout and structured JSON envelopes on stderr.
- [x] **Power User Reporting**: Hierarchical Unicode report tree (`--tree`), flexible date ranges (`--from`, `--to`, `-p`, `-t`), and report exports in HTML, JSON and CSV.
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

### Phase 14 — Critical Defect Remediation, Destructive Action Safety & Tiered PR Workflow ✅ (Completed)

#### Group A — Layout & Visual Collision Fixes (PR #6 & PR #9)
- [x] **Internationalization Contracts & Locked Keys**: Lock Phase 14 domain keys in `src/common/i18n/keys.ts` and synchronize 6-locale dictionaries across `app`, `calendar`, `cli`, `common`, `database`, `engine`, `help`, `project`, `report`, `settings`, `task`, and `timer`.
- [x] **Sidebar Action Button Collision Fix**: Restructure [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) bottom row into two independent flex zones (`truncate min-w-0` for date and `flex-shrink-0 gap-1.5` for actions), eliminating button overlap on timer displays and sorting arrows.
- [x] **Technical Badge Purge**: Remove unnecessary technical `<Badge>MicroORM Tables</Badge>` from [`SidebarHeader.tsx`](../../src/layouts/parts/sidebar/SidebarHeader.tsx).
- [x] **Creation Date Disambiguation**: Replace ambiguous creation date rendering in [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) with localized formatting via `new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })` to avoid US format confusion.
- [x] **Copywriting & Label Corrections**: Correct grammatical issues across [`TaskEmptyState.tsx`](../../src/features/tasks/components/TaskEmptyState.tsx), fix banner text in [`ActiveTimerBanner.tsx`](../../src/features/tasks/components/ActiveTimerBanner.tsx) (`AKTYWNY POMIAR`), and refine project edit tooltip to `Edytuj projekt`.

#### Group B — Destructive Action Security & ConfirmDialog Guardrails (PR #7)
- [x] **Footer Database Reset Removal**: Purge the direct destructive reset button (`Skasuj bazę danych (SQL Reset)`) from [`AppFooter.tsx`](../../src/layouts/components/AppFooter.tsx); convert into a safe navigation link to [`SettingsTab.tsx`](../../src/features/settings/SettingsTab.tsx) targeting the destructive operations card (`DestructiveResetCard`) with scoped reset categories (`BUSINESS`, `SETTINGS`, `SYSTEM`).
- [x] **Task & Subtask Deletion Confirmation**: Introduce modal confirmation using `ConfirmDialog` in [`TaskActions.tsx`](../../src/features/tasks/components/TaskItem/TaskActions.tsx) and [`TaskItem.tsx`](../../src/features/tasks/components/TaskItem/TaskItem.tsx) displaying the count of linked subtasks and warnings for associated time logs before executing deletion.
- [x] **User-Visible Error Feedback & Resilience**: Integrate inline error alert (`role="alert"`, `data-testid="confirm-dialog-error"`) inside `ConfirmDialog`, handling asynchronous promise rejections and synchronous exceptions without closing the dialog or locking the action buttons, allowing immediate user retry.

#### Group C — Event-Tiered GitHub Actions PR Workflow & Architecture Checks (PR #8)
- [x] **PR Verification Workflow**: Create [`.github/workflows/pr-checks.yml`](../../.github/workflows/pr-checks.yml) triggered on `pull_request: types: [opened, synchronize, reopened]`.
- [x] **Path-Based Change Filtering**: Integrate `dorny/paths-filter@v3` to detect changes across `frontend` (`src/**`, `tests/**`), `rust` (`src-tauri/**`), and `documentation` (`docs/**`, `*.md`).
- [x] **Event-Tiered Test Execution Policy**:
  - **On `opened`**: Run the **entire test suite** for the affected stack group (full frontend Vitest suite if frontend changed, full `cargo test` if Rust changed, or both if both changed).
  - **On `synchronize` and `reopened`**: Execute **selective testing** restricted to changed code and affected dependents via `bun x vitest related --run` or `vitest --changed=origin/${{ github.base_ref }}`.
  - **Dedicated Documentation Validation**: Isolate docs checks into `check-docs` running `bun run docs:validate`.
- [x] **Three-Variant Architecture Testing Matrix**: Condition architecture tests on changed layers: Variant A (TS only -> `bun test tests/architecture/`), Variant B (Rust only -> `cargo test --test architecture_tests`), or Variant C (both changed -> run both suites concurrently), completing with unified `pr-gate` check.

---

### Phase 15 — PWA Capabilities Gating, Environmental Purity & Project Lifecycle Form ✅ (Completed)

#### Group A (Parallel Track) — PWA Capabilities Gating & Runtime Purity
- [x] **PWA Wording & Storage Abstraction**: Detect runtime environment in [`AppFooter.tsx`](../../src/layouts/components/AppFooter.tsx), [`Header.tsx`](../../src/layouts/components/Header.tsx), and [`TaskItem.tsx`](../../src/features/tasks/components/TaskItem/TaskItem.tsx); display `LocalStorage Engine` instead of `SQLite MicroORM`, `Storage Ready` instead of `SQL Ready`, and `Entity #id` instead of `SQLite table entry`.
- [x] **Daemon Status & Indicator Gating**: Gate [`StatusIndicator.tsx`](../../src/layouts/components/StatusIndicator.tsx) and [`DaemonStatusBar.tsx`](../../src/layouts/components/DaemonStatusBar.tsx) behind `usePlatformCapabilities()`, showing `PWA READY` or `ONLINE` without desktop daemon connection messages.
- [x] **Desktop Settings Gating**: Hide Tauri-specific settings in [`EngineConfig.tsx`](../../src/features/settings/components/EngineConfig.tsx) and [`AutomationSettings.tsx`](../../src/features/settings/components/AutomationSettings.tsx) (Autostart, Minimize to Tray, Always on Top, Daemon status row) when running in browser mode.
- [x] **CLI Drawer Gating**: Hide the CLI tab in [`TabBar.tsx`](../../src/layouts/components/TabBar.tsx) and [`MediumTabBar.tsx`](../../src/layouts/parts/MediumTabBar.tsx) in browser runtimes unless explicit debug mode is enabled (`?debug=1`).

#### Group B (Parallel Track) — Adaptive User Guides & Documentation
- [x] **Manual Tab PWA Customization**: Conditionally hide desktop C++/Rust compilation guides ([`CompilationGuideCard.tsx`](../../src/features/settings/components/CompilationGuideCard.tsx)) and daemon keyboard shortcuts in [`ManualTab.tsx`](../../src/features/settings/ManualTab.tsx) in browser mode.
- [x] **Web-First User Guidance**: Add documentation for PWA installation, offline browser storage, and JSON backup/restore flows.

#### Group C (Parallel Track) — Adaptive Sidebar Project Form & Interactive Controls
- [x] **Two-Tier Form Composition (Basic + Collapsible Drawer)**: Refactor [`SidebarProjectForm.tsx`](../../src/layouts/parts/sidebar/SidebarProjectForm.tsx) into a compact primary row (Project Name, color swatches, Save button, and a Chevron toggle) and an expandable drawer containing advanced options.
- [x] **Color Palette Paintbrush Picker**: Add an interactive `Paintbrush` icon to the final palette swatch in [`SidebarProjectForm.tsx`](../../src/layouts/parts/sidebar/SidebarProjectForm.tsx) opening an HTML5 native/popover hex color picker.
- [x] **Lightweight Emoji Picker**: Replace raw text input with a dedicated Base UI popover emoji selector in [`src/components/ui/emoji-picker/`](../../src/components/ui/emoji-picker/).
- [x] **Smart Tag Suggestion Cloud**: Implement `useAllProjectTags()` hook extracting unique tags across existing projects, rendering clickable chip suggestions below the tag input.

#### Group D (Parallel Track) — Project Deletion vs Archival Lifecycle & Parity
- [x] **Conditional Project Deletion Invariant**: Restrict project deletion (`Trash2`) in [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) and [`useProjectLifecycle.ts`](../../src/features/tasks/hooks/useProjectLifecycle.ts) to projects with exactly `00:00:00` logged time; enforce `Archive` for projects with logged history (`> 00:00:00`).
- [x] **Cross-Runtime Lifecycle Parity**: Enforce matching deletion invariants across Rust command `delete_project` in `src-tauri/src/commands/persistence/project.rs` and browser persistence in `src/plugins/implementations/LocalStorageProjectsPersistence.ts`.

---

### Phase 16 — Cross-Runtime Billing Engine, Dynamic Currencies & Rate Inheritance 🚧 (In Progress)

#### Group A — Rust Backend & Native Persistence
- [x] **Billing Domain Models**: Extend the Project and Task domain models with billing configuration, preserving the distinction between an unset task rate (inheritance) and an explicit zero rate.
- [x] **SQLite Repositories**: Extend Project and Task repositories to persist, update, retrieve, and map billing configuration through their existing CRUD operations.
- [x] **Database Migrations**: Introduce versioned, backward-compatible SQLite migrations for billing fields, preserving existing user data and supporting safe upgrades from previous schema versions.
- [x] **Native Billing Engine**: Implement the Rust Billing domain for effective-rate resolution and billing calculations, keeping business rules out of repositories and command handlers.
- [x] **Native Integration**: Expose the required Billing Engine and persistence capabilities through the existing Tauri command and runtime architecture.
- [x] **Type Bindings**: Synchronize Rust domain contracts with the generated TypeScript bindings via `ts-rs`.

#### Group B — PWA Backend & Plugins
- [x] **Browser Persistence**: Extend the Project and Task Persistence plugins to store and restore billing configuration in LocalStorage.
- [x] **LocalStorage Migrations**: Introduce versioned, backward-compatible migrations for existing browser data, preserving records that predate billing configuration.
- [x] **Browser Billing Engine**: Implement the Browser Billing Engine with the same domain behavior and calculation rules as the native Rust implementation.
- [x] **Shared Contracts & Routing**: Extend the common Engine contracts and `EngineRouter` to expose the Billing domain consistently across Browser and Tauri runtimes.
- [x] **Plugin Integration**: Register and integrate the Billing Engine and Persistence capabilities through the existing plugin architecture without moving business rules into plugins.
- [x] **Cross-Runtime Parity**: Verify that equivalent billing inputs produce equivalent domain results in Browser and Tauri implementations.

#### Group C — React Frontend & Billing UI
- [x] **Project Billing Configuration**: Provide Project-level hourly rate and currency configuration in project creation and editing flows.
- [x] **Task Rate Configuration**: Provide explicit task rate modes: inherit the Project rate, use a custom rate, or set an explicit zero rate.
- [x] **Currency Selection**: Provide locale-informed currency suggestions, predefined currency options, and support for custom currency configuration while keeping currency identity separate from its display symbol.
- [x] **Billing Presentation**: Integrate Billing Engine results into Reports and relevant application views, including appropriate currency-aware formatting.
- [x] **Presentation Boundary**: Keep billing calculations, rate inheritance, and other billing business rules inside the Engine; React remains responsible for configuration and presentation.
- [x] **Frontend Verification**: Cover Project and Task configuration, inheritance states, validation, and report presentation with component and integration tests.

#### Group D — CLI & Billing Operations
- [x] **CLI Billing Configuration**: Extend the native CLI and Browser CLI implementation to inspect and manage Project and Task billing configuration.
- [x] **Rate Operations**: Support setting and clearing Project and Task rates, configuring Project currency, inheriting the Project rate, and explicitly setting a zero rate.
- [ ] **Billing Reports**: Provide CLI operations for calculating and reporting billing values for supported Projects, Tasks, and time ranges.
- [x] **Machine-Readable Output**: Support stable structured output for automation while preserving the existing CLI output and error conventions.
- [x] **Shared Domain Logic**: Reuse the Billing Engine contracts and implementations; CLI handlers must not duplicate rate resolution or billing calculations.
- [x] **CLI Parity**: Extend the existing CLI parity suite to verify consistent syntax, results, and error behavior across native and Browser CLI runtimes.
- [ ] **Billing Reports**: Add billing-aware CLI report calculations and output; the existing CLI report handler currently reports elapsed-time metrics rather than `calculate_range_billing()` results.

#### Phase 16 Completion Criteria
- [x] Billing configuration is persisted and restored correctly by both SQLite and LocalStorage implementations.
- [x] Existing user data is preserved and upgraded through backward-compatible, versioned migrations.
- [x] Native and Browser Billing Engines implement the same rate inheritance, explicit-zero, currency, and calculation rules.
- [x] React consumes Billing capabilities through the existing routers and contains no duplicated billing business logic.
- [ ] Native and Browser CLI implementations expose consistent billing operations and machine-readable results, including billing-specific report operations.
- [ ] Relevant unit, repository, migration, integration, cross-runtime parity, frontend, and CLI tests pass.

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

#### Group D (Parallel Track) — Machine Locale Config (moved from Phase 10)
- [ ] **Machine Locale Config**: `cli_machine_locale` SQLite config key, so CLI machine output stays locale-independent.

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

#### Group E (Parallel Track) — Additional Export Formats (moved from Phase 10)
- [ ] **Additional Export Formats**: XML, ODS and XLSX exports.

---

### Phase 19 — Engine Parity, CLI Modularity & Structural Hygiene 🚧 (Planned)

Architecture debt identified by reviewing the codebase at `62877c4`. Each group is an architecture change and must be approved separately from feature work (see `AGENTS.md`, Refactoring scope).

#### Group A (Parallel Track) — CLI Crate Extraction (moved from Phase 10)
- [ ] **CLI Crate Extraction**: Move the CLI into a standalone crate (`crates/oxy-cli`).

#### Group B (Parallel Track) — Engine Parity: Validation
- [ ] **Native Validation via IPC**: `TauriValidationEngine` currently delegates to the browser implementation in `@plugins/engine/validation`. Route validation through `src-tauri/src/engine/validation.rs` via Tauri commands and confirm the cross-runtime parity matrix covers it.

#### Group C (Parallel Track) — Sandbox Delegation to Engine
- [ ] **Sandbox Engine Delegation**: `sandboxTimerOps`, `sandboxTaskOps`, `sandboxProjectOps` and `sandboxMetricsCalculator.ts` re-implement timer and metrics logic. Delegate to `IEngine` so each runtime keeps a single implementation.

#### Group D (Parallel Track) — Structural Hygiene
- [ ] **File Length Decomposition**: Split files above ~300 LOC: `DataTableViewer.tsx` (758), `ActiveTimerBanner.tsx` (377), `useTauriWindow.ts` (315), `MediumProjectSelector.tsx` (313), `sandboxEmulatorStore.ts` (307), and Rust `cli/handlers/log_handler.rs` (581), `task_handler.rs` (517), `flow_handler.rs` (487), `report_handler.rs` (400), `resolver/entity_resolver.rs` (361), `error/cli_error.rs` (356).
- [ ] **Production unwrap Removal**: Replace the six `.unwrap()` calls in production Rust code (`app/builder.rs`, `engine/metrics/computed.rs`, `workflows/daemon.rs`, `cli/resolver/prompter.rs`, `cli/resolver/entity_resolver.rs`) with typed error handling.

#### Group E (Parallel Track) — Webhook Dispatch Verification
- [ ] **Single Webhook Dispatch Path**: Confirm whether `src/common/sinks/WebhookDispatcher.ts` and `src-tauri/src/sinks/` both dispatch in the desktop runtime. Keep one path and document it in `ENGINEERING.md`.
