# 🏛️ System Architecture & Engineering

> 🌐 **Language / Język**: **English** | [Polski](/pl/architektura.md)

---

oXyFlow implements a **Clean Architecture** with strict layer isolation enforced by automated AST-scanning architecture test suites on both the TypeScript frontend (`tests/architecture/`) and Rust native backend (`src-tauri/tests/architecture/`).

---

## 1. High-Level Architectural Diagram

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

1. **Decoupled from Localization**: Components never assert or branch on localized copy. UI queries rely exclusively on semantic `data-testid` or role attributes.
2. **Decoupled from Theming & CSS**: Theme variables are applied via semantic tokens (`bg-card`, `text-foreground`). Components never branch on `resolvedTheme === 'dark'` or inject inline styles.
3. **Decoupled from Native Runtime Side-Effects**: React components and hooks never directly check `window.__TAURI__` or issue raw IPC commands. All communication flows through polymorphic routers (`EngineRouter`, `PersistenceRouter`).

### 2.2 Cross-Runtime Engine Parity

The core business logic (timer state transitions, elapsed time calculations across date boundaries, and validation rules) exists in two mirroring implementations:

- **Rust Reference Engine** (`src-tauri/src/engine/`): Native compiled performance for desktop targets.
- **Browser Engine Plugin** (`src/plugins/engine/`): Pure TypeScript fallback ensuring 100% feature fidelity in web preview and development modes.

A shared parity test suite (`CrossRuntimeParity.test.ts`) executes identical test matrices against both engines to prevent behavioral drift.
