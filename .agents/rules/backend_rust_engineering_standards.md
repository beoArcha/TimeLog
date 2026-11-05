---
trigger: always_on
---

# Backend & Rust Engineering Standards

Rules for native Rust and Tauri code in `src-tauri/`. Test rules live in `testing_standards.md`.

## 1. Layering

- `engine/` owns timer lifecycle, metrics and validation. Rust is the reference implementation; the browser `EnginePlugin` mirrors it.
- `repositories/` and `persistence/` store data only. Raw SQL stays inside `repositories/`. *(enforced: `sql_isolation_test.rs`)*
- `types/` is a leaf module and imports no higher layer. *(enforced: `layer_boundaries_test.rs`)*
- `cli/`, `engine/`, `persistence/`, `repositories/`, `types/` and `sinks/` never import Tauri GUI types (`AppState`, `tauri::AppHandle`, `tauri::WebviewWindow`, `tauri::Manager`, tray controllers). *(enforced: `tauri_isolation_test.rs`)*
- No module dependency cycles. *(enforced: `cyclic_dependencies_test.rs`)*
- Types shared with the frontend derive `ts_rs::TS` and are exported to `src/bindings/` (see Commands in `AGENTS.md`).

## 2. Domain Modeling

### 2.1. No primitive obsession

- Domain concepts with semantics, validation rules or a bounded set of values are not passed as `&str` / `String`.
- A function taking more than 3 primitive string parameters must take a parameter object or domain DTO instead (`NewTimeLog`, `TimeLogUpdateHistory`, `ProjectInput`).
- Never use `#[allow(clippy::too_many_arguments)]`; restructure the parameters.

### 2.2. Enums for bounded sets

- Audit sources, entity kinds, export formats and execution targets are enums (`AuditSource`, `EntityType`, `ExportFormat`), never free-form strings.
- CLI arguments representing bounded sets implement `clap::ValueEnum`.

## 3. User-Facing Strings

- Terminal output, table headers, badges, notices and error messages are `pub const &str` in the module's `constants.rs`, not inline literals in handlers.
- `str::replace("{}", val)` replaces every occurrence. For templates with several placeholders use sequential `replacen("{}", val, 1)` or a formatting macro, and keep `{}` as the only placeholder style.

## 4. Errors

### 4.1. Typed errors only

- Functions never return `Result<_, String>`, `Result<_, &str>`, `Result<_, Box<dyn Error>>`, `Result<_, ()>` or `Result<_, anyhow::Error>`. *(enforced: `error_handling_test.rs`, empty allowlist)*
- Each subsystem defines its own `thiserror::Error` enum with variants that carry structured context.

### 4.2. Missing entities are failures

- An operation targeting an entity that does not exist returns a typed error (`CliError::Entity(ResolveError::NotFound { .. })`), never a silent `Ok(())`.
- Check existence before dispatching the update (`get(&id)?.ok_or_else(...)`).

### 4.3. CLI exit codes

The single source of truth is `src-tauri/src/cli/shared/constants.rs`, mapped in `CliError::exit_code()`:

| Code | Constant | Meaning |
| --- | --- | --- |
| `0` | `EXIT_CODE_SUCCESS` | Success |
| `1` | `EXIT_CODE_GENERIC_FAILURE` | Business rule violation |
| `2` | `EXIT_CODE_CLI_SYNTAX` | Invalid syntax or arguments |
| `3` | `EXIT_CODE_STORAGE_ERROR` | SQLite / storage failure |
| `4` | `EXIT_CODE_ENTITY_ERROR` | Entity not found, ambiguous match, did-you-mean |
| `5` | `EXIT_CODE_ENGINE_ERROR` | Timer lifecycle or engine conflict |

Changing a code or its mapping is a breaking change of the CLI contract: update `docs/manifesto/CLI.md` and the parity fixtures in the same change.

### 4.4. Zero Silent Fallbacks & Infrastructure Error Handling

- **Never Swallow Infrastructure Errors**: Never convert database, storage, filesystem or other infrastructure failures into `None`, empty values or silent defaults using `.ok()`, `unwrap_or_default()` or empty catch handlers.
- **Distinguish Missing Data from Failed Operations**:
  - `Ok(None)` means that the requested record or optional value does not exist. A documented default may be applied where the domain contract allows it.
  - `Err(...)` means that the operation failed. Infrastructure failures must remain distinguishable from missing data and must be propagated or explicitly handled.
- **No Implicit Recovery**: A fallback is allowed only when it is an intentional part of the domain or protocol contract. It must not conceal an operation failure or make an unsuccessful operation appear successful.
- **Secondary Error Preservation**: When resolving locale, configuration or context for an error response:
  - Preserve the original command failure as the primary error.
  - Use a safe fallback representation only when required to produce a valid response.
  - Do not replace, discard or downgrade the primary error because preparation of the error response also failed.
  - Preserve secondary failure information through the diagnostic mechanism available at the current project phase.
- **Explicit Best-Effort Operations**: Operations that are intentionally best-effort must make that intent visible in the code and must not silently discard failures that affect data integrity, user-visible outcomes or system reliability.

### 4.5. Diagnostic Handling & Stdout Purity

- **No Unobservable Error Handling**: Do not treat a diagnostic logging call as proof that an error was recorded. Follow the diagnostic mechanism currently available in the project.
- **Preserve Diagnostic Context**: Important failures must retain enough structured context to identify the failing operation and its origin, without exposing credentials or sensitive payloads.
- **Strict Stdout Purity in Machine Mode**: When `--machine` or `--json` is active, stdout is reserved exclusively for the documented machine-readable response contract. Diagnostic output must never corrupt or precede the JSON response.
- **Current Logging Scope**: Do not introduce or mandate a new logging backend, global logger initialization strategy, file format, rotation policy or retention mechanism as part of an unrelated feature.
- **Centralized Logging Roadmap**: Native Rust error handling and diagnostic logging implementation details are governed by Phase 23 of `docs/manifesto/MASTERMAP.md`. Changes that implement or advance that phase must follow its architecture and acceptance criteria.
- **Current Machine-Mode Stream Contract**: Until Phase 23 is implemented, follow the current tested CLI contract in `testing_standards.md`: machine-readable stdout must remain pure and diagnostics are directed to stderr. Any change to stderr behavior must be migrated together with Phase 23 and its subprocess tests.

## 5. Handler Structure & Configuration Semantics

- Top-level command handlers (`match cmd { ... }`) are thin dispatchers, around 30 lines at most.
- Each subcommand branch delegates to a dedicated function (`create_task(...)`, `archive_task(...)`); no complex logic inline in match arms.
- **Effective Defaults vs Stored Records**: When implementing configuration subsystems, `config get <key>` returns the effective runtime default (e.g. `"en"` for unconfigured `cli_machine_locale`), while `config ls` lists only explicitly persisted database entries. Do not mutate persistence merely to display defaults in `ls`.

## 6. General

- Idiomatic Rust; propagate errors with `?` instead of panicking on recoverable failures.
- `bun run lint:rust` (clippy with `-D warnings`) and `bun run fmt:rust:check` must pass.
