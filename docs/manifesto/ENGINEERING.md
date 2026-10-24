# ENGINEERING.md

## Engineering Guide

This document describes the architecture, layer responsibilities and engineering principles of oXyFlow. It is the reference for contributors and reviewers.

Mandatory rules for day-to-day work (AI assistants and humans alike) are in [`../AGENTS.md`](../AGENTS.md) and the topic files in [`../.agents/rules/`](../.agents/rules/). This document explains the architecture those rules protect and does not repeat them.

---

## Engineering Goals

Every engineering decision should improve at least one of the following without unnecessarily harming the others:

- Simplicity
- Maintainability
- Correctness
- Predictability
- Testability
- Runtime Independence
- Native User Experience
- Long-Term Sustainability

When goals conflict, prefer in this order: correctness, maintainability, readability, performance. Never sacrifice architecture for hypothetical optimizations.

---

## Core Principles

- **KISS**: prefer the simplest solution that satisfies the current requirements. Avoid architecture created only for possible future scenarios.
- **SOLID, pragmatically**: apply it when it genuinely improves maintainability. Avoid interfaces, inheritance or indirection without practical value.
- **DRY for business logic**: business logic is never duplicated within a runtime. The browser and Rust engines are deliberate parallel implementations kept equal by parity tests.
- **YAGNI**: no features for hypothetical needs; extension points exist only when they solve a real problem.
- **Composition over inheritance**: the application is assembled from routers, managers, builders and runtime implementations.

---

## Architectural Layers

```text
React UI
        │
        ▼
Application Routers (EngineRouter, PersistenceRouter)
        │
        ▼
Runtime Implementations (Tauri IPC | Browser plugins)
        │
        ▼
Business Engine / Persistence
```

Every layer has exactly one responsibility.

---

## Backend Architecture

### EngineRouter & PersistenceRouter (`IRouter<T>`)

Select and route to the active runtime implementation (Tauri IPC vs browser in-memory / LocalStorage):

- Implement `IRouter<T>`, which provides `setImplementationForTesting(implementation: T): void`.
- Expose domain sub-interfaces through getters (`timer`, `metrics`, `timeLogs`, `validation`).
- Contain no business logic, transformation or fallback heuristics.

### Engine (`IEngine`)

All business logic and calculations belong to the Engine, split into sub-engines:

- `timer: ITimerEngine`: timer lifecycle (`startTimer`, `stopTimer`, `resumeTimer`, `getActiveLogs`)
- `metrics: IMetricsEngine`: snapshot metrics and elapsed calculations (`getComputedMetrics`, `getTaskElapsed`, `getProjectElapsed`, `getElapsedRange`, `getProjectStatistics`)
- `timeLogs: ITimeLogsEngine`: interval edits, corrections and audit history (`editTimeLog`)
- `validation: IValidationEngine`: entity validation (`validateProjectName`, `validateTaskName`, `validateTaskHierarchy`)

Rust is the reference implementation; the browser `EnginePlugin` must behave identically, verified by `tests/integration/engine/CrossRuntimeParity.test.ts`.

### Persistence (`IPersistence`)

Persistence stores, retrieves and mutates entity state:

- state operations (`load`, `overrideState`, `reset`)
- entity CRUD (`projects`, `tasks`, `timeLogs`, `holidays`, `patches`)
- configuration (`settings`, `runtimeConfigs`, `uiState`, `externalApi`, `locale`)
- backup and export
- parity between SQLite (Tauri) and the LocalStorage `PersistencePlugin` (browser)

Domain persistence services execute targeted queries or IPC calls; granular mutations (`rename`, `getProjectId`, `getSubtasks`) never download the full state via `core.load()`.

Persistence never validates time-overlap rules, calculates statistics or orchestrates active timers. Repositories access storage only.

### Native Modules (`src-tauri/src/`)

| Module | Responsibility |
| --- | --- |
| `engine/` | Reference engine: timers, metrics, validation |
| `persistence/`, `repositories/` | SQLite storage; raw SQL only in `repositories/` |
| `commands/` | Tauri IPC commands |
| `cli/` | Headless native CLI (binary `oxy`), see [`CLI.md`](./CLI.md) |
| `sinks/` | CSV and webhook output |
| `workflows/` | Automated triggers (auto-stop, day boundary) |
| `tray/` | System tray |
| `types/` | Shared domain types, exported to `src/bindings/` via `ts-rs` |

Boundaries between these modules are enforced by the Rust architecture tests in `src-tauri/tests/architecture/`.

---

## Frontend Architecture

Business logic stays outside React. The frontend is split into independent responsibilities.

### Runtime

A runtime is the execution environment: currently **Browser** and **Tauri**.

A runtime is responsible only for environment integration, native APIs, window management, runtime wrappers and runtime styling. It never changes business logic, layout composition or component hierarchy.

Each runtime has its own application entry point (`src/app-browser/AppBrowser.tsx`, `src/app-tauri/AppTauri.tsx`) with its own `PlatformCapabilities`. Both expose the same frontend architecture; only runtime integration, window behavior, runtime CSS and native APIs differ.

### LayoutManager

`LayoutManager` (`src/layouts/manager/`) composes the application inside the current runtime: it hosts the application shell, shared providers, root state classes and `ThemeRegistry`, and renders the selected LayoutVariant.

It never decides the runtime, the layout variant or the visual scale; those come from configuration.

### LayoutVariant and Builders

LayoutVariant defines application composition: page composition, column layout, navigation placement and major screen regions.

| Variant | Builder |
| --- | --- |
| Full | `FullLayoutBuilder` |
| Medium | `MediumLayoutBuilder` |
| Compact | `CompactLayoutBuilder` |

Builders (`src/layouts/builders/`) only compose views. They never calculate sizes, detect the runtime or contain business logic. A new layout means a new builder registered in `LayoutManager`; runtimes stay unchanged.

### TextAndIconSize

TextAndIconSize (`small`, `medium`, `large`) defines visual scale: typography, icon sizes, spacing, paddings, border radius. It is implemented purely as CSS design tokens and never changes layout composition. A new scale means new token values; components stay unchanged.

### CSS and Theming

CSS owns presentation. `LayoutManager` exposes application state as data attributes on its root element (`data-runtime`, `data-layout-variant`, `data-text-size`), CSS selects on them, and components consume CSS variables and semantic tokens (`bg-card`, `border-border`, `text-foreground`):

```css
padding: var(--spacing-card);
```

Themes follow dependency inversion: components never know the active theme. `ThemeRegistry` (`src/styles/themeRegistry.ts`) holds the built-in themes (`light`, `dark`, `high-contrast`) and custom ones, and applies a theme by setting `data-theme` on `document.documentElement`.

### Contexts

Contexts are split by domain to avoid unnecessary re-renders:

| Context | Responsibility |
| --- | --- |
| `WindowShellContext` | Window lifecycle, tray minimization, toasts, shell alerts |
| `PlatformCapabilitiesContext` | Capabilities of the current runtime |
| `DataContext` | Projects, tasks, time logs, selections, CRUD and the metrics snapshot (`useMetricsManager`) |
| `SettingsContext` | Preferences: layout variant, theme, visual scale |
| `LocaleProvider` | Current locale and dictionaries |
| `CliSessionContext` | Terminal session, history, `CliDrawer` state, live vs sandbox mode |

### Live Elapsed Time

Elapsed-time display is centralized:

- `useLiveTaskElapsed(taskId, options)`: reconciles the engine metrics snapshot (`EngineComputedMetrics`) with the live delta of the active timer.
- `useLiveProjectElapsed(projectId, options)`: aggregate live elapsed time for a project.

### CLI Integration

The in-app CLI (`src/features/cli/`) is integrated through `CliRouter` (`src/common/cli/CliRouter.ts`):

- **Desktop runtime (Tauri):** Terminal commands delegate directly to the native Rust reference CLI via the `cli_execute` Tauri IPC command (`TauriCliClient`). Any mutating command triggers `DataContext.refreshData()`, synchronizing GUI views instantaneously with SQLite.
- **Browser runtime & simulator:** Commands route through `SandboxCommandRouter` and execute against `SandboxEmulatorStore` in memory, guaranteeing zero side-effects to persistent storage.
- **Report commands:** Report calculations delegate durations to `IMetricsEngine.getComputedMetrics()` and `getElapsedRange()`, ensuring identical calculation across GUI, native CLI, and emulator.
- **Atomicity & Parity:** `switch <task-id>` stops and starts timers atomically. Identical syntax, exit codes (`0`..`5`), and error envelopes are verified across both runtimes by the shared 39-vector parity matrix (`tests/shared/fixtures/cli-parity-cases.json`).

---

## Quality Strategy

| Tier | What it covers |
| --- | --- |
| Unit | Utilities, plugins, rules, builders, design-system primitives and composites |
| Integration | Routers, runtime communication, Tauri commands, persistence, composite views, CLI flows |
| Architecture | AST and module-boundary rules (TS: `tests/architecture/`, Rust: `src-tauri/tests/architecture/`) |
| E2E | Timer, project, task, configuration and CLI journeys (Playwright) |
| Parity | Engine and CLI behavior identical across Rust and browser |
| Mutation | Stryker on core logic |

Test structure, naming and isolation rules: [`testing_standards.md`](../.agents/rules/testing_standards.md).

Architecture tests (TypeScript: `tests/architecture/`):

| Spec | Protects |
| --- | --- |
| `max-nested-ifs` | Cyclomatic complexity; Rule of 3 Ifs (depth >= 3 triggers failure) |
| `no-raw-html-primitives` | Design-system primitives only in `src/components/ui/` |
| `no-inline-theme-ternaries` | Theme dependency inversion |
| `runtime-isolation` | Shared code does not detect the runtime |
| `engine-boundary`, `persistence-boundary` | Layer boundaries |
| `circular-dependencies` | No import cycles |
| `timer-live-calculation` | No ad-hoc elapsed tickers |
| `root-folder-aliases` | Import alias conventions |
| `test-governance` | Test naming and DOM-access rules |

Architecture tests (Rust: `src-tauri/tests/architecture/`):

| Suite | Protects |
| --- | --- |
| `max_nested_ifs_test` | Cyclomatic complexity; Rule of 3 Ifs (depth >= 3 triggers failure) |
| `cyclic_dependencies_test` | Zero circular dependencies across core crates |
| `layer_boundaries_test` | Strict layer isolation (CLI, Engine, Repositories, Types) |
| `error_handling_test` | Strictly typed domain errors; zero generic errors |
| `sql_isolation_test` | Raw SQL statements isolated exclusively to `repositories` |
| `tauri_isolation_test` | Zero Tauri GUI coupling in headless modules |

---

## Toolchain

Bun is the only JavaScript package manager and script runner (`bun install`, `bun run <script>`, `bun x <binary>`); `bun.lock` is the only lockfile. Commands are listed in [`../AGENTS.md`](../AGENTS.md#commands).

---

## Non-Negotiable Rules

### Never

- Put business logic into React.
- Bypass EngineRouter or PersistenceRouter.
- Couple UI to storage.
- Detect the runtime inside shared components.
- Calculate UI scale inside React components.
- Mix layout composition with visual scaling.

### Always

- Keep responsibilities focused and prefer composition.
- Isolate runtimes.
- Keep LayoutVariant independent from TextAndIconSize.
- Keep CSS responsible for presentation.
- Leave touched code cleaner than you found it, within the refactoring scope defined in `AGENTS.md`.
