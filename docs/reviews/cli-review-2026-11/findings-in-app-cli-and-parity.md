# Findings - In-App CLI and Parity (SBX-xx)

Scope: the desktop live mode (`cli_execute` IPC), the browser sandbox emulator, the legacy browser command set, leading global flags, the parity harness and duplicated engine logic. Code references are against `main` b35731eb; TypeScript paths are relative to the repo root, Rust paths to `src-tauri/src/`.

| ID | Priority | Verification | Title |
| --- | --- | --- | --- |
| SBX-01 | P1 | Verified in code | Leading global flags (`--json start`, `-q`, `--exact`, `--tz`, `--db`) are not routed in the sandbox |
| SBX-02 | P2 | Verified in code | Short `-j` / `-m` are parsed but never honoured |
| SBX-03 | P2 | Verified in code | Sandbox `log add` invents a 30-minute default, turns an invalid duration into 0 s and ignores `--from`, `--to`, `--note` |
| SBX-04 | P2 | Verified in code | Sandbox metrics: today and this-week totals equal all-time, task totals exclude subtasks |
| SBX-05 | P2 | Helper-reported | Missing sandbox commands fall through to "Unknown command" |
| SBX-06 | P2 | Verified in code | Sandbox accepts an empty project rename, any task rate string and a parent/project mismatch |
| SBX-07 | P2 | Verified in code | Human text diverges from the native binary for every flow command |
| SBX-08 | P2 | Verified in code | Desktop in-app help lists legacy commands that the native parser rejects |
| SBX-09 | P2 | Verified in code (harness), helper-reported (coverage) | Parity harness compares nothing with the native binary and misses whole domains |
| SBX-10 | P2 | Verified in code | Legacy browser commands: UTC "today", `stop all` succeeds on idle, truncated log dates |
| SBX-11 | P3 | Verified in code | `entityResolver.ts` depends on the sandbox router |
| SBX-12 | P3 | Verified in code | Sandbox project list footer has four columns, the header three |
| SBX-13 | P2 | Verified in code | Desktop live mode creates a new empty database for a mistyped `--db` path |

Checked and dropped: `readPersistedSandboxState` resets to demo data on a parse error but reports it through `ErrorHandler` (`src/features/cli/sandbox/store/sandboxStorage.ts:19-35`), so the fallback is observable; sandbox `log rm` without a prompt matches the non-TTY rule.

---

## SBX-01 (P1) Leading global flags are not routed in the sandbox

- **Evidence:** `src/features/cli/sandbox/sandboxCommandRouter.ts:50-53` takes `tokens[0]` as the domain, so `--json start` falls to `default: return false` (`:154-155`) and `cliEngine.ts:262-264` prints "Unknown command". Native clap declares every global flag with `global = true` (`cli/parser/mod.rs:19-74`) and accepts both positions. Orchestration follow-up from PR-03.
- **Expected:** the router strips leading global flags (with their values for `--tz`, `--db`) before dispatch and merges them into `flags`.
- **Regression test:** parity fixture rows with leading `--json`/`-q`/`--exact` in `tests/shared/fixtures/cli-parity-cases.json`; unit in `tests/unit/features/cli/`.

## SBX-02 (P2) Short `-j` / `-m` are parsed but never honoured

- **Evidence:** `sandboxArgsParser.ts:7-27` lists `j` and `m` as boolean flags, but `sandboxEnvelope.ts:39-41` (`isMachineMode`) and `src/features/cli/resolver/entityResolver.ts:62-67` (`isStrictResolution`) read `json`/`machine` only.
- **Expected:** one alias map (`j -> json`, `m -> machine`, `q -> quiet`) applied in the parser.
- **Regression test:** unit on `parseFlags` and `isMachineMode`.

## SBX-03 (P2) Sandbox `log add` invents a 30-minute default, turns an invalid duration into 0 s and ignores `--from`, `--to`, `--note`

- **Evidence:** `src/features/cli/sandbox/router/handlers/sandboxLogHandlers.ts:163` (`durationStr ? parseDurationToSeconds(durationStr) : 1800`), `:23-24` (`isNaN(numeric) ? 0 : numeric * 60`), `:147-170` reads positionals only, so the flags are dropped. Native requires a duration or `--from` and rejects `banana` (transcript 1384).
- **Expected:** mirror the native grammar after LOG-02 is fixed: required duration or `--from`, `CLI_SYNTAX_INVALID_DURATION` on bad input, `--from`/`--to`/`--note` supported.
- **Regression test:** parity fixture rows for `log add` with `--from/--to`, with an invalid duration and with no duration.

## SBX-04 (P2) Sandbox metrics: today and this-week totals equal all-time, task totals exclude subtasks

- **Evidence:** `src/features/cli/sandbox/sandboxMetricsCalculator.ts:50-53` adds every log to `totalElapsedSeconds`, `todayElapsedSeconds` and `thisWeekElapsedSeconds` alike; `:58-60` adds to the task only, never to its parent, while the Rust engine rolls subtasks up (helper-reported `engine/metrics/computed.rs:139-150`).
- **Expected:** owner decision OD-10: delegate the sandbox to the shared browser engine (MASTERMAP old Phase 28 Group C, new Phase 34) instead of fixing the mirror.
- **Regression test:** parity fixture for `project ls` totals with a subtask and a log from yesterday.

## SBX-05 (P2) Missing sandbox commands fall through to "Unknown command"

- **Evidence (helper-reported):** `log edit`, `task reparent`, `task move`, `report` formats and `-o`, `sink`, `mask`, `config`, `doctor`, `db` and the bare `oxy` glance are not routed; the user sees `CLI_SYNTAX_UNKNOWN_COMMAND` for a command that exists natively.
- **Expected:** a dedicated "not available in the sandbox" error (exit 2, stable code) listing the native alternative, until the command is mirrored or delegated.
- **Regression test:** parity fixture rows asserting the specific code.

## SBX-06 (P2) Sandbox accepts an empty project rename, any task rate string and a parent/project mismatch

- **Evidence:** `sandboxProjectHandlers.ts:105` (`newName || project.name`), `sandboxTaskHandlers.ts:174-181` stores the raw rate string, `sandboxTaskHandlers.ts:115-129` lets `-p` override the project derived from `-P`, while native rejects the mismatch (`task_handler/create.rs`, helper-reported).
- **Expected:** mirror native validation (`CLI_SYNTAX_INVALID_ARGS`, rate parsing through the shared billing utils).
- **Regression test:** parity fixture rows for each case.

## SBX-07 (P2) Human text diverges from the native binary for every flow command

- **Evidence:** `sandboxFlowHandlers.ts:171` ("Timer started: ...") vs `handlers/constants.rs:136`; sandbox `stop` names the task while native does not; `status` and `today` texts differ (helper-reported). The parity fixture tolerates this through substring patterns.
- **Expected:** after the native messages are rewritten (TIM-04, TIM-05, TIM-12) the sandbox mirrors the same constants, or delegates (OD-10).
- **Regression test:** parity fixture patterns tightened to full lines.

## SBX-08 (P2) Desktop in-app help lists legacy commands that the native parser rejects

- **Evidence:** `cliEngine.ts:125-145` prints `addproject`, `projects`, `tasks`, `logs`, `holidays`, `time`, `complete`, `renameproject`, `addsubtask`, `renametask`; in desktop live mode every line except `clear` and `sandbox` is forwarded to native clap (`cliEngine.ts:106-108`), which has none of them (`cli/parser/mod.rs:78-128`).
- **Expected:** help reflects the active backend (native help in live mode, sandbox command list in sandbox mode).
- **Regression test:** Vitest unit in `tests/unit/features/cli/` for `help` in both modes.

## SBX-09 (P2) Parity harness compares nothing with the native binary and misses whole domains

- **Evidence:** `tests/integration/cli/cli-cross-runtime-parity.test.ts:93-125` runs the sandbox only and passes when any expected substring appears; the Rust side (`src-tauri/tests/integration/cli/parity/parity_matrix_test.rs`) calls `handle_cli` in-process. The fixture has 63 rows (`CLI.md` still says 39, DOC-56) and no rows for `sink`, `mask`, `config`, `doctor`, `db`, `report` formats, `log edit`, `task rate/reparent/move`, `--rate-cents`, `--currency`, `-j`/`-m`, leading global flags, `--db` or `log ls -l` (helper-reported).
- **Expected:** a subprocess run of the real `oxy` binary for the machine-mode rows, comparing envelope `data` with the sandbox envelope; fixture coverage for the missing domains.
- **Regression test:** the harness itself.

## SBX-10 (P2) Legacy browser commands: UTC "today", `stop all` succeeds on idle, truncated log dates

- **Evidence:** `src/features/cli/commands/timerCommands.ts:182` (`new Date().toISOString().slice(0, 10)`), `:124-127` (`stop all` reports success with zero timers), `src/features/cli/commands/logsCommand.ts:63` (`toLocaleTimeString().substring(0, 10)` in the date column).
- **Expected:** `today` uses the Engine range resolution (`resolveRangeAt`); `stop all` on idle fails with `ENG_TIMER_INACTIVE` like native; the log table shows a date and a time.
- **Regression test:** Vitest unit tests for the three commands with `MockProviders`.

## SBX-11 (P3) `entityResolver.ts` depends on the sandbox router

- **Evidence:** `src/features/cli/resolver/entityResolver.ts:3` imports `buildErrorEnvelope` and `isMachineMode` from `../sandbox/router/sandboxEnvelope`, so the shared resolver depends on one of its consumers.
- **Expected:** move the envelope helpers to a shared module under `src/features/cli/shared/`.
- **Regression test:** the `circular-dependencies` architecture test plus an import-boundary rule.

## SBX-12 (P3) Sandbox project list footer has four columns, the header three

- **Evidence:** `sandboxProjectHandlers.ts:30-32` vs `:48`.
- **Expected:** one table renderer shared with the other sandbox lists.
- **Regression test:** unit golden for `project ls` in the sandbox.

## SBX-13 (P2) Desktop live mode creates a new empty database for a mistyped `--db` path

- **Evidence:** `commands/cli.rs:38-60` resolves an early `--db` flag and opens it with `Persistence::new`, which creates the file; it never calls `cli::shared::validate_db_target`, which the native binary runs before dispatch (`bin/oxy.rs:27`, `cli/shared/db_target.rs:29-33`). Found by the PR reviewer, not by the helper passes.
- **Expected:** the in-app terminal applies the same rule as the binary (Phase 19/31 "No Silent Database Creation"): an explicit `--db` path that does not exist fails with `STO_SQLITE_INIT` and exit code 3, in human and machine mode.
- **Regression test:** Rust integration test for `execute_command_string` with a non-existent `--db` path asserting the error envelope and that no file was created.
