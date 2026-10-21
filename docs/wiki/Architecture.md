# 🏛️ System Architecture & Engineering

> *Audience: Software architects, contributors, and developers seeking deep insight into oXyFlow's architectural boundaries, layer separation, and cross-runtime parity.*

oXyFlow implements a **Clean Architecture** with strict layer isolation enforced by automated AST-scanning architecture test suites on both the TypeScript frontend (`tests/architecture/`) and Rust native backend (`src-tauri/tests/architecture/`).

---

## 1. High-Level Architectural Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 Presentation UI                        │
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
│  - Hierarchy & Invariants   │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ SQLite Persistence Layer    │
│  - Rusqlite MicroORM        │
│  - Memory Cache & Journal   │
└─────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 The Triple Decoupling Rule

Every component and subsystem in oXyFlow strictly adheres to triple decoupling:

1. **Decoupled from Localization**: Components never assert or branch on localized copy. UI queries rely exclusively on semantic data-testids or role attributes.
2. **Decoupled from Theming & CSS**: Theme variables are applied via semantic tokens (`bg-card`, `text-foreground`). Components never branch on `resolvedTheme === 'dark'` or inject inline styles.
3. **Decoupled from Native Runtime Side-Effects**: React components and hooks never directly check `window.__TAURI__` or issue raw IPC commands. All communication flows through polymorphic routers.

### 2.2 Cross-Runtime Engine Parity

The core business logic (timer state transitions, elapsed time calculations across date boundaries, and validation rules) exists in two mirroring implementations:

- **Rust Reference Engine** (`src-tauri/src/engine/`): Reference implementation utilizing UTC timestamps and SQLite persistence.
- **TypeScript Browser Engine** (`src/plugins/engine/`): Mirror implementation using LocalStorage for browser-based development and demo deployments.

Parity between runtimes is continuously verified by:

- `CrossRuntimeParity.test.ts` (Vitest)
- Shared fixture matrix: `tests/shared/fixtures/cli-parity-cases.json`
- Native Cargo integration tests: `parity_matrix_test.rs`

### 2.3 Strict Primitive Isolation

Raw HTML form and table tags (`<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<tr>`, `<td>`, etc.) are prohibited in feature views. All interactive elements must derive from atomic design primitives in `src/components/ui/` to guarantee accessibility (`aria-*`), keyboard focus traps, and design token consistency.

---

## 3. Storage & Database Schema

The SQLite schema utilizes strict foreign keys, foreign-key cascades, and indices:

- `projects`: Primary project container (id, name, color, archived, created_at, updated_at).
- `tasks`: Actionable tasks with parent-child hierarchical self-reference (`parent_task_id`), completion flag, and completion timestamp.
- `time_logs`: Immutable logged work intervals (`start_time`, `end_time`, `note`, `manually_entered`). Active sessions have `end_time = NULL`.
- `cli_settings`: Key-value storage for terminal configuration, action masks, and sink endpoints.

For low-level contracts and repository methods, see [`docs/ENGINEERING.md`](file:///c:/Users/Krzysiu/Source/TimeLog/docs/ENGINEERING.md).
