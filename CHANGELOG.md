# Changelog

All notable changes to **oXyFlow** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- **Layer Encapsulation & Repository Error Boundary**:
  - Strictly encapsulated `RepositoryError` within the persistence layer; eliminated abstraction leakage where `RepositoryError` was directly convertible to `AppError` or `CliError`.
  - Added `PersistenceError::ConstraintViolation` capturing SQLite foreign key and uniqueness constraint failures, mapping to `"STO_SQLITE_CONSTRAINT"` at the IPC boundary.
  - Standardized entity lookup errors in Tauri persistence commands (`commands/persistence/project.rs`, `task.rs`) to typed `PersistenceError::NotFound`, eliminating ad-hoc string formatting and emitting canonical `"DOM_ENTITY_NOT_FOUND"` error codes.
  - Replaced error-swallowing `.ok()` timestamp parsing in workflow daemon steps (`workflow_run_daemon_step`) with explicit ISO 8601 validation propagating `EngineError::ParseTime` and returning `"DOM_INVALID_TIMESTAMP"`.

- **CLI Error Contract & Exit Codes**:
  - Standardized machine mode error envelopes: under `--machine` / `-m` and `--json` / `-j`, error payloads emit clean single-line JSON to `stderr` with the `"user"` suggestion block omitted to guarantee deterministic automation parsing.
  - Fixed command syntax classification: unimplemented subcommands (such as `oxy manage project list`) now return exit code `2` (`EXIT_CODE_CLI_SYNTAX`) with `CLI_SYNTAX_UNKNOWN_COMMAND` instead of a silent no-op.
  - Fixed sink error classification: `oxy sink set-csv` with empty or whitespace-only paths returns exit code `2` (`CLI_SYNTAX_INVALID_ARGS`), while inaccessible filesystem destinations return exit code `1` (`SNK_EXTERNAL_IO`) instead of leaking SQLite storage errors.
  - Fixed sink diagnostic reporting: `oxy sink test` reports full diagnostics and returns exit code `1` (`SNK_EXTERNAL_IO`) when any configured sink fails its synthetic health check.
  - Wired entity name validation: creating or renaming projects, tasks, or subtasks via `oxy manage` now validates non-empty names against `Engine` validation rules, returning exit code `1` (`ENG_OPERATION_FAILED`) on blank inputs.

### Added

- **Backend Error Handling Verification & Parity**:
  - Added unit test suite `src-tauri/tests/unit/cli/manage_test.rs` covering exit codes for unimplemented commands and entity validation failures.
  - Added integration test `test_given_unhealthy_sink_when_testing_sinks_then_fails_with_exit_code_1_and_snk_external_io` in `src-tauri/tests/integration/cli/subsystems/sinks_test.rs`.
  - Added unit tests for ISO 8601 timestamp parsing and error propagation in `src-tauri/tests/unit/workflow/daemon_test.rs`.
  - Extended cross-runtime CLI parity fixtures (`cli-parity-cases.json`) with entity not found error cases.

---

## [1.8.2] - 2026-10-23

### Fixed in 1.8.2

- **Atomic Timer Start & Rollback (`Engine::start_timer`)**:
  - Replaced multi-connection autocommit operations in `Engine::start_timer` with an atomic SQLite transaction using `TransactionBehavior::Immediate` in `repositories::business::time_logs::start_active_log`.
  - Added full rollback on failure: any error during timer start or switch (such as I/O error or constraint failure) triggers an automatic SQLite rollback, preserving previous active timers and preventing state loss.
  - Eliminated N+1 project queries and silent error swallowing: removed `_ => Ok(None)` and `if let Ok` masking, replacing sequential checks with `CLOSE_ACTIVE_LOGS_NON_CONCURRENT` SQL query and strictly propagating errors via `?`.
  - Resolved TOCTOU race condition: concurrent timer starts across multiple threads now serialize on `Immediate` write locks, preventing multiple active logs for projects with `allow_concurrency = false`.
  - Hardened frontend state synchronization in `useTimerManager.ts`: added `try ... finally` block to guarantee `repositoryState` re-syncs with persisted state (`core.load()`) even when timer start/stop commands throw errors.
- **Backend Persistence Recovery & Data Loss Prevention**:
  - Replaced lossy `.ok()` error swallowing during SQLite row mapping (`projects.rs`, `tasks.rs`, `holidays.rs`, `workflow.rs`) with explicit deserialization error propagation via `RepositoryError::Serialization`, preventing database corruption and silent `NULL` overwrites on edit.
  - Fixed `override_state` transactional isolation: partial imports now strictly preserve unmentioned entity domains (projects/tasks/logs) instead of wiping unrelated tables.
  - Replaced silent directory creation failure (`paths.rs`) with explicit I/O error propagation, preventing misleading application launch on corrupted settings.
- **Frontend LocalStorage Quarantine & Parity**:
  - Hardened `LocalStorageStateStore` against silent database wipes: corrupted JSON syntax errors now transition the store into a quarantined state (`isCorrupted`), preventing corrupted storage from being overwritten by an empty default state.
  - Enforced missing entity validation: `LocalStorageTasksPersistence` and `LocalStorageTimeLogsPersistence` now throw typed `PersistenceException` (`ERR_PERSISTENCE_TASK_NOT_FOUND`, `ERR_PERSISTENCE_LOG_NOT_FOUND`) on update/delete of non-existent IDs.
  - Eliminated empty `catch` blocks in frontend persistence services, ensuring logging and error visibility via `ErrorHandler`.
- **CLI & Engine Error Contract & Exit Codes**:
  - Fixed `time_logs.delete` and `oxy log rm`: deleting non-existent time logs now returns `DOM_ENTITY_NOT_FOUND` with exit code `4` (`EXIT_CODE_ENTITY_ERROR`) instead of apparent success (`0`).
  - Fixed `Engine::stop_timer`: stopping an idle timer now returns `ENG_TIMER_INACTIVE` with exit code `5` (`EXIT_CODE_ENGINE_ERROR`).
  - Added dedicated `EntityType::TimeLog`, `EntityType::ConfigKey`, `EntityType::MaskAlias` with clear error messages, eliminating incorrect mapping of time logs to tasks.
  - Reclassified missing config key and mask alias lookups from syntax errors (`2`) to entity not found errors (`4`).
  - Isolated export file I/O failures to typed `SinkError::Io` with error code `SNK_EXTERNAL_IO` and exit code `1`, avoiding misleading SQLite error codes.
  - Unified duration calculations across CLI glance and today handlers by delegating directly to `Engine::calculate_log_elapsed` and propagating `EngineError::ParseTime`.

### Added in 1.8.2

- **Transactional Rollback & Multi-Threaded Concurrency Tests**:
  - Added `src-tauri/tests/integration/timer/atomic_start_test.rs` validating rollback on simulated SQLite insert failures and task existence validation.
  - Added rollback test in `src-tauri/tests/integration/timer/atomic_switch_test.rs`.
  - Added multi-threaded test `src-tauri/tests/integration/timer/concurrency_test.rs` utilizing `std::thread::spawn` to verify active timer consistency during concurrent starts.
- **Fault Injection & Error Contract Test Suites**:
  - Added integration tests for non-existent log deletion, idle timer stopping, missing config key lookup, missing mask alias removal, and invalid export target paths.
  - Added unit and fault injection tests for SQLite JSON corruption and LocalStorage quarantine behavior.

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
