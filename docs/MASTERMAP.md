# MASTERMAP.md

## oXyFlow — Architecture & Product Roadmap

### 🎯 Vision

Build a lightweight, native-first productivity suite focused on flow, correctness, maintainability, and long-term sustainability.

oXyFlow is built around a **single business domain model** with **multiple runtime implementations** (Native Desktop via Tauri/Rust and Web Browser). Every architectural layer is independently replaceable while exposing a single, consistent contract to the rest of the application.

> For strict coding standards and layer rules, see [`ENGINEERING.md`](./ENGINEERING.md).  
> For UI spatial logic and design tokens, see [`USERINTERFACE.md`](./USERINTERFACE.md).  
> For UX principles, see [`USEREXPERIENCE.md`](./USEREXPERIENCE.md).  
> For AI operational guardrails, see [`../AGENT.md`](../AGENT.md).

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
   (Tauri IPC → Rust)        (Browser In-Memory)       (Tauri IPC → SQLite*) (Browser LocalStorage)
           │                         │                             │                  │
           └────────────┬────────────┘                             └────────┬─────────┘
                        ▼                                                   ▼
             Rust Reference Engine                                SQLite / CSV Sinks
        (Timers, Metrics, Validation)                             (Repositories & Cache)
```

*\*Note: Selected auxiliary domains (`holidays`, `patches`, `uiState`, `externalApi`, `locale`) currently fallback to `PersistencePlugin` in Desktop mode and are scheduled for full SQLite migration in Phase 6.*

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
        (AppProviders + Root State Classes + ThemeRegistry)
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

### Phase 6 — Data Reliability & Backend Unification 🚧 (Current Focus)

- [x] JSON Backup & Restore UI (`BackupTab.tsx`)
- [x] Database Explorer & Audit Trail UI (`DbExplorer.tsx` with revision history)
- [ ] **Full SQLite Migration**: Move `holidays`, `patches`, `externalApi`, `uiState`, and `locale` from `PersistencePlugin` fallback into native Rust SQLite tables (`PersistenceCommands.ts`)
- [ ] **Backend State Override**: Implement native `override_state` / transactional import command in Rust so JSON backup restore works natively in Tauri
- [ ] **Validation Boundary Cleanup**: Move remaining frontend validation calls (`validateProjectName`, `validateTaskName`, `validateTaskHierarchy` in data hooks) behind `EngineRouter`
- [ ] **Bindings Deduplication**: Consolidate `src-tauri/bindings/` and `src/bindings/` into a single export target

### Phase 7 — Native Desktop Hardening 🔄 (In Progress)

- [x] System tray menu, localization, and event handlers (`src-tauri/src/tray/`)
- [x] Window management commands (always-on-top per layout, minimize-to-tray, dynamic resizing)
- [x] Global keyboard shortcuts (`useGlobalShortcuts.ts`)
- [ ] IPC payload optimization: Replace full-state `core.load()` calls inside granular `PersistenceCommands` (`rename`, `getProjectId`, `getSubtasks`) with targeted Rust queries
- [ ] System sleep / wake auto-pause daemon verification across OS targets (Windows, Linux, macOS)

### Phase 8 — Productivity Platform & Ecosystem ⏳ (Planned)

- [x] Periodical reports (`ReportView.tsx`) & interactive CLI emulator (`CliInterface.tsx`)
- [x] External Webhook / API push integration (`useExternalApiSync.tsx`)
- [ ] Advanced analytics & graphical time distribution charts
- [ ] Automated workflow triggers & extensible plugin architecture
