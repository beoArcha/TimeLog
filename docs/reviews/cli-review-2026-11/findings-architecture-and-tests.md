# Findings - Architecture and Tests (ARC-xx)

Scope: files over 300 LOC, dead code, duplicated constants, error typing, performance of the CLI paths, test-tier gaps and the orchestration follow-ups (`clamping.ts`, `getDefaultRateCents`, Stryker mutants, `status --json` loading all logs, local Vitest timeouts). Code references are against `main` b35731eb; Rust paths relative to `src-tauri/src/`, TypeScript paths relative to the repo root.

| ID | Priority | Verification | Title |
| --- | --- | --- | --- |
| ARC-01 | P2 | Verified (line counts) | Thirteen production files over 300 LOC, eight in CLI scope |
| ARC-02 | P2 | Verified (grep) | Dead code in exporters, formatters, constants and the error codes |
| ARC-03 | P2 | Verified (sample) | Duplicated constants and inline user-facing literals |
| ARC-04 | P2 | Verified in code | Resolver storage errors are stringly typed and always become `STO_SQLITE_QUERY` |
| ARC-05 | P3 | Verified in code | `unwrap()` in production resolver and prompter code; a test double lives in production |
| ARC-06 | P2 | Verified in code | `status --json` and the dashboard scan the whole time-log table |
| ARC-07 | P2 | Verified in code (validation), helper-reported (lists) | Full-table scans in `validate_time_log`, `log ls`, the resolver and `project ls` |
| ARC-08 | P2 | Verified in code | Browser follow-ups: `clamping.ts` location and `getDefaultRateCents` swallowing errors |
| ARC-09 | P2 | Helper-reported | 26 surviving Stryker mutants in banker's rounding |
| ARC-10 | P2 | Helper-reported | Test-tier gaps for the defects in this review |
| ARC-11 | P3 | Helper-reported | Local full Vitest run times out under parallel cargo load |
| ARC-12 | P2 | Verified (Rust side) | Engine parity gap on the project filter (UI review FLOW-30) |

---

## ARC-01 (P2) Thirteen production files over 300 LOC, eight in CLI scope

- **Evidence (`wc -l` on `src-tauri/src` and `src`):** `cli/error/cli_error.rs` 404, `cli/resolver/entity_resolver.rs` 382, `engine/billing.rs` 345, `cli/exporters/xml.rs` 343, `types/timelog.rs` 339, `repositories/business/constants.rs` 338, `repositories/shared/mod.rs` 334, `cli/exporters/sheets.rs` 328, `types/report.rs` 326, `repositories/business/override_state.rs` 320, `commands/persistence/project.rs` 315, `cli/exporters/constants.rs` 308 (200 lines of HTML template), `commands/persistence/task.rs` 307; TypeScript: `src/features/cli/sandbox/sandboxEmulatorStore.ts` 344, `src/features/cli/sandbox/router/handlers/sandboxFlowHandlers.ts` 316.
- **Expected (per `code_quality_standards.md`, split only along responsibilities):** `cli_error.rs` into variant definitions, exit/code mapping and envelope rendering; `entity_resolver.rs` into resolve, match and display; `xml.rs` escape helpers out of the writer; `sheets.rs` summary vs entries/days; the HTML template into its own file. The files outside CLI scope are listed for the hygiene phase.
- **Regression test:** the existing LOC architecture rule.

## ARC-02 (P2) Dead code in exporters, formatters, constants and the error codes

- **Evidence (grep for call sites under `src-tauri/src`):** `exporters/json.rs` `export_json`, `exporters/xml.rs` `export_xml` and `sanitize_xml_text`, `exporters/mod.rs` `export_to_writer`, `export_to_bytes`, `export_to_file` (production uses the `_with_options` variants; only re-exports remain), `exporters/constants.rs` `ERR_UNSUPPORTED_FORMAT`, `formatters/table.rs` (`render_table`) and `formatters/decoration.rs` (`detect_decoration`, so `NO_COLOR` is never consulted), `ReportTreeDto.entries` (RPT-16), `schemas/xml/report/v1/report.xsd` (TS test only), eight unused hint constants in `handlers/constants.rs` (`MSG_NO_PROJECTS_EXIST`, `MSG_NO_TARGET_SPECIFIED`, `MSG_PROJECT_NOT_FOUND`, `MSG_TASK_NOT_FOUND`, `MSG_SUBTASK_CREATED`, `MSG_NO_SUBTASKS_FOUND`, `ERR_DATE_RANGE_INVALID`), `CliErrorCode::EngTimerActive` (MCH-11), `parse_date_bound(.., true)` branch (`shared/utils.rs:140-145`, only caller passes `false`).
- **Expected:** delete, or wire where the feature exists (`detect_decoration` belongs to MCH-03; `MSG_NO_PROJECTS_EXIST` belongs to the `task add` error).
- **Regression test:** none; clippy `dead_code` cannot see through `pub use`, so a periodic grep stays in the review checklist.

## ARC-03 (P2) Duplicated constants and inline user-facing literals

- **Evidence:** `MSG_NO_REPORT_DATA` in `exporters/constants.rs:14` and `formatters/constants.rs:18` (same text); 3600, 10 000 basis points and 100 minor units defined in `engine/reports/constants.rs`, `exporters/csv_records.rs`, `exporters/sheets.rs`, `exporters/xlsx.rs` (helper-reported); duration output shapes in `formatters/constants.rs` and `formatters/human_duration.rs`. Inline literals against `backend_rust_engineering_standards.md` section 3: `log_handler/add.rs:42-44` ("Log start time cannot be after end time."), `sink_handler.rs:182-183, 222, 243` ("healthy", "URL endpoint syntax verified", ...), `mask_handler.rs:226` ("Circular macro/alias expansion limit exceeded"), `task_handler/create.rs`, `billing_input.rs`, `task_handler/update.rs` (helper-reported).
- **Expected:** one home per constant; strings in the module `constants.rs`.
- **Regression test:** an architecture rule that flags string literals passed to `business_custom`/`syntax_invalid_args` outside `constants.rs`.

## ARC-04 (P2) Resolver storage errors are stringly typed and always become `STO_SQLITE_QUERY`

- **Evidence:** `ResolveError::StorageError(String)` (`entity_resolver.rs:52`, helper-reported); `cli_error.rs:160` maps it to `StoSqliteQuery` regardless of the original `PersistenceError` variant, and `cli_error.rs:314-321` rebuilds a `PersistenceError::Storage(msg)` from the string.
- **Expected:** `ResolveError::Storage(#[from] PersistenceError)` so initialization and constraint errors keep their codes.
- **Regression test:** unit in `src-tauri/tests/unit/cli/error_test.rs` mapping a constraint violation through the resolver.

## ARC-05 (P3) `unwrap()` in production resolver and prompter code; a test double lives in production

- **Evidence:** `entity_resolver.rs:347` (`matches.into_iter().next().unwrap()` after a length check); `MockPrompter` in `resolver/prompter.rs` with `lock().unwrap()` (helper-reported `:203, :215`).
- **Expected:** `expect`-free pattern (`match matches.as_slice()`); move `MockPrompter` to `src-tauri/tests/shared/`.

## ARC-06 (P2) `status --json` and the dashboard scan the whole time-log table

- **Evidence:** `flow_handler/status.rs:39-45` calls `time_logs.get_all()` and filters `end_time.is_none()`; the human path uses `query_active` (`status.rs:19`), which returns task IDs only. The dashboard calls `active_sessions` and then `build_report`, which loads every log again (`dashboard.rs:40-41`, `engine/reports/mod.rs:52-60`). Orchestration follow-up from PR-20b.
- **Expected:** a repository query returning the active `TimeLog` rows (`SELECT ... WHERE end_time IS NULL`), used by both `status` paths and by `Engine::get_state`.
- **Regression test:** integration in `src-tauri/tests/integration/` for the new query; the `sql_isolation_test.rs` rule keeps the SQL in the repository.

## ARC-07 (P2) Full-table scans in `validate_time_log`, `log ls`, the resolver and `project ls`

- **Evidence:** `engine/validation.rs:197-214` loads and parses every log on each edit and fails the whole edit when any unrelated row has an unparsable timestamp (`?` on `parse_utc_timestamp`). Helper-reported: `log_handler/list.rs:48-67, 156-160` filters in memory and does a linear task lookup per row; `entity_resolver.rs:134-138, 160-164` loads the full table per resolve; `project_handler.rs:130` counts with a nested filter.
- **Expected:** an overlap query by task and window in the repository; `log ls` filtered in SQL with a task map; the resolver loads once per command.
- **Regression test:** integration for the overlap query; a performance smoke test with 10 000 logs under the 60 s rule is optional.

## ARC-08 (P2) Browser follow-ups: `clamping.ts` location and `getDefaultRateCents` swallowing errors

- **Evidence:** `src/plugins/engine/metrics/clamping.ts` holds shared clamping logic that the report builder in `src/common/engine/reports/` depends on (orchestration follow-up from the PR-14 split); `src/plugins/engine/services/BrowserBillingEngine.ts:36-46` catches every error and returns `null` (see RPT-15).
- **Expected:** move `clamping.ts` to `src/common/engine/metrics/`; propagate the persistence error.
- **Regression test:** `engine-boundary` architecture test; Vitest unit with a rejecting `runtimeConfigs.getAll`.

## ARC-09 (P2) 26 surviving Stryker mutants in banker's rounding

- **Evidence (helper-reported, not re-run):** `src/common/engine/billing/utils.ts:60-70` (`doubleR > divisor`, `< divisor`, parity branch); MASTERMAP Phase 20 Group B "Billing Rounding Coverage" is the open item and moves into Phase 23 (CLIX-10).
- **Expected:** boundary assertions for exactly-half, just-below and just-above half, odd and even quotients, negative inputs, in `tests/unit/common/engine/billing/`.
- **Regression test:** `bun run test:mutation` with zero survivors on that file.

## ARC-10 (P2) Test-tier gaps for the defects in this review

- **Evidence (helper-reported from the test tree):** no test starts an archived task (TIM-01); none completes or archives while a timer runs (TIM-02); none for `log add` overlap, zero or future (LOG-01); none for `log edit --duration` with `--end`/`--start` (LOG-03); none for naive timestamp zone semantics (LOG-04); none for duration overflow (LOG-08); no `-q` test for `stop`, `today`, `status` (MCH-01); none for `--exact log rm` (LOG-06); none for human `switch` output or switching to the running task (TIM-03); none for depth-3 HTML/ODS (RPT-01); none for `config` secrets (SUB-01); `cli_quiet_mode_test.rs` covers two commands. `src-tauri/tests/integration/cli/error/envelope_test.rs` was not read.
- **Expected:** each finding names its regression test; the work packages ship them.

## ARC-11 (P3) Local full Vitest run times out under parallel cargo load

- **Evidence (orchestration note):** architecture hook tests at 10 s and `TimezoneSettingsCard` at 5 s fail locally only while cargo compiles in parallel; CI is green.
- **Expected:** keep the 5 s rule (`testing_standards.md` section 9) and make the slow tests cheaper (fixture reuse, fewer AST passes) rather than raising timeouts; document a `--maxWorkers` hint for local runs next to cargo.

## ARC-12 (P2) Engine parity gap on the project filter (UI review FLOW-30)

- **Evidence:** `engine/metrics/range.rs:51-57` filters on `log.project_id`; the browser engine filters on `task.projectId ?? log.projectId` (helper-reported). Scheduled in the UI review as FLOW-30 and carried into Phase 23 with the UI items; listed here because the CLI `report -p` and `log ls -p` depend on the same rule.
- **Regression test:** parity fixture in `tests/fixtures/report-parity-vectors.json`.