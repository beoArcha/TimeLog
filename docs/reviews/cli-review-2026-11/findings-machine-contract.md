# Findings - Machine Contract (MCH-xx)

Scope: success and error envelopes, error codes vs exit codes, remediation text, `-q` coverage, stdout purity, and human-output prefixes that break scripts. Code references are against `main` b35731eb, paths relative to `src-tauri/src/`. Transcript line numbers refer to [evidence/oxy-session-2026-11-14.md](evidence/oxy-session-2026-11-14.md).

| ID | Priority | Verification | Title |
| --- | --- | --- | --- |
| MCH-01 | P1 | Verified in code, observed on the binary | `-q` is ignored by `stop`, `status`, `today`, the dashboard, `config`, `sink`, `mask`, `db` and `doctor` |
| MCH-02 | P1 | Verified in code, observed on the binary | Remediation text is wrong for business errors and for a missing database file |
| MCH-03 | P2 | Verified in code, observed on the binary | Every human success line is prefixed with a check mark, including captured values |
| MCH-04 | P2 | Verified in code | Machine mode is detected by scanning every argv token; a missing subcommand prints clap text in machine mode |
| MCH-05 | P2 | Verified in code | Error classification gaps: path resolution, `db restore` source, `doctor` and `sink test` failures |
| MCH-06 | P2 | Verified in code | Human-mode clap errors and oxy errors use two different formats |
| MCH-07 | P2 | Observed on the binary | `log ls --json` carries IDs only, no task or project names |
| MCH-08 | P2 | Verified in code (documented) | Error envelope keys are snake_case, `report schema -o --machine` is not an envelope |
| MCH-09 | P3 | Verified in code (documented) | `oxy today --json` wraps a document that carries its own `schema`; `start` without a target emits `oxy.status` |
| MCH-10 | P3 | Verified in code | `cli_machine_locale` is validated and stored but changes no output |
| MCH-11 | P3 | Verified in code | `ENG_TIMER_ACTIVE` is declared and documented but never emitted |

Related: strict-mode ambiguity without candidates is RES-02 in [findings-timer-and-entities.md](findings-timer-and-entities.md); `MSK_ALIAS_NOT_FOUND` exits 2 by design (`cli_error.rs:106-112`, documented in `CLI.md`), so it is not listed as a defect.

Verified as working: machine stdout is one JSON line (`--machine status`, transcript 1097), errors go to stderr as an envelope with `code`, `category`, `exit_code` (2858, 2935), `report -f json -o -` prints the bare document (2325), exit codes 1-5 match `shared/constants.rs:47-52` for the main classes.

---

## MCH-01 (P1) `-q` is ignored by `stop`, `status`, `today`, the dashboard, `config`, `sink`, `mask`, `db` and `doctor`

- **Evidence:** `cli/handlers/mod.rs:36` (`handle_stop` has no quiet parameter; `flow_handler/stop.rs:40` always returns the message), `:40-41` (`status`, `today`), `:32` (dashboard), `:66-74` (subsystems). `CLI.md:188` calls `-q` "one contract".
- **Observed:** transcript 1012 (`-q status` full output), 1024 (`-q stop` full line), 1034 (`-q today` full summary).
- **Expected:** owner decision OD-9 for the read commands; proposal: `stop` prints the closed time-log ID(s), `status` prints active task IDs one per line (nothing when idle), `today` prints the total seconds, subsystem mutations print the key, name or path, `doctor` prints nothing on success.
- **Regression test:** e2e `src-tauri/tests/e2e/cli_quiet_mode_test.rs` extended to every command (today it covers `task add` and `project ls` only).

## MCH-02 (P1) Remediation text is wrong for business errors and for a missing database file

- **Evidence:** `cli/error/cli_error.rs:274-277` gives `CliError::Business` the entity remediation `MSG_ERR_REMEDIATION_ENTITY` ("Verify the target entity using 'oxy task ls' or 'oxy project ls'."); `:255-265` gives every storage error, including `Initialization` for a missing `--db` file, `MSG_ERR_REMEDIATION_STORAGE` ("Check file system permissions and disk capacity").
- **Observed:** transcript 1353-1363 (start after end), 3739-3749 (duplicate project), 3400-3410 (`mask remove` of a missing alias) all print the entity remediation; 2955-2965 (`--db nodb-here.db`) prints the disk-capacity advice.
- **Expected:** one remediation per error class: business -> "Adjust the inputs: <rule>"; `STO_SQLITE_INIT` missing file -> "Pass an existing --db path or let the desktop app create it"; mask -> "Run 'oxy mask ls'".
- **Regression test:** unit (AAA) in `src-tauri/tests/unit/cli/error_test.rs` per variant.

## MCH-03 (P2) Every human success line is prefixed with a check mark, including captured values

- **Evidence:** `cli/shared/output.rs:86` renders `CliOutput::Success` through `OUT_SUCCESS` (`handlers/constants.rs:143`, "{check mark} {}"). `config_handler.rs:103` returns the raw value as `Success`, so `oxy config get cli_machine_locale` prints the mark before `en`; the report table header, `sink test`, `doctor` and `db backup` get the same prefix. `formatters/decoration.rs` (`detect_decoration`, Phase 30 (old 24) Group A) has no caller, so `NO_COLOR` and TTY detection never apply.
- **Observed:** transcript 3071 (`config get`), 2107 (report header), 3322 (sink test), 3439 (doctor).
- **Expected:** values that a script may capture (`config get`, `-q` outputs, `report -o <path>` receipt) carry no decoration; decoration appears only on a TTY without `NO_COLOR`, through the existing `detect_decoration`.
- **Regression test:** e2e `cli_binary_smoke_test.rs`: `config get cli_machine_locale` with stdout piped prints exactly `en`.

## MCH-04 (P2) Machine mode is detected by scanning every argv token; a missing subcommand prints clap text in machine mode

- **Evidence:** `bin/oxy.rs:11-13` treats any argv element equal to `-m`, `-j`, `--machine` or `--json` as machine mode, including positional values (a note or task name typed as `--json` after `--`). `bin/oxy.rs:79-83` excludes `DisplayHelpOnMissingArgumentOrSubcommand`, so `oxy --machine project` prints clap help text to stderr and exits with the clap code instead of a JSON envelope. `CLI.md:404` says only help and version are unaffected.
- **Expected:** derive machine mode from the parsed global flags (clap already parses twice); a missing subcommand in machine mode is `CLI_SYNTAX_INVALID_ARGS` in an envelope.
- **Regression test:** e2e `cli_parser_error_envelope_test.rs`: `oxy --json project` emits an envelope; `oxy task add -- --json` creates a task named `--json` without switching modes.

## MCH-05 (P2) Error classification gaps: path resolution, `db restore` source, `doctor` and `sink test` failures

- **Evidence:** `bin/oxy.rs:34-41` wraps a path resolution failure as `PersistenceError::Storage`, which maps to `STO_SQLITE_QUERY` (`cli_error.rs:170`) instead of `STO_SQLITE_INIT`. `handlers/db_handler.rs:80-84` reports a missing restore source as `CLI_SYNTAX_INVALID_ARGS` (exit 2) while a missing `--db` file is `STO_SQLITE_INIT` (exit 3). `handlers/doctor_handler.rs:172-179` and `:204-209` turn a failed check into `DOM_BUSINESS_VIOLATION` with the pretty-printed JSON report pasted into `technical`; `handlers/sink_handler.rs:201-208` does the same with `SNK_EXTERNAL_IO`. Machine consumers must parse JSON inside a string.
- **Expected:** path failure -> `STO_SQLITE_INIT`; restore source missing -> `DOM_ENTITY_NOT_FOUND` (exit 4) or a storage code, one choice documented; `doctor` and `sink test` failures emit their normal envelope with `overallStatus: "error"` on stdout and exit 1, or put the structured report into `details`.
- **Regression test:** e2e `cli_json_contract_test.rs` for `doctor` with a broken database file and `sink test` with an unwritable directory: stdout is one envelope, no JSON inside `technical`.

## MCH-06 (P2) Human-mode clap errors and oxy errors use two different formats

- **Evidence:** `bin/oxy.rs:90` calls `err.exit()` for non-machine clap errors, so `oxy frobnicate` and `log list --limit 0` print clap prose while every other failure prints the `Error [CODE]:` banner with `Remediation:` (`error/envelope.rs:38-59`).
- **Observed:** transcript 2844-2857 and 1661-1672 vs 1353.
- **Expected:** clap errors are mapped through `map_clap_error` in human mode too and rendered with the same banner; the clap tip for unknown subcommands ("a similar subcommand exists: 't'") is replaced by the oxy did-you-mean format.
- **Regression test:** e2e `cli_parser_error_envelope_test.rs` human-mode case.

## MCH-07 (P2) `log ls --json` carries IDs only, no task or project names

- **Observed:** transcript 1576-1585 and 1862: `oxy.log.list` items are raw `TimeLog` rows; `oxy.status` already includes `taskName` and `projectName`.
- **Expected:** `LogListPayload` items gain `taskName` and `projectName` (additive, no schema break).
- **Regression test:** e2e `cli_json_contract_test.rs` assertion on the two fields.

## MCH-08 (P2) Error envelope keys are snake_case, `report schema -o --machine` is not an envelope

- **Evidence:** `types/cli.rs:76-88` (`CliErrorEnvelope`, no `rename_all`; `exit_code`), while `details` inside it is camelCase (`types/cli.rs:49`) and every success envelope is camelCase (`types/cli.rs:111`). `handlers/report_schema_handler.rs:30-36` prints `{ status, exported_path, schema, schema_version }` outside the envelope. Both are documented in `CLI.md:363` and `:388-393`, and `CLI.md:234` still says "All JSON keys are camelCase at every depth".
- **Expected:** owner decision OD-7: break once under decision D6 (camelCase error envelope with `schemaVersion`, `oxy.report.schema.export` envelope) or keep both conventions and fix the sentence at `CLI.md:234`.
- **Regression test:** `src-tauri/tests/integration/cli/error/envelope_test.rs` key-casing assertion once decided.

## MCH-09 (P3) `oxy today --json` wraps a document that carries its own `schema`; `start` without a target emits `oxy.status`

- **Evidence:** `flow_handler/today.rs` wraps the `ReportDocument` (`schema: oxy.report`, `schemaVersion: 2`, `types/report.rs:80-84`) in `oxy.today` v1; `flow_handler/start.rs:62-66` returns the `oxy.status` envelope from the `start` command. Both are documented (`CLI.md:242`, `:255`).
- **Observed:** transcript 992-1001.
- **Expected:** low priority; record in the column dictionary that `oxy.today.data` is a `ReportDocument`, and consider an `oxy.start` payload with `action: "alreadyRunning"` and the active sessions under OD-7.

## MCH-10 (P3) `cli_machine_locale` is validated and stored but changes no output

- **Evidence:** `cli_error.rs:219-222` omits the `user` layer in machine mode, so the resolved locale (`cli/mod.rs:73-90`) feeds nothing; human mode passes no locale. `CLI.md:514` says the CLI reads its envelope locale from the key.
- **Expected:** Phase 33 (Terminal and Error Localization) decides whether the key is removed or merged with `cli_locale`; until then `CLI.md` must state that the key has no effect on output (DOC-29).
- **Regression test:** none until Phase 33.

## MCH-11 (P3) `ENG_TIMER_ACTIVE` is declared and documented but never emitted

- **Evidence:** `cli/error/codes.rs:21`, `:53`, `:83`; no `CliError` variant maps to it (`cli_error.rs:137-200`). `CLI.md:445` marks it "not yet emitted".
- **Expected:** remove the code from the enum and the docs, or map the completed-task refusal to it. Owner decision folded into OD-7.