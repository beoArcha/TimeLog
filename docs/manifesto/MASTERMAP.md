# MASTERMAP.md

## oXyFlow — Architecture & Product Roadmap

### 🎯 Vision

Build a lightweight, native-first productivity suite focused on flow, correctness, maintainability, and long-term sustainability.

oXyFlow is built around a **single business domain model** with **multiple runtime implementations** (Native Desktop via Tauri/Rust and Web Browser). Every architectural layer is independently replaceable while exposing a single, consistent contract to the rest of the application.

> For strict coding standards and layer rules, see [`ENGINEERING.md`](./ENGINEERING.md).  
> For UI spatial logic and design tokens, see [`USERINTERFACE.md`](./USERINTERFACE.md).  
> For UX principles, see [`USEREXPERIENCE.md`](./USEREXPERIENCE.md).  
> For CLI architecture, modular engine contracts, and persona operations, see [`CLI.md`](./CLI.md).  
> For AI operational guardrails, see [`../../AGENTS.md`](../../AGENTS.md).

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
- [x] **Cross-Runtime CLI Parity**: Create parity test validating identical syntax, status codes, and outputs between Frontend `CliEngine` and Rust `oxyflow_timelog::cli`
- [x] **Rust Test Data Builders**: Implement `ProjectBuilder`, `TaskBuilder`, `TimeLogBuilder` in `src-tauri/tests/shared/builders/` and eliminate boilerplate struct literals
- [x] **Native CLI Subprocess Tests**: Add automated test exercising compiled binary CLI execution against real SQLite database
- [x] **E2E Terminal Journey**: Add `cli-terminal-workflow.spec.ts` in Playwright and eliminate copywriting locators across all specs
- [x] **CI Quality Gate**: Establish unified `bun run test:quality` validating zero test warnings, 100% Vitest pass, and 100% Cargo test pass

### Phase 10 — Decoupled Native CLI & Modular Subsystems 🔒 (Closed)

> Closed with open items redistributed: Machine Locale Config → Phase 17 (Group D), Additional Export Formats → Phase 18 (Group E), CLI Crate Extraction → Phase 28 (Group A).

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

#### Group D — Shared Form Fields, Semantic Layouts & UI Pattern Consolidation
- [x] **Shared Project Field Components**: Consolidate project name, emoji, color, description, tags, billing rates, and concurrency controls in ProjectFormFields, reused by project creation and editing surfaces.
- [x] **Semantic Layout Primitives**: Adopt Area, HStack, VStack, and InlineCluster for consistent semantic structure and flex composition in application layouts.
- [x] **Theme-Independent Layout Contracts**: Remove unused theme props from layout components and orchestration; keep theme selection in the theme registry and presentation tokens.
- [x] **Reusable Status and Empty-State Patterns**: Standardize empty states, status indicators, and icon containers; base animated drawer behavior on the accessible Base UI Dialog lifecycle.
- [x] **Database Explorer Composition**: Remove redundant table rendering and support toggling the active table selection to return to the domain overview.
- [x] **Localized Runtime Status**: Replace hardcoded connection and daemon status labels with translation keys synchronized across all six supported locales.

### Phase 14 — Critical Defect Remediation, Destructive Action Safety & Tiered PR Workflow ✅ (Completed)

#### Group A — Layout & Visual Collision Fixes (PR #6 & PR #9)
- [x] **Internationalization Contracts & Locked Keys**: Lock Phase 14 domain keys in `src/common/i18n/keys.ts` and synchronize 6-locale dictionaries across `app`, `calendar`, `cli`, `common`, `database`, `engine`, `help`, `project`, `report`, `settings`, `task`, and `timer`.
- [x] **Sidebar Action Button Collision Fix**: Restructure [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) bottom row into two independent flex zones (`truncate min-w-0` for date and `flex-shrink-0 gap-1.5` for actions), eliminating button overlap on timer displays and sorting arrows.
- [x] **Technical Badge Purge**: Remove unnecessary technical `<Badge>MicroORM Tables</Badge>` from [`SidebarHeader.tsx`](../../src/layouts/parts/sidebar/SidebarHeader.tsx).
- [x] **Creation Date Disambiguation**: Replace ambiguous creation date rendering in [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) with localized formatting via `new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })` to avoid US format confusion.
- [x] **Copywriting & Label Corrections**: Correct grammatical issues across [`TaskEmptyState.tsx`](../../src/features/tasks/components/TaskEmptyState.tsx), fix banner text in [`ActiveTimerBanner.tsx`](../../src/layouts/parts/ActiveTimerBanner.tsx) (`AKTYWNY POMIAR`), and refine project edit tooltip to `Edytuj projekt`.

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
- [x] **Daemon Status & Indicator Gating**: Gate [`StatusIndicator.tsx`](../../src/layouts/components/header-parts/StatusIndicator.tsx) and [`DaemonStatusBar.tsx`](../../src/layouts/components/DaemonStatusBar.tsx) behind `usePlatformCapabilities()`, showing `PWA READY` or `ONLINE` without desktop daemon connection messages.
- [x] **Desktop Settings Gating**: Hide Tauri-specific settings in [`EngineConfig.tsx`](../../src/features/settings/components/EngineConfig.tsx) and [`AutomationSettings.tsx`](../../src/features/settings/components/AutomationSettings.tsx) (Autostart, Minimize to Tray, Always on Top, Daemon status row) when running in browser mode.
- [x] **CLI Drawer Gating**: Hide the CLI tab in [`TabBar.tsx`](../../src/layouts/components/TabBar.tsx) and [`MediumTabBar.tsx`](../../src/layouts/parts/MediumTabBar.tsx) in browser runtimes unless explicit debug mode is enabled (`?debug=1`).

#### Group B (Parallel Track) — Adaptive User Guides & Documentation
- [x] **Manual Tab PWA Customization**: Conditionally hide desktop C++/Rust compilation guides ([`CompilationGuideCard.tsx`](../../src/features/settings/components/CompilationGuideCard.tsx)) and daemon keyboard shortcuts in [`ManualTab.tsx`](../../src/features/settings/ManualTab.tsx) in browser mode.
- [x] **Web-First User Guidance**: Add documentation for PWA installation, offline browser storage, and JSON backup/restore flows.

#### Group C (Parallel Track) — Adaptive Sidebar Project Form & Interactive Controls
- [x] **Two-Tier Form Composition (Basic + Collapsible Drawer)**: Refactor [`SidebarProjectForm.tsx`](../../src/layouts/parts/sidebar/SidebarProjectForm.tsx) into a compact primary row (Project Name, color swatches, Save button, and a Chevron toggle) and an expandable drawer containing advanced options.
- [x] **Color Palette Paintbrush Picker**: Add an interactive `Paintbrush` icon to the final palette swatch in [`SidebarProjectForm.tsx`](../../src/layouts/parts/sidebar/SidebarProjectForm.tsx) opening an HTML5 native/popover hex color picker.
- [x] **Lightweight Emoji Picker**: Replace raw text input with a dedicated Base UI popover emoji selector in [`src/components/ui/emoji-picker/`](../../src/components/EmojiPicker/).
- [x] **Smart Tag Suggestion Cloud**: Implement `useAllProjectTags()` hook extracting unique tags across existing projects, rendering clickable chip suggestions below the tag input.

#### Group D (Parallel Track) — Project Deletion vs Archival Lifecycle & Parity
- [x] **Conditional Project Deletion Invariant**: Restrict project deletion (`Trash2`) in [`SidebarProjectItem.tsx`](../../src/layouts/parts/sidebar/SidebarProjectItem.tsx) and [`useProjectLifecycle.ts`](../../src/features/tasks/hooks/useProjectLifecycle.ts) to projects with exactly `00:00:00` logged time; enforce `Archive` for projects with logged history (`> 00:00:00`).
- [x] **Cross-Runtime Lifecycle Parity**: Enforce matching deletion invariants across Rust command `delete_project` in `src-tauri/src/commands/persistence/project.rs` and browser persistence in `src/plugins/implementations/LocalStorageProjectsPersistence.ts`.

---

### Phase 16 — Cross-Runtime Billing Engine, Dynamic Currencies & Rate Inheritance 🔒 (Closed)

> Closed with open item redistributed: CLI Billing Reports → Phase 22 (Group C).

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
- [x] **Machine-Readable Output**: Support stable structured output for automation while preserving the existing CLI output and error conventions.
- [x] **Shared Domain Logic**: Reuse the Billing Engine contracts and implementations; CLI handlers must not duplicate rate resolution or billing calculations.
- [x] **CLI Parity**: Extend the existing CLI parity suite to verify consistent syntax, results, and error behavior across native and Browser CLI runtimes.

#### Phase 16 Completion Criteria
- [x] Billing configuration is persisted and restored correctly by both SQLite and LocalStorage implementations.
- [x] Existing user data is preserved and upgraded through backward-compatible, versioned migrations.
- [x] Native and Browser Billing Engines implement the same rate inheritance, explicit-zero, currency, and calculation rules.
- [x] React consumes Billing capabilities through the existing routers and contains no duplicated billing business logic.
- [x] Native and Browser CLI implementations expose consistent billing operations and machine-readable mutation results.
- [x] Relevant unit, repository, migration, integration, cross-runtime parity, frontend, and CLI tests pass.

### Phase 17 — Internationalization Architecture, Modular Keys & Multi-Locale MCP Validation 🔒 (Closed)

#### Group A (Parallel Track) — Modular Domain Keys & Type Aggregation
- [x] **Decomposition of `keys.ts`**: Decompose [`src/common/i18n/keys.ts`](../../src/common/i18n/keys.ts) by extracting domain key union types into dedicated modules under `src/common/i18n/keys/`:
  - `app.ts` (`AppKey`), `calendar.ts` (`CalendarKey`), `cli.ts` (`CliKey`), `common.ts` (`CommonKey`), `database.ts` (`DatabaseKey`), `engine.ts` (`EngineKey`), `help.ts` (`HelpKey`), `project.ts` (`ProjectKey`), `report.ts` (`ReportKey`), `settings.ts` (`SettingsKey`), `task.ts` (`TaskKey`), `timer.ts` (`TimerKey`).
- [x] **Canonical Type Aggregation**: Retain in `src/common/i18n/keys.ts` solely aggregated re-exports and the canonical `export interface DomainKeys` contract.

#### Group B (Parallel Track) — Extended Locales Integration (`ja`, `nl`, `it`)
- [x] **Language Selection Modal & Custom Overrides**: Introduced accessible language selection dialog (`LanguageSelectionModal`) with Base UI `RadioGroup`, quick-select buttons, active system resolution badges, and custom translation overrides editor (`CustomTranslationsEditor`) supporting extended locales: Japanese (`ja`), Dutch (`nl`), Italian (`it`), and complete Ukrainian (`uk`).
- [x] **Dictionary Schema Generation & Quality Guardrails**: Added complete dictionary JSON files across all 12 domain dictionaries (`src/common/i18n/dictionaries/`) with automated `I18nQualityRule` tests enforcing 100% key and placeholder parity across all 10 locales.

#### Group C (Parallel Track) — Automated Multi-Locale MCP Validation
- [x] **MCP Chrome Preview Validation**: Execute automated visual regression and translation completeness audits across all locales using Chrome MCP (`preview_*`).
- [x] **Layout & Boundary Verification**: Verify that labels in German (`de`), Japanese (`ja`), and Dutch (`nl`) do not cause button overflow, text wrapping defects, or clipping across Compact, Medium, and Full layouts.

#### Group D (Parallel Track) — Machine Locale Config (moved from Phase 10)
- [x] **Machine Locale Config**: Persistent `cli_machine_locale` SQLite config key (`oxy config set/get cli_machine_locale`) and centralized error envelope resolution, ensuring CLI machine output stays deterministic in English by default.

---

### Phase 18 — Reports Suite Modernization, Financial Analytics & Credits 🔒 (Closed)

#### Group A (Parallel Track) — Localized Date Formats & Chart Refinement
- [x] **Short Localized Chart Dates**: Refactor XAxis date rendering in [`StackedBarActivityChart.tsx`](../../src/features/reports/components/StackedBarActivityChart.tsx) to format date keys using `new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' })`, producing localized labels (e.g., `czw. 10` in Polish, `Thu 10` in English, `Do. 10` in German).
- [x] **Date Key Disambiguation**: Replace raw string slicing (`dateKey.slice(5)`) with robust UTC-safe calendar formatting supporting multi-locale switching.

#### Group B (Parallel Track) — Financial KPI Analytics & Revenue Aggregation
- [x] **Financial Metric Calculation**: Extend [`reportCalculator.ts`](../../src/features/reports/utils/reportCalculator.ts) and [`useReportStatistics.ts`](../../src/features/reports/hooks/useReportStatistics.ts) to compute total period financial value ($\sum \text{durationHours} \times \text{effectiveRate}$).
- [x] **Financial Revenue StatCard**: Add a primary KPI card for Total Period Value (e.g., `3 450,00 PLN`) into [`ReportStatsCards.tsx`](../../src/features/reports/components/ReportStatsCards.tsx), respecting active project currencies and zero-rate tasks.

#### Group C (Parallel Track) — Report Exploration, Tag Filtering & Inline Auditing
- [x] **Tag-Based Period Filtering**: Add tag selector chips (`#client`, `#dev`, `#internal`) into [`ReportPeriodSelector.tsx`](../../src/features/reports/components/ReportPeriodSelector.tsx) to filter report datasets across projects and tasks.
- [x] **Live Text Search Filter**: Add real-time search bar filtering report log rows by task name, project name, or note content.
- [x] **Inline Log Correction & Deletion**: Add direct note editing, duration correction, and deletion actions within [`ReportLogList.tsx`](../../src/features/reports/components/ReportLogList.tsx) (`PlainDump`) for streamlined time audit maintenance.

#### Group D (Parallel Track) — Print Stylesheet, PWA Title Cleanup & Credits Refresh
- [x] **Print / PDF Stylesheet**: Implement `@media print` CSS rules formatting [`ReportView.tsx`](../../src/features/reports/ReportView.tsx) into a clean, client-facing PDF document, stripping navigation sidebars, buttons, and decorative badges.
- [x] **PWA Analytics Badge Cleanup**: Update [`ReportView.tsx`](../../src/features/reports/ReportView.tsx) to display `ANALIZY STATYSTYCZNE` (without `SQL`) when running in browser mode.
- [x] **Credits & Technology Stack Refresh**: Update [`CreditsModal.tsx`](../../src/layouts/components/CreditsModal.tsx) to incorporate current core dependencies (React 19, @base-ui/react, Tauri v2, Recharts, Sonner, Geist Font Family, Google GenAI) and update author notes regarding Vibe Coding architecture practices.

#### Group E (Parallel Track) — Additional Export Formats (moved from Phase 10)
- [x] **Additional Export Formats**: XML, ODS and XLSX exports.

---

### v1.16 Program — CLI Reports, Machine Contract & Export Formats (Phases 19–27)

**Goal:** One canonical, versioned report model built by the Engine in both runtimes, a stable machine contract for every `--json` / `--machine` command, and data plus human report formats that are pure projections of that model.

The phases follow the logical order of the work, not strictly the delivery order: a few items were delivered ahead of their phase (marked *delivered early*) and a few were moved to a later phase where they share code with it (marked *moved*). Phase 24 can run in parallel with Phases 20–23.

**Release gate (`1.16.0`):** Phases 19–27 complete; a pre-release audit of the report and envelope contracts; `CLI.md`, `ENGINEERING.md`, `README.md`, the user guide, the wiki and `CHANGELOG.md` updated; version bumped to `1.16.0` through `metadata.json`.

---

### Phase 19 — CLI Correctness ✅ (Completed)

**Goal:** Fix incorrect and script-hostile CLI behavior without changing the report model.

#### Group A — Periods & Timezones
- [x] **Timezone-Aware Periods**: Shared `--tz` and period presets (`--today`, `--yesterday`, `--week`, `--last-week`, `--month`, `--last-month`, `--from`/`--to`) for `log ls`, `report` and `today`, resolved by the Engine on the local calendar of an IANA timezone in both runtimes (Monday weeks, half-open ranges, mutually exclusive period flags).

#### Group B — Predictable Commands for Scripts
- [x] **No Silent Truncation**: Machine-mode `log ls` returns every match; human mode shows a footer with the hidden count.
- [x] **Idempotent Timer Commands**: `start` on a running task is a no-op that reports the state; `stop --if-running` succeeds on an idle timer.
- [x] **Parser Errors in the Error Envelope**: clap syntax errors use the `stderr` error envelope and exit code `2` in machine mode.
- [x] **Quiet Mode Contract**: `-q` prints only identifiers for mutations (including `start`, `switch` and `log rm`) and bare rows for lists. `-q` for `report` and exports is *moved* to Phase 22 (Group A).
- [x] **Confirmed Log Removal**: `log rm` asks in an interactive terminal; `--yes`, non-TTY and machine mode skip the prompt; machine output returns the removed entry.
- [ ] **Export to stdout & Ordering**: `report -o -` and deterministic export ordering, *moved* to Phase 22 (Group A) because both live in the exporter registry.

**Phase Gate:** Parity fixtures and `CLI.md` updated; the manual session from the CLI analysis runs without the correctness findings it reported.

---

### Phase 20 — Canonical Report Model in the Engine 🚧 (In Progress)

**Depends on:** Phase 19 (Group A).
**Goal:** The Engine builds one versioned `ReportDocument`; the CLI, exporters and the browser only project it.

#### Group A — Contract & Rust Builder
- [x] **`ReportDocument` v2 Contract**: Versioned report types (`oxy.report`, `schemaVersion: 2`) generated into `src/bindings/`, with integer `shareBasisPoints`, task-less entries and flattened subtasks of any depth.
- [x] **Rust Report Builder**: `Engine::build_report` with clamped entries, flattened task tree, half-to-even shares, per-task billing with banker's rounding, per-currency totals and per-local-day totals.
- [x] **CLI Report via Engine**: `oxy report` computes its figures with `Engine::build_report` through a temporary adapter to the legacy output shapes.

#### Group B — Browser Mirror & Guardrails
- [x] **Browser Mirror & Parity**: `buildReportAt` in `src/common/engine/reports/` and `EnginePlugin.buildReport`, verified byte-for-byte against Rust-generated shared vectors.
- [x] **Exporter Isolation Guardrails**: Architecture tests keep exporters free of storage and engine imports in Rust and TypeScript.
- [ ] **Billing Rounding Coverage**: Boundary assertions for banker's rounding in the browser billing utilities, where mutation testing reports surviving mutants.

#### Group C — Phase Gate Item
- [x] **`oxy report --json` Emits `ReportDocument`**: `oxy report --json` prints the `oxy.report` v2 envelope. The legacy tree adapter remains only for the table view and the formats not yet ported to `ReportDocument` (Phase 22, Group B).

**Phase Gate:** `oxy report --json` returns `ReportDocument` v2, and the browser engine produces an identical document for the same fixture.

---

### Phase 21 — CLI Machine Contract ✅ (Completed)

**Depends on:** Phase 20 (Group A) type conventions.
**Goal:** Every `--json` / `--machine` command prints a versioned envelope, and errors carry structured, script-usable details.

#### Group A — Success Envelope
- [x] **Versioned Success Envelope**: `{ schema, schemaVersion, data, meta }` with camelCase keys for flow (`start`, `stop`, `switch`, `status`), entity (`project`, `task`, `log`) and subsystem (`config`, `sink`, `mask`, `doctor`, `db`) commands, mirrored in the sandbox emulator. `sink ls` reports `hasToken` instead of the stored token.
- [x] **Richer `status` / `today` / Dashboard**: `status` lists active timers with task and project names, start and elapsed time; `today` returns an `oxy.today` envelope built on `ReportDocument`; the dashboard prints an `oxy.dashboard` envelope whose totals come from the same document.

#### Group B — Errors & Schemas
- [x] **Structured Error Details**: `details` (`candidates`, `suggestion`, `field`, `value`) in the error envelope, also in machine mode and in the sandbox emulator.
- [x] **Published JSON Schema**: `oxy report schema` prints a `schemars`-generated JSON Schema of `oxy.report` v2 and of the envelope; committed copies are drift-tested. The XML variant (`--format xml`) follows with XSD v2 in Phase 22.

#### Group C — Contract Verification
- [x] **Envelope Contract Test**: One test on the real binary runs every implemented `--json` command and checks the envelope shape and a clean `stderr`. `report` joins it in Phase 22.

**Phase Gate:** The contract test passes for every `--json` command and the JSON Schema is published.

---

### Phase 22 — Data Exporters v2 🚧 (Planned)

**Depends on:** Phase 20, Phase 21 (Group A).
**Goal:** Every data format is a pure projection of `ReportDocument`, selected through one registry.

#### Group A — Registry & Flags
- [x] **Exporter Registry & Flags**: `--format`, `--variant` (`full`, `summary`) and `-o` are in place, and the registry declares each format's group, supported variants, binary output and locale dependence; the `report export` and `report tree` subcommands are folded into `report`. `--lang` follows with the localized formats.
- [x] **Export to stdout & Ordering** (*moved* from Phase 19): `report -o -` writes to stdout, and export ordering is deterministic.
- [x] **Quiet `report`** (*moved* from Phase 19): `-q` prints the totals line for the table and only the path for `-o <path>`.
- [x] **`report --json` on `ReportDocument`**: Closes Phase 20 and adds `report` to the envelope contract test.

#### Group B — Formats
- [ ] **JSON & JSONL**: JSON is the serialized `ReportDocument`; JSONL starts with a header line followed by one line per entry.
- [ ] **CSV**: Flat, BI-friendly table (one header row, repeated project and task names, local date and UTC timestamps in separate columns), with `--csv-delimiter` and `--bom` options for Excel and formula-injection protection.
- [ ] **XML & XSD v2**: New XSD in `schemas/xml/report/v2/` with a `variant` attribute; `oxy report schema --format xml` returns it. XML v1 export leaves the CLI; the v1 XSD stays for the browser until Phase 26.
- [ ] **XLSX**: Summary sheet with a native pie chart; the full variant adds Entries (autofilter) and Days (bar chart) sheets, with durations as `[h]:mm` numeric cells.
- [ ] **ODS**: OpenDocument spreadsheet with the same sheet structure.
- [ ] **TOML**: Conditional on the format decision recorded in the CLI reports plan.

#### Group C — Billing & Consistency
- [ ] **CLI Billing View** (*moved* from the former Phase 19, Group F): `ReportDocument` already carries per-task rates and amounts plus per-currency totals with cross-runtime parity; expose them in the summary variant and table output, without a second billing calculation.
- [ ] **Cross-Format Consistency Test**: Every data format yields the same totals, entry count and per-project sums for one fixture.

**Phase Gate:** The cross-format consistency test passes.

---

### Phase 23 — Human-Readable Reports 🚧 (Planned)

**Depends on:** Phase 20, Phase 22 (Group A).
**Goal:** Client-ready reports in the user's language, generated from the same document as the data formats.

#### Group A — Shared Translations in Rust
- [ ] **Rust Translator over Shared Dictionaries**: The native CLI reads the 10-locale dictionaries in `src/common/i18n/dictionaries/`, with a completeness test for every key used in Rust.

#### Group B — Layout & Formats
- [ ] **Shared Report Layout & SVG Charts**: One layout model and a generated SVG chart set, keys added to the `report` domain in all 10 locales.
- [ ] **Markdown**, **Print-Ready HTML**, **DOCX** and **ODT** (ODT conditional on the format decision recorded in the CLI reports plan).
- [ ] **Entries & Notes Switches**: `--entries` and `--no-notes` for the human formats.

**Phase Gate:** Golden tests pass, and the files open in Word and LibreOffice without warnings (manual check).

---

### Phase 24 — Terminal Output 🚧 (In Progress)

**Depends on:** Phase 19. Can run in parallel with Phases 20–23.

#### Group A — Rendering
- [x] **Table Renderer & Decoration Detection**: Shared table renderer, human duration format, TTY and `NO_COLOR` detection.

#### Group B — Messages & Help
- [ ] **Flow Messages**: Consistent `start` / `stop` / `status` messages, short IDs and no decorative symbols in lists.
- [ ] **Lists & Help**: `project ls` with rates, help with examples and separated global flags.

---

### Phase 25 — Pipeline Readiness 🚧 (In Progress)

**Depends on:** Phase 19, Phase 22.
**Goal:** Reports can be generated unattended and consumed by other programs.

#### Group A — Safe Inputs
- [x] **No Silent Database Creation** (*delivered early* with Phase 19): An explicit `--db` path must exist.
- [x] **Strict Machine Resolution** (*delivered early* with Phase 19): Machine mode and `--exact` resolve targets only by exact ID, a unique ID prefix of at least 8 characters or an exact name.

#### Group B — Deterministic Outputs
- [ ] **Empty Period Output**: A correct, well-formed result for an empty period in every format.
- [ ] **Content Hash & Export Metadata**: Deterministic output with a `contentHash`, and export metadata on stdout when writing to a file.
- [ ] **Predictable File Names**: `--output-dir` with documented file names.
- [ ] **Pipeline Documentation**: A "reports in pipelines" guide and a column dictionary.

**Phase Gate:** The pipeline contract test passes on the real binary without a TTY and with stdin closed.

---

### Phase 26 — Browser Export Parity 🚧 (Planned)

**Depends on:** Phase 20 (Group B), Phase 22, Phase 23.

#### Group A — Exporters on the Shared Model
- [ ] **TypeScript Exporters on `ReportDocument`**: Browser exporters consume the generated bindings instead of their own report shapes.
- [ ] **Missing Formats or Documented Differences**: Add the formats the browser lacks, or list the intended differences in `CLI.md`.

---

### Phase 27 — Terminal & Error Localization 🚧 (Planned)

**Depends on:** Phase 23 (Group A), Phase 24.

#### Group A — Localized Output
- [ ] **Localized Terminal Messages**: Lists, confirmations and the dashboard read their text from the `cli` domain.
- [ ] **Localized Error User Layer**: A genuinely localized `user` layer in the error envelope; `cli_machine_locale` is removed or merged with `cli_locale`.
- [ ] **clap Help Decision**: Decide whether clap help is translated, and document it.

**Phase Gate:** `oxy --lang pl` prints Polish messages for humans, while `--json` stdout is byte-identical for `--lang pl` and `--lang en`.

---

### Phase 28 — Engine Parity, CLI Modularity & Structural Hygiene 🚧 (Planned)

Architecture debt identified by reviewing the codebase at `62877c4`. Each group is an architecture change and must be approved separately from feature work (see `AGENTS.md`, Refactoring scope).

#### Group A (Parallel Track) — CLI Crate Extraction (moved from Phase 10)
- [ ] **CLI Crate Extraction**: Move the CLI into a standalone crate (`crates/oxy-cli`).

#### Group B (Parallel Track) — Engine Parity: Validation
- [ ] **Native Validation via IPC**: `TauriValidationEngine` currently delegates to the browser implementation in `@plugins/engine/validation`. Route validation through `src-tauri/src/engine/validation.rs` via Tauri commands and confirm the cross-runtime parity matrix covers it.

#### Group C (Parallel Track) — Sandbox Delegation to Engine
- [ ] **Sandbox Engine Delegation**: `sandboxTimerOps`, `sandboxTaskOps`, `sandboxProjectOps` and `sandboxMetricsCalculator.ts` re-implement timer and metrics logic. Delegate to `IEngine` so each runtime keeps a single implementation. The v1.16 program (Phases 19–27) added further sandbox mirrors (envelopes, quiet output, `log rm`, period flags, error details) and a browser report engine (`EnginePlugin.buildReport`) that this delegation should reuse; until then, new sandbox copies are limited to what the parity matrix requires.

#### Group D (Parallel Track) — Structural Hygiene
- [ ] **File Length Decomposition**: Split files above ~300 LOC: `DataTableViewer.tsx` (758), `ActiveTimerBanner.tsx` (376), `useTauriWindow.ts` (315), `MediumProjectSelector.tsx` (303), `sandboxEmulatorStore.ts` (344), and Rust `error/cli_error.rs` (404), `resolver/entity_resolver.rs` (382). Done for the CLI handlers: `task_handler`, `flow_handler` and `log_handler` are directory modules with files of at most ~210 lines, and `report_handler.rs` dropped to 142 lines after Phase 20 moved report figures into the Engine; `task_handler::handle` (~77 lines) still exceeds the thin-dispatcher guideline.
- [ ] **Production unwrap Removal**: Replace the six `.unwrap()` calls in production Rust code (`app/builder.rs`, `engine/metrics/computed.rs`, `workflows/daemon.rs`, `cli/resolver/prompter.rs`, `cli/resolver/entity_resolver.rs`) with typed error handling.

#### Group E (Parallel Track) — Webhook Dispatch Verification
- [ ] **Single Webhook Dispatch Path**: Audit the TypeScript WebhookDispatcher, native Tauri/CLI sink paths and Browser queue adapters. Select one logical dispatch contract and document runtime-specific adapters in ENGINEERING.md; Phase 33 must build on this decision rather than introduce a second dispatcher.

---

### Phase 29 — Native CLI → Desktop Reactive State Propagation 🚧 (Planned)

**Goal:** Changes made by an external oxy CLI process become visible immediately in every relevant Tauri window, without polling and without coupling the CLI to Tauri GUI APIs.

#### Group A — Outbound Event Contract & IPC Transport
- [ ] **Typed State-Change Contract**: Define a versioned, typed notification contract for successful CLI operations. Include the operation/source, affected entity types and IDs, and a revision or equivalent ordering information where available. Treat notifications as state invalidation signals, not as authoritative copies of application state.
- [ ] **CLI → Desktop IPC**: Add an outbound IPC client for the standalone CLI and a receiver owned by the Tauri runtime. Select the transport after checking the existing runtime and platform constraints; preserve the CLI's strict isolation from Tauri GUI types (tauri_isolation_test.rs).
- [ ] **Commit-Before-Notify Semantics**: Publish a notification only after the corresponding persistence transaction succeeds. Failed operations and rolled-back transactions must never produce success notifications.
- [ ] **Shared Operation Path**: Keep CLI, in-app terminal and GUI actions on the existing native Engine / command path. Where an operation is exposed through more than one interface, reuse the same operation implementation rather than creating CLI-specific or GUI-specific business logic.
- [ ] **Local IPC Safeguards**: Restrict the local endpoint to the current user/session, validate incoming messages, handle unavailable or restarting GUI instances, and avoid exposing arbitrary command execution through the notification channel.

#### Group B — Reactive Tauri → React Synchronization
- [ ] **Tauri Event Forwarding**: Translate accepted IPC notifications into typed Tauri events and deliver them to all relevant windows, including the main window and Compact Timer.
- [ ] **React State Refresh**: Subscribe through the runtime-specific integration and refresh the affected data using the existing data lifecycle (DataContext / targeted refresh mechanisms). Do not make event payloads a second source of truth.
- [ ] **In-App CLI Alignment**: Align the existing cli_execute → DataContext.refreshData() flow with the same state-change semantics, avoiding duplicate refreshes or parallel event systems.
- [ ] **Delivery Resilience**: Handle duplicate, delayed and missed notifications safely. Reconcile from persisted state after reconnect/startup; do not rely on event delivery as durable storage.
- [ ] **SQLite Watcher Boundary**: Keep database/WAL observation, if needed, as a narrowly scoped recovery mechanism rather than the primary application event bus.

#### Group C — Verification & Architecture Guardrails
- [ ] **IPC Contract Tests**: Cover serialization, validation, unsupported versions, malformed messages, unavailable receivers and transport failures.
- [ ] **Process Integration Tests**: Execute the compiled oxy process against a temporary database while the Tauri-side receiver is active; verify that a committed change reaches the GUI and a failed operation does not.
- [ ] **Multi-Window E2E**: Verify synchronization in the main window and Compact Timer, including timer start/stop/switch and project/task changes.
- [ ] **Architecture Tests**: Enforce that CLI, Engine and Persistence remain free of Tauri GUI dependencies and that notifications are emitted only from the appropriate post-commit boundary.
- [ ] **Error & Logging Coverage**: Use the existing typed error contracts and currently supported diagnostics; distinguish expected operational failures from infrastructure failures. Phase 32 later standardizes native Rust handling and logging without blocking this phase. Never silently discard an error.

**Phase Gate:** An external CLI operation updates the running Desktop UI reactively; CLI behavior remains correct when Desktop is closed or IPC is unavailable; all relevant tests and architecture rules pass.

---

### Phase 30 — Native MCP for CLI & Desktop + Generated Contracts 🚧 (Planned)

**Depends on:** Phase 29.  
**Goal:** Expose the native TimeLog capabilities to AI agents through one consistent MCP interface, usable with the standalone CLI and the Desktop runtime, without duplicating business logic.

#### Group A — Canonical MCP Contracts & TypeScript Bindings
- [ ] **MCP Contract Source of Truth**: Define typed MCP tool inputs, outputs, resource payloads and error envelopes in the native contract layer. Keep contracts separate from Engine and Persistence implementation details.
- [ ] **Generated TypeScript Bindings**: Export the contract types into src/bindings/ using the existing ts-rs binding pipeline. Generated files are never edited manually.
- [ ] **JSON Schema Generation**: Generate JSON Schemas for MCP inputs and outputs from the same contract definitions (e.g. via schemars), so Rust and TypeScript adapters do not maintain separate handwritten schemas. Started in Phase 21: the `schemars` generator already produces the committed schemas of `oxy.report` v2 and the CLI envelope (`schemas/json/`) with a drift test; MCP contracts extend the same pipeline.
- [ ] **Build & CI Integration**: Extend the existing binding-generation workflow to produce and verify MCP contract artifacts. CI must fail when generated bindings/schemas are stale or differ from the committed output.
- [ ] **Contract Compatibility Tests**: Verify required/optional fields, enum values, nullability, serialization and schema compatibility across Rust and TypeScript.

#### Group B — Native MCP Server & CLI Entry Point
- [ ] **MCP Server Lifecycle**: Add an oxy mcp entry point using the native Rust MCP SDK (e.g. rmcp) and stdio transport, with clean separation between protocol handling and application operations.
- [ ] **Tool Surface**: Expose a deliberately small set of typed, atomic operations for timer/session control, project/task management and reporting. Finalize exact tool names and parameters during discovery against the existing CLI and Engine contracts.
- [ ] **Read-Only Resources**: Expose useful contextual resources (for example, active session/state and project/task structure) without leaking persistence internals.
- [ ] **Shared Execution Path**: MCP tools must invoke the same native operations used by oxy CLI and Desktop commands. Do not implement a second timer/task engine, shell out to arbitrary CLI strings, or expose a generic raw-command execution tool.
- [ ] **Typed MCP Errors**: Map existing typed CLI, Engine and Persistence failures into stable MCP error categories and structured messages. Preserve the distinction between invalid user actions, missing entities, business conflicts and infrastructure failures.
- [ ] **Observability**: Log tool invocation outcomes and unexpected failures with operation/source context; never swallow errors or return raw internal error details as the public contract.

#### Group C — Desktop Compatibility, Safety & Verification
- [ ] **Desktop State Propagation**: When an MCP operation changes native state while Desktop is running, reuse the Phase 29 notification path so all relevant windows refresh through the normal React data lifecycle.
- [ ] **Local Access & Safeguards**: Define local process access, tool permissions and confirmation requirements for destructive or historical-data operations. Reuse existing Time Safeguards; do not let MCP bypass them.
- [ ] **Protocol Tests**: Cover MCP initialization, stdio request/response flow, tool discovery/calls, resources, malformed arguments, unsupported methods and graceful shutdown.
- [ ] **Behavioral Parity**: Verify that equivalent CLI, MCP and Desktop operations produce the same persisted state and domain outcomes.
- [ ] **Failure-Path Tests**: Verify typed error mapping, logging, transaction rollback and absence of success notifications after failed operations.
- [ ] **Documentation & Agent Setup**: Document oxy mcp invocation, supported tools/resources, permissions, configuration examples and troubleshooting in the CLI/MCP documentation.

**Phase Gate:** An external MCP client can discover and invoke the supported native tools with Desktop either open or closed; Desktop reflects successful changes reactively; generated contracts are current and all protocol, parity, security and error-path tests pass.

---

### Phase 31 — PWA WebMCP Adapter & Browser Agent Integration 🚧 (Planned)

**Depends on:** Phase 30 contract definitions.  
**Goal:** Expose the supported TimeLog capabilities to browser-context AI agents from PWA, using TypeScript and the Browser runtime. No Rust runtime or native stdio server is required in PWA.

#### Group A — Browser Adapter & Runtime Integration
- [ ] **PWA MCP Adapter**: Implement a TypeScript adapter in the Browser runtime that exposes the canonical MCP tool semantics through the supported WebMCP browser API (e.g. navigator.modelContext, subject to browser/API availability).
- [ ] **Capability Detection**: Feature-detect WebMCP support and register tools only when the browser provides the required capability. Unsupported browsers must retain normal PWA behavior without startup failures.
- [ ] **Browser Application Path**: Route tool calls through the existing Browser Engine / Persistence implementations and their established application operations. Do not import Rust/Tauri modules or access LocalStorage directly from the adapter when an existing router/plugin API owns the operation.
- [ ] **Generated Contract Reuse**: Consume the generated src/bindings/ types and generated JSON Schemas from Phase 30. Avoid independently maintained tool definitions, payload types or error codes.

#### Group B — Tool Parity, Permissions & State Consistency
- [ ] **Supported Tool Parity**: Expose the same semantic operations as native MCP wherever the Browser runtime supports them. Document intentional capability differences rather than silently changing tool behavior.
- [ ] **Typed Browser Errors**: Map Browser Engine and Persistence failures to the canonical MCP error contract; log unexpected failures and never return unhandled/raw exceptions to the agent.
- [ ] **Permission & Confirmation Rules**: Apply the same safety policy for destructive actions and historical data changes. Use browser-appropriate user confirmation where required; an agent must not silently bypass user-facing safeguards.
- [ ] **Reactive PWA Updates**: Ensure tool calls update the same React state/data lifecycle as normal PWA actions, without duplicate state stores or manual component-level mutations.
- [ ] **No Native Transport Assumption**: WebMCP serves agents operating in the browser context. A remote/desktop MCP client connecting to a PWA tab is a separate bridge/transport concern and is explicitly out of scope unless approved as a follow-up.

#### Group C — Browser Verification & Documentation
- [ ] **Contract Conformance Tests**: Run shared contract vectors against native MCP and the PWA adapter to verify tool names, schemas, outputs and error semantics.
- [ ] **Browser Capability Tests**: Verify registration when WebMCP is available, graceful degradation when unavailable, and no Rust/Tauri dependency leakage into Browser bundles.
- [ ] **PWA E2E Journeys**: Verify read and write tool calls, confirmation flows, persisted state and reactive UI updates in supported browser environments.
- [ ] **Documentation**: Document browser requirements, supported tools, capability limitations, permission behavior and the distinction between WebMCP and the native oxy mcp stdio server.

**Phase Gate:** PWA exposes the agreed tool contract through WebMCP when supported, uses only Browser runtime operations, degrades safely when unsupported, and passes shared contract-conformance and browser E2E tests.


---

### Phase 32 — Centralized Rust Error Handling & Diagnostic Logging 🚧 (Planned)

**Depends on:** Existing typed error contracts and CLI error envelopes from Phase 10. Phases 29–31 may proceed using the current mechanisms; this phase standardizes and consolidates them.  
**Runtime scope:** Native Rust, Tauri Desktop and standalone oxy CLI. Browser/PWA keeps browser-native diagnostics and shared error semantics; it must not depend on Rust file logging.

**Goal:** Establish consistent native error handling and diagnostic logging so failures are classified, handled, reported and never silently discarded.

#### Group A — Error Model & Handling Policy
- [ ] **Error Taxonomy Audit**: Audit error definitions, propagation and handling across Engine, Persistence, Repositories, CLI, Tauri commands, workflows and sinks. Record existing typed contracts before changing them.
- [ ] **Canonical Classification**: Define stable categories and severity policy for domain, validation, configuration, persistence, network, infrastructure, unexpected and critical failures. Reuse existing CLI/MCP-facing semantics where possible; do not create competing taxonomies.
- [ ] **Typed Error Completeness**: Replace ambiguous string-only variants such as generic Storage(String) or OperationFailed(String) where they prevent reliable classification, while preserving useful source errors and context.
- [ ] **Central Handling Policy**: Separate error creation, propagation, handling, user notification and diagnostic reporting. Do not turn expected domain outcomes into infrastructure errors or collapse typed errors into generic strings.
- [ ] **Boundary Mapping**: Preserve stable typed semantics across Rust → Tauri IPC, CLI machine envelopes and frontend-facing contracts. Keep CLI exit codes and machine-readable output backward-compatible unless a separately approved migration is required. Phase 21 performed one approved migration to the versioned success envelope; later machine-output changes are signalled through `schemaVersion`.
- [ ] **No Silent Error Loss**: Audit ignored Result values and discarded failures. Classify each intentional best-effort operation explicitly; all other failures must be handled or propagated. Prefer compiler/linter enforcement where sufficient over broad custom AST rules.
- [ ] **Existing Guardrail Alignment**: Extend current architecture/error tests to detect genuinely untyped error variants and broken mappings; do not duplicate checks already enforced by error_handling_test.rs.

#### Group B — Native Diagnostic Logging
- [ ] **Logging Backend Selection**: Select a Rust logging/tracing backend compatible with the existing Tauri isolation constraints and standalone CLI. Do not adopt a Tauri plugin unless tauri_isolation_test and CLI isolation remain green.
- [ ] **Structured Logs**: Write structured JSONL diagnostic records with UTC timestamp, level, component, operation, error category, process/runtime identity and correlation identifiers where available.
- [ ] **Severity Policy**: Support TRACE, DEBUG, INFO, WARN and ERROR, with an explicit critical/fatal classification field where required. Define production defaults and configurable verbosity.
- [ ] **Process-Safe Output**: Avoid unsafe concurrent rotation when Desktop and CLI run simultaneously. Use per-process files or a verified single-writer/locking strategy; document retention and collection behavior.
- [ ] **Machine Mode Isolation**: Never write diagnostic log text to stdout or stderr in --machine/--json modes where those streams carry protocol output. Keep machine envelopes deterministic.
- [ ] **Privacy & Redaction**: Redact JWTs, credentials, authorization headers and sensitive payloads. Prefer stable entity IDs over project/task names; define field-level redaction rules before logging arbitrary event payloads.
- [ ] **Rotation & Retention**: Bound file size, total storage and retention. Logging failure must not recursively invoke the same failing logger or destabilize core application operations.
- [ ] **Ad Hoc Diagnostic Export**: Allow users to export a diagnostic bundle with relevant logs and safe environment metadata, excluding secrets and unnecessary personal/domain data.

#### Group C — Verification & Migration
- [ ] **Legacy Secret Exposure Audit**: Identify existing secret-bearing settings and queued headers so redaction covers historical diagnostic paths as well as new logs. Secret storage migration itself is coordinated with Phase 34.
- [ ] **Error Path Tests**: Verify classification, propagation, boundary mapping, user-facing handling and logging for expected, unexpected, infrastructure and critical failures.
- [ ] **Logging Concurrency Tests**: Verify simultaneous Desktop/CLI operation, rotation, process restart, disk-full and unavailable-log-directory behavior.
- [ ] **Static Enforcement**: Add only targeted Clippy/configuration and architecture checks for ignored must-use results, production unwraps and unapproved generic error representations.
- [ ] **Runtime Scope Tests**: Verify native logging does not leak into Browser bundles and machine-mode output remains protocol-clean.

**Phase Gate:** Native failures follow a consistent typed handling strategy; important failures are handled and diagnostically recorded without leaking secrets; logs are bounded, process-safe and exportable; CLI machine output and Tauri isolation remain intact.

---

### Phase 33 — Transactional Event Journal & Sink Reliability 🚧 (Planned)

**Depends on:** Phase 32 error/logging policies and Phase 28 Group E (single logical webhook dispatch path).  
**Runtime scope:** SQLite-backed Native/Tauri and standalone CLI are authoritative for the native event journal. Browser/PWA must retain its own runtime boundary and must not pretend LocalStorage is transactionally equivalent to the native SQLite outbox.

**Goal:** Replace best-effort audit emission with a durable, replayable domain-event foundation. Domain mutations and their event records must commit atomically; CSV/JSONL and remote delivery are projections/adapters, not independent sources of truth.

#### Group A — Existing Persistence & Sink Audit
- [ ] **Persistence Transaction Audit**: Map every domain write path and identify the actual SQLite connection/transaction boundaries. Verify whether repositories currently share a transaction; introduce an explicit transaction/unit-of-work boundary where required.
- [ ] **CSV Gap Analysis**: Record the current CSV limitations: best-effort emission, ignored sink errors, incomplete event coverage and absence of replayable payloads. Treat existing per-project CSV files as legacy projections, not as a durable event source.
- [ ] **Webhook Path Consolidation**: Complete the Phase 28 dispatch-path decision across TypeScript, Tauri, Browser and CLI. Retain runtime-specific transport adapters only where required; do not maintain competing delivery queues or policies for the same runtime.
- [ ] **Configuration & Status Alignment**: Align sink configuration, enablement, delivery status and diagnostics across GUI, CLI, Tauri and Browser without bypassing their runtime boundaries.
- [ ] **Failure Semantics**: A sink outage must not roll back an already committed domain mutation, but it must not erase the durable event or its pending delivery state.

#### Group B — Atomic Domain Event Outbox & Journal
- [ ] **Transactional Event Write**: Persist the domain mutation and its canonical event record in the same SQLite transaction. Refactor repository APIs around a shared transaction/unit of work if separate connections currently prevent atomicity.
- [ ] **Durable Event Source**: Establish an append-only SQLite domain-event journal as the canonical native event history. The transactional outbox/dispatch state must be recoverable from these committed records; CSV and JSONL are derived projections.
- [ ] **Canonical Event Envelope**: Define a versioned envelope containing at minimum event_id, schema_version, stream_id, origin_device_id, device_sequence, timestamp_utc, entity_type, entity_id, action, replayable payload, correlation_id, causation_id, previous_hash and hash.
- [ ] **Device Identity & Sequence**: Define stable device identity lifecycle and allocate monotonically increasing sequence numbers per device stream transactionally. Do not assume a single global sequence across independently operating devices.
- [ ] **Complete Domain Coverage**: Cover Project, Task, Subtask and the complete TimeLog lifecycle, including create/start/stop/edit/correction/delete/archive and relationship changes. Verify every mutation path emits exactly the intended event.
- [ ] **Deterministic Payloads**: Include sufficient before/after or complete domain data to reconstruct state deterministically. Define event semantics for patches, deletions, archival, moves and relationship changes.
- [ ] **Canonical Serialization**: Specify deterministic serialization and hash input independently of CSV formatting, field order or line endings. Version the canonicalization rules together with the event schema.
- [ ] **Per-Device Hash Chains**: Maintain a separate ordered hash chain per device stream. Validate sequence continuity and previous-hash linkage within each stream; do not force unrelated devices into one linear chain.
- [ ] **Tamper-Evidence Boundaries**: Document that SHA-256 chains detect alteration only relative to a trusted checkpoint. Define a future-compatible external checkpoint/anchor strategy (for example, signed or remotely retained chain-head checkpoints); do not describe an unanchored hash chain as immutable.
- [ ] **Schema Evolution**: Define compatibility rules and migration policy for event schema versions before events are exchanged between devices.

#### Group C — Dispatch, Projections & Recovery
- [ ] **Transactional Dispatch State**: Track per-sink delivery state separately from immutable event content, including pending, delivered, retryable failure and dead-letter states. Ensure a crash cannot lose a committed event or falsely mark it delivered.
- [ ] **Single Dispatcher Contract**: Dispatch committed events through the logical path selected in Phase 28, with adapters for supported runtimes. Define ownership, concurrency control and restart recovery.
- [ ] **CSV Projection**: Serialize the canonical envelope and replayable payload to CSV while preserving compatibility/migration behavior for existing timelog_<project_id>.csv files. Decide and document whether new exports remain per-project projections or include a global journal export.
- [ ] **Idempotency & Retry**: Use stable event_id values as idempotency keys; retry delivery safely and document at-least-once delivery semantics and receiver requirements.
- [ ] **Audit Replay**: Provide a read-only operation-history view from validated journal records, distinct from state reconstruction.
- [ ] **State Replay**: Support controlled reconstruction into a separate target/database or verified recovery copy. Never replay over the only known-good database without an explicit recovery plan.
- [ ] **Projection Rebuild**: Rebuild CSV and delivery state from validated canonical journal records; report events that cannot be projected or delivered.

#### Group D — Validation & Verification
- [ ] **Journal Validator**: Detect missing records, per-device sequence gaps, duplicate IDs, invalid hashes, broken previous-hash links, unsupported schema versions and incomplete payloads.
- [ ] **Atomicity Tests**: Prove that domain mutation and journal append either both commit or both roll back, including injected failures at every transaction boundary.
- [ ] **Crash Recovery Tests**: Simulate process termination after commit and before dispatch, during projection write and during delivery; verify no committed event disappears.
- [ ] **Replay Tests**: Verify deterministic audit ordering per stream and state reconstruction against known database fixtures.
- [ ] **Migration Tests**: Cover legacy CSV files, old webhook queues and event schema upgrades without silently dropping records or credentials.
- [ ] **Cross-Runtime & Concurrency Tests**: Verify native CLI/Desktop dispatch ownership, Browser adapter boundaries, multiple windows/processes and duplicate dispatch prevention.

**Phase Gate:** Every supported native domain mutation and its event record commit atomically; the SQLite journal is the durable source of truth; per-device streams validate and replay; CSV is a rebuildable projection; interrupted delivery is recoverable without losing committed domain events.

---

### Phase 34 — Sink Expansion & Secure Remote Delivery 🚧 (Planned)

**Depends on:** Phase 33 canonical event envelope, journal and dispatch contract.  
**Runtime scope:** Shared event and delivery semantics across Native/Tauri, CLI and Browser; native HTTP transport for Desktop/CLI and browser fetch transport for PWA. Browser proxy support is out of scope because it is controlled by the browser environment.

**Goal:** Extend the established sink system with JSONL and secure remote delivery without creating a second webhook dispatcher or duplicating retry/queue semantics.

#### Group A — JSONL Projection
- [ ] **JSONL Serialization**: Implement JSON Lines as a projection of the Phase 33 canonical event envelope.
- [ ] **Semantic Parity**: Ensure CSV and JSONL represent the same canonical events and preserve equivalent identity, schema, ordering and replay semantics.
- [ ] **Integrity Verification**: Include per-device sequence and hash metadata and verify each stream independently.
- [ ] **Import & Export**: Support controlled import/export with schema validation, integrity verification and explicit duplicate/conflict handling.

#### Group B — Unified Remote Delivery
- [ ] **Webhook Evolution**: Extend the existing webhook integration through the Phase 28/33 logical dispatcher contract. Do not add an independent Remote API queue, retry engine or delivery-status model.
- [ ] **Transport Adapters**: Implement a native HTTP(S) adapter for Tauri/CLI and a Browser fetch adapter for PWA. Keep shared request semantics, event identity and error classification; document Browser CORS and capability restrictions.
- [ ] **JWT Authentication**: Support manually configured bearer credentials without embedding secrets in event payloads or ordinary queue headers.
- [ ] **Secure Credential Storage**: Define a platform-specific credential provider. Use OS-backed secure storage where available; do not claim Browser LocalStorage is secure credential storage.
- [ ] **Existing Secret Migration**: Migrate or invalidate existing plaintext webhook tokens in cli_sinks.config and secret-bearing queued headers. Remove secret copies from queue records; if safe migration is impossible, require re-authentication and explain the consequence. Phase 21 already stopped `oxy sink ls --machine` from printing the token (it reports `hasToken`); storage migration remains here.
- [ ] **Proxy Support**: Support system and explicit proxy configuration only in native transports where technically available. Clearly report that Browser proxy behavior is browser-managed and cannot be configured by the application.
- [ ] **Transport Security**: Require HTTPS for remote credentials, validate TLS certificates and define timeout/response-size limits.
- [ ] **Connection Configuration**: Support endpoint, timeout, authentication reference and connection-test settings without exposing credentials in diagnostics.
- [ ] **Response Classification**: Distinguish authentication/authorization failures, permanent 4xx responses, rate limiting (429 and Retry-After) and transient server/network failures.
- [ ] **Retry & Idempotency**: Use bounded exponential backoff, honor Retry-After, and send stable event IDs so receiving systems can deduplicate at-least-once delivery.

#### Group C — Delivery Operations & Verification
- [ ] **Unified Delivery State**: Expose pending, delivered, retryable, failed and dead-letter states through the shared delivery contract.
- [ ] **Dead Letter Handling**: Preserve permanently failed or exhausted events for inspection and controlled reprocessing; never delete the canonical journal record because delivery failed.
- [ ] **Manual Retry & Replay**: Allow selected deliveries to be inspected and retried without creating a new domain event.
- [ ] **Diagnostics**: Expose endpoint health, last successful delivery, queue age, pending count and sanitized failure reasons.
- [ ] **Security Tests**: Verify token redaction, credential migration, secure storage adapters, TLS validation and absence of secrets in logs/queue exports.
- [ ] **Transport Tests**: Verify native proxy behavior, Browser CORS handling, timeouts, 401/403, permanent 4xx, 429, 5xx, network loss and duplicate receiver handling.

**Phase Gate:** CSV, JSONL and remote delivery share one event and dispatch contract; native and Browser transports respect their capabilities; credentials are not stored in plaintext queue/config records; failures remain inspectable and recoverable.

---

### Phase 35 — Google Drive Backup Provider 🚧 (Planned)

**Depends on:** Existing Phase 10 oxy db backup / oxy db restore and SQLite Online Backup API. This phase does not depend on event sourcing or multi-device synchronization.  
**Runtime scope:** Native/Tauri and standalone CLI. Browser/PWA cloud backup behavior is explicitly out of scope unless separately designed and approved.

**Goal:** Add Google Drive as a remote destination for existing verified backup artifacts, reusing current SQLite-aware snapshot and restore mechanisms rather than introducing a second backup engine.

#### Group A — Provider Discovery & Authentication
- [ ] **OAuth Architecture Discovery**: Decide OAuth application ownership, consent-screen/verification implications, supported account types and distribution model for this MPL-2.0 open-source application.
- [ ] **Least-Privilege Scope Selection**: Compare drive.file and app-data options against required user-visible folder selection, backup discovery and restore workflows. Select the minimum scope that satisfies product requirements; do not assume full Drive access.
- [ ] **Credential Lifecycle**: Define secure token storage, refresh, revocation, logout and re-authentication behavior using the platform credential provider established in Phase 34 where available.
- [ ] **Provider Boundary**: Keep Google Drive API types and behavior behind a provider interface so future providers do not leak into backup/domain logic.

#### Group B — Backup & Restore Integration
- [ ] **Backup Artifact Reuse**: Upload artifacts produced by the existing SQLite Online Backup API and existing validated backup format. Do not copy a live SQLite database and its WAL independently.
- [ ] **Remote Destination**: Support user-selected application folder or supported app-data storage according to the approved OAuth scope.
- [ ] **Upload & Download**: Support upload, download, metadata inspection, resumable transfers where appropriate and clear progress/error reporting.
- [ ] **Versioning & Retention**: Track remote object IDs, versions, timestamps, sizes and checksums; define retention and safe replacement behavior.
- [ ] **Restore Workflow**: Download to a staging location, verify checksum and database integrity, then use the existing controlled restore path. Preserve the current database and backup if validation fails.
- [ ] **Mounted Drive Boundary**: Do not use a mounted Google Drive folder as a live SQLite database location in this phase. Any future mounted-filesystem support requires a separate proof of locking, WAL and provider semantics.

#### Group C — Verification
- [ ] **Authentication Tests**: Cover consent, denied permissions, expired/revoked tokens, refresh failure and account switching.
- [ ] **Transfer Tests**: Cover interrupted/resumed upload/download, duplicate remote objects, quota limits and unavailable network.
- [ ] **Integrity Tests**: Verify remote checksums, downloaded artifact validity and safe restore staging.
- [ ] **Data Safety Tests**: Prove that failed download, invalid backup or failed restore never overwrites the only known-good local copy.

**Phase Gate:** Users can securely upload, inspect, download and restore verified TimeLog backups through Google Drive using existing snapshot/restore infrastructure; OAuth scope and application ownership are documented; failed operations preserve known-good data.

---

### Phase 36 — Multi-Device Data Synchronization 🚧 (Planned)

**Depends on:** Phase 33 versioned per-device event streams and Phase 35 Google Drive provider.  
**Runtime scope:** Native/Tauri and standalone CLI devices. Browser/PWA participation requires a separately verified persistence and credential capability contract; it must not be implied by native support.

**Goal:** Synchronize independent local databases through validated event streams and checkpoints, without concurrent access to a shared cloud-hosted SQLite database.

#### Group A — Synchronization Protocol
- [ ] **Device Registration**: Define device identity, registration, revocation and recovery when a device is lost or reinstalled.
- [ ] **Stream Discovery**: Discover per-device event streams, schema versions, sequence ranges and trusted checkpoints in remote storage.
- [ ] **Sync Metadata**: Track last uploaded/downloaded sequence per device stream, remote object versions, checksums and sync session IDs.
- [ ] **Incremental Transfer**: Upload and download only missing validated events, with resumable transfers and idempotent application.
- [ ] **Schema Compatibility**: Negotiate supported event schema versions and define upgrade/downgrade behavior. Never silently discard events from a newer schema.
- [ ] **Checkpointing**: Define signed or otherwise trusted remote checkpoints for stream heads and sync progress; distinguish checkpoint trust from ordinary SHA-256 integrity checks.

#### Group B — Applying Changes & Conflicts
- [ ] **Deterministic Apply**: Apply validated remote events to a separate local transaction, preserving original event identity and origin-device sequence.
- [ ] **Duplicate Detection**: Deduplicate by stable event identity and stream sequence without assuming arrival order equals causal order.
- [ ] **Causality & Ordering**: Use causation/correlation metadata and explicit dependency rules where ordering matters. Do not infer a global total order from device timestamps.
- [ ] **Conflict Detection**: Detect concurrent edits, incompatible operations, divergent stream histories and deleted/modified entity conflicts.
- [ ] **Conflict Resolution Policy**: Apply deterministic merges only for explicitly safe domain cases. Otherwise preserve both candidate states/events and require a user decision; never silently use last-write-wins for consequential data.
- [ ] **Conflict UX**: Present actionable conflict details and allow users to inspect, resolve or defer conflicts without losing either version.
- [ ] **Sync Scheduling**: Support manual and configurable automatic sync, connectivity changes, retry and pause/resume behavior.

#### Group C — Verification & Operations
- [ ] **Multi-Device Tests**: Cover two or more devices, out-of-order delivery, offline edits, concurrent updates and device revocation.
- [ ] **Failure Simulation**: Cover interrupted sync, partial upload/download, stale remote metadata, quota limits and network loss.
- [ ] **Conflict Tests**: Verify deterministic safe merges and preservation of unresolved conflicting data.
- [ ] **Recovery Interop**: Verify sync can resume after restoring a backup and that restored devices do not reuse an existing device sequence incorrectly.
- [ ] **Operational Status**: Expose last successful sync, pending upload/download counts, device streams, conflicts and actionable failure reasons.

**Phase Gate:** Independent native devices can exchange validated event streams through Google Drive, resume interrupted synchronization, detect schema/history divergence and preserve unresolved conflicts without sharing a live SQLite file.

---

### Phase 37 — Unified Data Integrity & Recovery Manager 🚧 (Planned)

**Depends on:** Phase 33 journal validator and recovery primitives, Phase 35 verified backup/restore provider, and Phase 36 synchronization metadata.  
**Runtime scope:** Native/Tauri and standalone CLI recovery orchestration. Browser/PWA exposes only capabilities supported by its own persistence adapter and must not claim native SQLite recovery.

**Goal:** Orchestrate existing specialized validators and recovery procedures into one consistent integrity, diagnosis and controlled-repair workflow. This phase coordinates existing capabilities; it does not reimplement their validators.

#### Group A — Recovery Orchestration
- [ ] **Unified Recovery Model**: Define a common recovery report and operation contract while keeping SQLite, cloud storage, event journal and sink validators specialized.
- [ ] **Health Assessment**: Run the relevant validators and correlate their results across database, backup artifacts, device streams, checkpoints and sink delivery state.
- [ ] **Recovery Point Selection**: Identify candidate known-good snapshots and the validated event range available after each snapshot. Explain data-loss boundaries before restore.
- [ ] **Recovery Plan**: Produce a preview of actions, affected data, expected outcome, unresolved conflicts and rollback path before applying repairs.
- [ ] **Recovery Execution**: Coordinate staged restore, event replay, synchronization reconciliation and sink projection rebuild using the owning subsystem APIs.
- [ ] **Repair Isolation**: Execute destructive repairs only against a staged copy or after preserving a verified known-good copy. Never overwrite the only known-good copy.
- [ ] **User Approval**: Require explicit confirmation for destructive, ambiguous or conflict-resolving operations; safe read-only validation may run automatically.
- [ ] **Rollback**: Preserve a rollback path and verify post-repair integrity before marking recovery successful.

#### Group B — Specialized Recovery Coordination
- [ ] **SQLite Recovery**: Reuse the existing oxy db doctor, backup/restore and SQLite integrity/schema validation capabilities; add only missing checks.
- [ ] **Cloud Artifact Recovery**: Reuse the Google Drive provider to locate versions, verify checksums and retrieve known-good artifacts.
- [ ] **Event Journal Recovery**: Reuse Phase 33 per-device stream validators, checkpoints and deterministic replay; report unrecoverable gaps instead of fabricating history.
- [ ] **Synchronization Recovery**: Reconcile interrupted sessions, stale checkpoints and divergent histories using Phase 36 protocol rules.
- [ ] **Sink Recovery**: Rebuild projections and reconcile pending/delivered/dead-letter state from the canonical journal and dispatcher; do not duplicate Phase 33/34 validators.
- [ ] **Recovery Boundaries**: Clearly distinguish recoverable delivery failure, projection corruption, event-history corruption, database corruption and unresolved domain conflict.

#### Group C — Reporting & Verification
- [ ] **Recovery Reports**: Record detected issues, evidence, selected recovery point, actions, approvals, verification results and unresolved risks.
- [ ] **Dry Run**: Support a non-mutating diagnostic/recovery plan before any repair is executed.
- [ ] **Failure Injection**: Test interrupted restore, failed replay, corrupted backup, unavailable remote storage, partial repair and rollback.
- [ ] **Known-Good Preservation**: Verify every destructive path preserves at least one independently validated recovery copy.
- [ ] **End-to-End Recovery Journeys**: Test database restore, journal replay, sink rebuild and multi-device resynchronization as separate and combined scenarios.
- [ ] **Runtime & CLI Tests**: Verify recovery status and machine-readable reports without contaminating CLI machine output; verify Desktop user approval and progress flows.

**Phase Gate:** A single recovery workflow can diagnose and coordinate specialized validators and repair procedures across SQLite, Google Drive, event history, synchronization and sinks; every repair is auditable, verified and preserves a known-good recovery point.

---

### UI/UX Flow Program — Browser / PWA Runtime (Phases 38–41)

**Goal:** Working with the app feels like one continuous movement ("Brazilian Zouk Flow"): the numbers are right, the keyboard never ends in a dead end or stops a timer by accident, nothing jumps, and every task takes as few interactions as possible.

**Source:** [UI/UX flow audit, 2026-11](../reviews/ui-ux-flow-audit-2026-11/README.md). Each item names its work package (`FLOW-xx`, sizes and layers in the audit backlog) and links the findings it closes; the findings hold the repro steps, measurements, screenshots and the regression test to add.

**Order:** Phase 38 first, because it fixes wrong numbers and blocked users. Phases 39 (Reports) and 40 (Tasks) touch different features and can run in parallel after Phase 38. The parallel tracks in Phase 41 are small, independent changes that can be picked up at any time. The program changes React, CSS and the browser engine, so it can run alongside the v1.16 CLI program; the exceptions are FLOW-01 and FLOW-30, which change both engines and their parity fixtures.

**Owner decisions:** Items marked *needs Dx* wait for the answer to that question in [Owner decisions needed](../reviews/ui-ux-flow-audit-2026-11/README.md#owner-decisions-needed).

**Scope:** The browser runtime in the Full and Medium layouts. Tabs that the browser does not show (`db`, `cli`), the Compact layout, the tray and the Tauri windows were not audited; the desktop receives the shared React fixes without a separate audit.

**Rules for every item:** The regression test named in the finding ships with the fix; visual changes attach before and after screenshots to the PR; L-sized packages are split before dispatch.

---

### Phase 38 — Correct Data & Unblocked Input 🚧 (In Progress)

**Goal:** Reports show correct numbers for every period and project scope, and keyboard use never stops a timer or lands on a hidden view.

#### Group A — Test Baseline

- [ ] **Stale Layout Spec** ([FLOW-29](../reviews/ui-ux-flow-audit-2026-11/README.md#follow-ups-found-during-flow-05-review)): `main-layout.spec.ts` expects the `db` tab, which the browser runtime hides. Fixed first so that the e2e suite is a reliable gate for the rest of the program.

#### Group B — Report Data Correctness

- [x] **Report Project Scope** ([FLOW-05](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-1--wrong-data-and-blocked-users) part 1): The report keeps its own multi-project scope, where empty means all projects. Filter chips and donut slices toggle one or many projects, "All" resets the scope, and the Engine filters every card, chart and log list by it. Closes [B-04](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-04-p1-interaction-cost--consistency-project-scope-is-single-select-and-all-does-nothing-known-defect-observable-behaviour) inside the Reports view.
- [ ] **Sidebar Multi-Select in Reports** ([FLOW-05](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-1--wrong-data-and-blocked-users) part 2): While Reports is active, the projects sidebar toggles the report scope (one or many projects, a selected indicator that does not rely on colour, a one-click reset to all). In Tasks the sidebar keeps selecting the working project. [B-04](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-04-p1-interaction-cost--consistency-project-scope-is-single-select-and-all-does-nothing-known-defect-observable-behaviour).
- [ ] **Periods in the User's Timezone** ([FLOW-01](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-1--wrong-data-and-blocked-users)): Report periods come from the Engine's timezone-aware period resolution (Phase 19, Group A) instead of UTC arithmetic in `periodRanges.ts`; the "All" period gets a real day count for the daily average; the `last30Days` day count is corrected. [B-13](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-13-p0-data-correctness-period-boundaries-are-computed-in-utc-a-log-made-just-after-local-midnight-is-reported-under-yesterday), [B-01](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-01-p1-data-correctness-daily-average-equals-period-total-for-the-all-period).
- [ ] **Empty Scope in Billing** ([FLOW-31](../reviews/ui-ux-flow-audit-2026-11/README.md#follow-ups-found-during-flow-05-review)): The `ReportBillingCard` fetch path treats an empty project list the same way as the statistics path instead of reading it as "all projects".
- [ ] **One Project Rule in Both Engines** ([FLOW-30](../reviews/ui-ux-flow-audit-2026-11/README.md#follow-ups-found-during-flow-05-review)): Rust range metrics filter on `log.project_id`, the browser engine on `task.projectId ?? log.projectId`. One rule, documented in `ENGINEERING.md` and covered by a parity fixture.

#### Group C (Parallel Track) — Keyboard & Focus Safety

- [ ] **No Accidental Timer Toggle** ([FLOW-02](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-1--wrong-data-and-blocked-users)): Bare Space does not toggle the timer after focus falls to the page body; inline editors and confirm dialogs return focus to their trigger. [A-21](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-21--p1-data-affecting--interaction-cost--a11y--rename-and-subtask-add-drops-focus-to-body-and-the-global-space-shortcut-then-stops-the-running-timer), [A-32](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-32--p2--a11y--interaction-cost--focus-return-is-inconsistent-billing-and-logs-dialogs-return-focus-to-the-trigger-the-delete-task-confirm-does-not), [C-11](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-11--p2--a11y--reset-dialog-focus-is-not-returned-to-the-trigger-after-escape--prior-expbout). *Needs D3.*
- [ ] **Alt+Digit Follows the Visible Tabs** ([FLOW-04](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-1--wrong-data-and-blocked-users)): Shortcuts map to the tab list the runtime actually shows. [C-01](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-01--p1--interaction--dead-end--alt3-lands-on-a-hidden-tab-blank-content-no-tab-selected--prior-expa2out-a-alt3-hidden-db).
- [ ] **Keyboard-Operable Sidebar** ([FLOW-03](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-1--wrong-data-and-blocked-users)): Project rows are focusable and selectable, Tab no longer stops on invisible controls, the action cluster stops taking row width, the edit button has a name. [A-19](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-19--p0-a11y-blocks-keyboard-only--a11y--interaction-cost--projects-cannot-be-selected-with-the-keyboard-sidebar-tab-order-is-28-invisible-stops), [A-01](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-01--p1--visual--data-correctness--sidebar-project-rows-show-a-1-character-description-line--c-cr), [A-34](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-34--p2--sense-of-solution--project-row-shows-hover-only-editarchivereorder-controls-and-double-click-to-rename-and-a-separate-edit-dialog-three-ways-to-edit-one-name-none-discoverable-without-hover), [B-16](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-16-p1-a11y--interaction-cost-keyboard-40-tab-stops-from-the-tab-bar-before-the-reports-first-button-donut-slices-are-not-keyboard-reachable). Runs after the sidebar multi-select, which changes the same rows.

**Phase Gate:** For one seeded dataset, every report period and scope (one project, several, all; with and without a tag filter) gives the same totals in the cards, charts, billing and log list, in both engines; a keyboard-only run of the Tasks flow never stops the timer by accident.

---

### Phase 39 — Reports Flow 🚧 (Planned)

**Depends on:** Phase 38 (Group B).
**Goal:** One scope bar above the numbers it changes, readable charts and logs, and exports and printouts that state what they contain.

#### Group A — Scope & Readability

- [ ] **One Sticky Scope Bar** ([FLOW-06](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): Period, projects and tags sit in one bar above the numbers, and filtering no longer moves the clicked control. [B-02](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-02-p1-sense-of-solution--interaction-cost-controls-that-change-the-numbers-sit-below-the-numbers-they-change), [B-03](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-03-p1-interaction-cost-filter-block-is-a-4-row-wall-that-grows-with-data), [B-23](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-23-p1-motiontransition-the-period-button-you-just-clicked-moves-under-the-pointer-up-to-1250-px-because-the-filter-sits-below-variable-height-content), [B-14](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-14-p1-motiontransition-selecting-a-donut-slice-or-clearing-the-filter-throws-the-user-to-another-place-in-the-page).
- [ ] **Readable Cards & Charts** ([FLOW-09](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): Stat card labels, legends and the donut title are not clipped; bars for wide periods are aggregated. [B-07](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-07-p1-visual-project-share-title-is-truncated-by-its-own-filter-badge), [B-08](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-08-p1-visual-chart-legends-are-clipped-at-the-card-edges-with-many-projects--long-names), [B-10](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-10-p1-i18n--visual-stat-card-titles-break-mid-word-and-truncate-de-multi-currency), [B-22](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-22-p2-visual--consistency-3-px-wide-daily-bars-with-a-hover-target-of-3-px).

#### Group B — Log List & Billing

- [ ] **Usable Log List** ([FLOW-07](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): Usable height, a date per row or day groups, start–end and note, windowed rendering for long lists. [B-18](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-18-p1-interaction-cost--visual-log-list-250-px-nested-scroller-holds-9000-px-of-rows-rows-have-no-date-text-is-10-12-px), [B-15](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-15-p1-performance--motion-every-period-or-project-click-blocks-the-main-thread-for-03-22-s-dev-build).
- [ ] **One Billing View** ([FLOW-08](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): One representation grouped by project, readable at 390 px, no "UNKNOWN" currency card. [B-05](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-05-p1-responsiveness-billing-table-is-cut-off-at-390px-duration-and-amount-columns-are-not-visible), [B-11](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-11-p2-sense-of-solution-billing-appears-three-times-and-an-unknown-currency-card), [B-12](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-12-p1-sense-of-solution-billing-table-has-no-project-column-rows-ambiguous-in-multi-project-scope).
- [ ] **Cheaper Log Correction** ([FLOW-12](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): Correcting a log from the report takes fewer steps. [B-19](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-19-p1-interaction-cost-fix-a-wrong-log-found-in-the-report-costs-9-12-interactions-and-a-mandatory-free-text-reason). *Needs D2.*

#### Group C (Parallel Track) — Export & Print

- [ ] **Custom Range & Export Naming** ([FLOW-10](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): The custom range is prefilled and validated; the export dialog and the file name state the period and scope. [B-20](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-20-p1-interaction-cost--consistency-custom-range-starts-empty-and-equal-to-all-needs-two-typed-dates-a-reversed-range-silently-empties-the-report), [B-21](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-21-p2-consistency--i18n-export-dialog-shows-the-raw-period-id-and-no-scope).
- [ ] **Accessible Export Dialog** ([FLOW-13](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): Focus trap and radio-group semantics. [B-17](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-17-p2-a11y-export-modal-focus-escapes-the-dialog-and-the-format-list-is-7-separate-tab-stops).
- [ ] **Clean Print Document** ([FLOW-11](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-2--reports-flow)): No app chrome, card titles kept, resolved dates and scope printed. [B-24](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-24-p1-consistency--sense-of-solution-print-output-app-chrome-prints-card-titles-vanish-period-has-no-dates-or-project-irrelevant-cards-stay).

**Phase Gate:** At 1440 px, changing the scope and reading the result needs no scrolling and the clicked control stays in place; exports and printouts show the period dates and the project scope.

---

### Phase 40 — Tasks Flow 🚧 (Planned)

**Depends on:** Phase 38 (Group C).
**Goal:** A keyboard-first entry chain from project to running timer, on a layout that does not jump.

#### Group A — Stable Geometry & Clean Rows

- [ ] **Stable Geometry** ([FLOW-15](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-3--tasks-flow)): One banner height for idle, active and break; a symmetric Full ↔ Medium switch. [A-05](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-05--p1--motiontransition--startingstopping-the-timer-shifts-the-whole-project-sheet-by-9px), [A-22](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-22--p2--motiontransition--take-break-swaps-the-active-banner-for-a-taller-break-banner-the-whole-task-sheet-jumps-down-18px-and-back), [A-28](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-28--p1--motiontransition--layout-switch-full--medium-is-asymmetric-fullmedium-snaps-mediumfull-animates-the-frame-while-the-full-layout-is-already-rendered-inside-it).
- [ ] **Task Row & Header Cleanup** ([FLOW-16](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-3--tasks-flow)): One status concept, no `Entity #id` line, badge spacing, no "SELECT PROJECT" eyebrow above a selected project, compact stats, long names wrap. [A-03](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-03--p1--sense-of-solution--timer-start-produces-a-second-parallel-status-chip-and-raw-entity-id-debug-line-on-every-task), [A-04](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-04--p2--visual--in-progress-badge-glyph-collides-with-its-label-n-progress), [A-07](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-07--p1--sense-of-solution--task-stats-and-project-header-duplicate-the-same-number-three-times), [A-08](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-08--p2--consistency--eyebrow-select-project-is-shown-above-an-already-selected-project), [A-11](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-11--p2--i18nvisual--long-task-name-truncated-with--at-45-chars-although-the-row-has-free-width), [A-09](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-09--p1--interaction-cost--task-actions-billing--logs-rename-delete-are-icon-only-appear-only-on-hover-12px-low-contrast).

#### Group B — Keyboard-First Entry

- [ ] **Entry Chain** ([FLOW-14](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-3--tasks-flow)): Focus moves from a new project to the task input; the subtask input takes focus and accepts batch entry; a new task scrolls into view; Medium selects the created project and closes its form on Esc. [A-20](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-20--p1--interaction-cost--after-add-project-via-enter-focus-stays-in-the-project-input-the-next-natural-step-task-name-needs-a-pointer-click), [A-14](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-14--p1--interaction-cost--subtask-creation--subtask-opens-an-inline-form-but-focus-is-not-moved-to-its-input-and-enter-keeps-the-form-open), [A-31](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-31--p1--interaction-cost--a-newly-added-task-is-appended-below-the-fold-and-the-list-is-not-scrolled-to-it), [A-30](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-30--p1--interaction-cost--consistency--medium-creating-a-project-does-not-select-it-full-does-and-gives-no-confirmation), [A-06](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-06--p1--interaction-cost--a11y--medium-layout-esc-does-not-close-the-new-project-form-and-the-open-form-covers-the-task-list-so-start-buttons-cannot-be-clicked).

#### Group C — Responsive Pass

- [ ] **Responsive Pass** ([FLOW-17](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-3--tasks-flow), split per view): 1024 px sidebar, long project names, phone-width Full layout, subtask rows at 390 px, touch target sizes, Settings tables at 390 px, Medium tiles. [A-24](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-24--p1--responsiveness--full-layout-at-1024x768-sidebar-is-squeezed-so-project-names-are-cut-to-12-characters-and-the-add-new-project-button-overflows-its-card), [A-25](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-25--p1--responsiveness--visual--long-project-name-is-hard-clipped-no-ellipsis-in-the-medium-sheet-header-and-collides-with-total-in-full-all-themeslocalessizes), [A-16](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-16--p1--responsiveness--interaction-cost--phone-390px-full-the-projects-list-fills-the-first-screen-tasks-are-reached-only-after-scrolling-past-7-projects-110px-each), [A-17](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-17--p1--responsiveness--a11y--phone-medium-subtask-row-action-glyphs--clock-overlap-the-todo-chip-sticky-banner-hides-the-running-timer-card), [A-26](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-26--p2--responsiveness--phone-390-full-stat-card-labels-clipped-total-duration-total-tasks-completed-tasks-and-the-footer-license-link-overlaps-the-last-visible-tag-chip), [A-27](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-27--p2--a11y--responsiveness--interactive-targets-below-24px-wcag-258-minimum-on-the-tasks-screen-including-on-touch), [B-06](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-06-p1-responsiveness--interaction-cost-full-layout-on-a-phone-the-report-is-buried-under-the-whole-projects-sidebar), [C-29](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-29--p1--visual--responsiveness--medium-settings-quick-language-tiles-truncated-to-one-letter-status-banner-overlaps-timer-card--shots-g-med-1440-settings-g-med-390-settings), [C-32](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-32--p1--responsiveness--390x844-holidays-table-hides-editdelete-off-screen-headings-and-footer-clipped--expiout-shot-390-dark-settings-default), [C-15](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-15--p2--responsiveness--390x844-language-tile-label-truncated--prior-m3json). Runs after Groups A and B; measured at the medium text size, and FLOW-24 repeats the checks at small and large.

#### Group D — Decision-Dependent

- [ ] **Starter Templates Worth the Click** ([FLOW-18](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-3--tasks-flow)): Readable first-run cards that create something useful. [A-02](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-02--p1--visual--starter-template-cards-on-first-run-description-text-overlaps-the-neighbour-card), [A-35](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-35--p2--sense-of-solution--quick-starter-templates--launch-your-workflow-with-one-click-creates-only-an-empty-project-cards-give-no-readable-title-or-description). *Needs D4.*
- [ ] **Medium Layout Chrome** ([FLOW-19](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-3--tasks-flow)): Chrome budget and tab bar shape in Medium. [A-12](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-12--p1--responsiveness--medium-layout-at-1024px-renders-a-500px-column-docked-to-the-right-with-an-empty-500px-void-on-the-left), [A-13](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-13--p2--visual--medium-tab-bar-active-tab-pill-clipped-at-left-edge-labels-icon-only), [A-33](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-33--p2--sense-of-solution--responsiveness--medium-layout-leaves-42-of-the-window-for-tasks). *Needs D1.*

**Phase Gate:** Creating a project, a task and a subtask and starting the timer works by keyboard alone without a layout jump; no text is clipped at 390, 1024 and 1440 px.

---

### Phase 41 — Shell Truthfulness & Tab Currency 🚧 (Planned)

**Goal:** The browser app promises only what it can do, tabs and Settings speak one language, and motion and scale follow the user's preferences.

#### Group A (Parallel Track) — Truthful Copy

- [ ] **Runtime-Aware Copy** ([FLOW-20](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): No Rust, SQLite, tray or daemon wording, no dead footer link, no false shortcut tiles or Manual title in the browser; the status banner and the "Registered today" value are correct. [C-02](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-02--p1--stale-content--sense-of-solution--manual-tab-shortcut-card-describes-desktop-tray-behaviour-in-the-browser--prior-1440-light-manual-expanded), [C-03](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-03--p2--stale-content--manual-tab-title-and-subtitle-promise-content-that-is-not-there-section-numbering-starts-at-ii--prior-1440-light-manual-expanded), [C-05](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-05--p1--stale-content--sense-of-solution--browser-runtime-still-advertises-native-stack--prior-all-shots), [C-18](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-18--p1--stale-content--manual-tab-hides-the-compilation-guide-in-the-browser-so-the-titledescription-describe-a-page-that-does-not-exist-here--code-manualtabtsx), [C-19](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-19--p1--stale-content--shortcut-card-is-not-capability-gated-except-cli-row--code-keyboardshortcutscardtsx29-52), [C-25](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-25--p1--sense-of-solution--dead-end--footer-database-management-link-does-nothing-in-the-browser--expeout-shots-e-db-link), [B-09](../reviews/ui-ux-flow-audit-2026-11/audit-b-reports.md#b-09-p2-data-correctness-registered-today-in-the-timer-banner-is-not-todays-time).
- [ ] **One Version Number** ([FLOW-21](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): One version in the header; Credits content and versions in one place. [C-04](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-04--p1--consistency--stale-content--three-different-version-numbers--prior-all-shots-header-1440-light-settings-expanded), [C-22](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-22--p2--sense-of-solution--credits-tab-content-is-personal-copy-partly-inaccurate-for-the-browser--code-creditstabtsx10-screenshot-1440-light-credits-expanded).
- [ ] **Documentation Drift** ([FLOW-28](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): User guide themes and paths, CHANGELOG release headings, the locale count in the manifesto. [C-21](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-21--p2--stale-content--user-guide-and-readme-disagree-with-the-real-ui--docs-vs-ui).

#### Group B (Parallel Track) — Header, Settings & Preferences

- [ ] **Locale-Independent Header** ([FLOW-23](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): Header geometry does not depend on the locale; language has one home; layout and text size are named distinctly; each tab label equals its view heading. [C-13](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-13--p1--motion--layout-shift--switching-language-moves-header-and-tab-bar--prior-expdout), [C-14](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-14--p2--sense-of-solution--language-can-be-set-in-three-places--prior-1440-light-settings-expanded), [C-24](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-24--p2--a11y--i18n--consistency--header-controls-naming-and-accessible-names--expeout-header-buttons), [C-27](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-27--p2--i18n--leftovers-and-naming-drift-across-locales-expfout).
- [ ] **Settings Polish** ([FLOW-27](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): Headings without jargon, card order and default expansion, the hours-limit field, translation key validation, the import error message, no toast for changes that are already visible. [C-06](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-06--p2--consistency--visual--duplicate-and-developer-jargon-headings-in-settings--prior-1440-light-settings-expanded), [C-07](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-07--p2--sense-of-solution--order-of-settings-cards-reset-separated-from-backup--prior-1440-light-settings-expanded), [C-08](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-08--p1--interaction--validation--auto-stop-hours-field-max-not-enforced-clearing-snaps-to-1--prior-expa2out), [C-09](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-09--p1--interaction--validation-feedback--invalid-backup-file-generic-message-stays-on-screen--prior-expcout), [C-10](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-10--p2--consistency--custom-translation-editor-accepts-unknown-keys-silently--prior-expcout), [C-30](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-30--p2--interaction-cost--consistency--needless-confirmation-toast-for-an-instant-visible-change--expg2out), [C-33](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-33--p2--consistency--default-expansion-state-of-settings-cards-is-arbitrary--expiout).
- [ ] **Reduced Motion** ([FLOW-25](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): `prefers-reduced-motion` is honoured. [A-29](../reviews/ui-ux-flow-audit-2026-11/audit-a-tasks-and-shell.md#a-29--p2--a11y--motion--prefers-reduced-motion-reduce-is-not-honoured-by-the-pulseping-indicators), [C-12](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-12--p2--a11y--motion--prefers-reduced-motion-is-not-honoured-by-the-active-tab-icon--prior-expdout).

#### Group C — Reach & Install

- [ ] **Everything Reachable in Medium** ([FLOW-22](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): Backup, Manual, Credits and reset are reachable in the Medium layout. [C-28](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-28--p1--sense-of-solution--dead-end--medium-layout-cannot-reach-backup-manual-credits-versions-or-reset--expg3out-shots-g-med-), [C-23](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-23--p2--consistency--medium-layout-exposes-only-tasks--reports--settings--code-navigationts). *Needs D1.*
- [ ] **Discoverable PWA Install** ([FLOW-26](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency)): The app offers installation where the browser supports it. [C-20](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-20--p1--stale-content--pwa-nothing-tells-the-user-how-to-install-it--code-appbrowsertsx16-platformcapabilitiescontextts12), [C-26](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-26--p1--stale-content--pwa-install-not-discoverable-supports-c-20).

#### Group D — Scale

- [ ] **Text and Icon Size Scales the Whole UI** ([FLOW-24](../reviews/ui-ux-flow-audit-2026-11/README.md#wave-4--shell-truthfulness-and-tab-currency), token audit, split before dispatch): Not only the tab bar. [C-31](../reviews/ui-ux-flow-audit-2026-11/audit-c-settings-and-tab-currency.md#c-31--p1--consistency--sense-of-solution--text-and-icon-size-control-only-scales-the-tab-bar-not-the-settings-content--expjout-shots-h-text-large-settings). Repeats the FLOW-17 checks at the small and large sizes.

**Phase Gate:** In the browser runtime no text mentions Rust, SQLite, the tray or the daemon; every tab label equals its view heading; Backup, Manual and Credits are reachable from every layout; reduced motion turns transitions off; the large text size scales every view.
