# Changelog

All notable changes to **oXyFlow** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.8.2] - 2026-10-23

### Fixed in 1.8.2

- **Atomic Timer Start & Rollback (`Engine::start_timer`)**:
  - Replaced multi-connection autocommit operations in `Engine::start_timer` with an atomic SQLite transaction using `TransactionBehavior::Immediate` in `repositories::business::time_logs::start_active_log`.
  - Added full rollback on failure: any error during timer start or switch (such as I/O error or constraint failure) triggers an automatic SQLite rollback, preserving previous active timers and preventing state loss.
  - Eliminated N+1 project queries and silent error swallowing: removed `_ => Ok(None)` and `if let Ok` masking, replacing sequential checks with `CLOSE_ACTIVE_LOGS_NON_CONCURRENT` SQL query and strictly propagating errors via `?`.
  - Resolved TOCTOU race condition: concurrent timer starts across multiple threads now serialize on `Immediate` write locks, preventing multiple active logs for projects with `allow_concurrency = false`.
  - Hardened frontend state synchronization in `useTimerManager.ts`: added `try ... finally` block to guarantee `repositoryState` re-syncs with persisted state (`core.load()`) even when timer start/stop commands throw errors.

### Added in 1.8.2

- **Transactional Rollback & Multi-Threaded Concurrency Tests**:
  - Added `src-tauri/tests/integration/timer/atomic_start_test.rs` validating rollback on simulated SQLite insert failures and task existence validation.
  - Added rollback test in `src-tauri/tests/integration/timer/atomic_switch_test.rs`.
  - Added multi-threaded test `src-tauri/tests/integration/timer/concurrency_test.rs` utilizing `std::thread::spawn` to verify active timer consistency during concurrent starts.

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
