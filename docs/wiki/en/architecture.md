# System Architecture and Engineering

> Language / Język: **English** | [Polski](/pl/architecture.md) | [Deutsch](/de/architecture.md) | [Español](/es/architecture.md) | [Français](/fr/architecture.md) | [Português](/pt-br/architecture.md)

---

oXyFlow implements a Clean Architecture with strict layer isolation enforced by automated AST-scanning architecture test suites on both the TypeScript frontend (`tests/architecture/`) and Rust native backend (`src-tauri/tests/architecture/`).

---

## High-Level Architectural Topology

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Presentation UI                        │
│         (Tailwind CSS tokens, declarative orchestrator hooks)          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌────────────────────┐
│     EngineRouter      │                           │ PersistenceRouter  │
│  (IRouter<IEngine>)   │                           │(IRouter<IPersist>) │
└──────────┬────────────┘                           └─────────┬──────────┘
           │                                                  │
           ├──────────────────────────────┬───────────────────┤
           ▼                              ▼                   ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────┐
│     Tauri Desktop IPC       │  │        Browser Plugin Runtime         │
│ (IPC bridge to Rust Engine) │  │  (EnginePlugin + PersistencePlugin)   │
└──────────┬──────────────────┘  └───────────────────────────────────────┘
           ▼
┌─────────────────────────────┐
│    Rust Reference Engine    │
│  - Timer Lifecycle State    │
│  - Range & Elapsed Metrics  │
│  - Temporal Invariants      │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ SQLite Persistence Layer    │
│  - Rusqlite Repositories    │
│  - WAL Mode & Transactions  │
└─────────────────────────────┘
```

---

## Core Architectural Invariants

### 1. The Triple Decoupling Rule

1. **Decoupled from Localization**: Components never assert or branch on localized copy. UI tests and queries rely exclusively on `data-testid` or ARIA accessibility roles.
2. **Decoupled from Theming and CSS**: Visual styling uses semantic tokens (`bg-card`, `text-foreground`). Components never branch on `resolvedTheme === 'dark'` or inject hardcoded hex color values.
3. **Decoupled from Native Runtime Side-Effects**: Shared React components and hooks never check `window.__TAURI__` or issue raw IPC calls. All operations pass through polymorphic routers (`EngineRouter`, `PersistenceRouter`).

### 2. Cross-Runtime Engine Parity

Core business rules (timer state transitions, elapsed time calculations across date boundaries, and validation rules) exist in two mirroring implementations:

- **Rust Reference Engine** (`src-tauri/src/engine/`): Compiled native performance for desktop targets.
- **Browser Engine Plugin** (`src/plugins/engine/`): Pure TypeScript fallback ensuring 100% feature fidelity in web preview and development modes.

A shared parity test suite (`CrossRuntimeParity.test.ts`) executes identical test matrices against both engines to prevent behavioral drift.

### 3. Rule of 3 Ifs (Cyclomatic Complexity Limit)

Across both TypeScript and Rust modules, the maximum allowed nested `if` depth is 2. Three or more nested `if` statements are forbidden and automatically fail architecture test suites (`max-nested-ifs.arch.test.ts` and `max_nested_ifs_test.rs`). Complex logic must be decomposed into guard clauses, match expressions, or dedicated domain strategies.

### 4. Headless CLI Isolation

The native CLI binary (`src-tauri/src/cli/`) communicates directly with `Engine` and `Persistence` contracts. It is strictly prohibited from importing any Tauri GUI types (`AppState`, `tauri::AppHandle`, window controllers, or tray components).
