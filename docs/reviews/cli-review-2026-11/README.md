# CLI Review 2026-11 - Consolidated Backlog (native `oxy` and in-app CLI)

Status: scheduled as the CLI half of the Stabilization and Flow Program, Phases 23-28 of the [roadmap](../../manifesto/MASTERMAP.md#stabilization--flow-program--cli-and-ui-phases-2328), together with the [UI/UX flow audit](../ui-ux-flow-audit-2026-11/README.md) packages; the roadmap sets the order. CLIX-47 (the `CLI.md` rebuild) was delivered with this review. Owner decisions OD-1..OD-10 are open.

- Date: 2026-11-14, audited at `main` b35731eb (binary `oxy` 1.14.5 built from that commit).
- Scope: the native `oxy` binary (every command, flag, exit code, envelope and export format) and the in-app CLI in both modes (desktop live mode over `cli_execute`, browser sandbox emulator). The GUI is out of scope; it has its own [UI/UX flow audit](../ui-ux-flow-audit-2026-11/README.md).
- Product principle: "Brazilian Zouk Flow" - fluid, no sharp edges, minimum interactions. Fixing defects and friction comes before new formats and features.
- Method: five Haiku passes (contract inventory, flow and entity handlers, report pipeline, subsystems and sandbox, hands-on session on the real binary) produced unverified summaries; the principal reviewer (Fable) re-read the cited code for every P0 and P1 and most P2 findings, dropped wrong items, merged duplicates and reconciled each finding with the v1.16 plan decisions (D1-D12) and the v1.16 roadmap phases as numbered before this review (19-27); the architect (Main) decided the phase scheme.
- Source findings (repro, evidence, expected behaviour, regression test per item):
  - [findings-timer-and-entities.md](findings-timer-and-entities.md) - TIM-01..TIM-13, RES-01..RES-04 (17: 2 P1, 10 P2, 5 P3)
  - [findings-time-logs.md](findings-time-logs.md) - LOG-01..LOG-10 (10: 1 P0, 4 P1, 3 P2, 2 P3)
  - [findings-reports-and-exporters.md](findings-reports-and-exporters.md) - RPT-01..RPT-16 (16: 5 P1, 7 P2, 4 P3)
  - [findings-machine-contract.md](findings-machine-contract.md) - MCH-01..MCH-11 (11: 2 P1, 6 P2, 3 P3)
  - [findings-subsystems-and-security.md](findings-subsystems-and-security.md) - SUB-01..SUB-10 (10: 1 P0, 3 P1, 4 P2, 2 P3)
  - [findings-in-app-cli-and-parity.md](findings-in-app-cli-and-parity.md) - SBX-01..SBX-13 (13: 1 P1, 10 P2, 2 P3)
  - [findings-docs-drift.md](findings-docs-drift.md) - DOC-01..DOC-65 (the complete CLI.md drift table; the checklist for the CLI.md rebuild)
  - [findings-architecture-and-tests.md](findings-architecture-and-tests.md) - ARC-01..ARC-12 (12: 10 P2, 2 P3)
- Totals without DOC: 89 findings - 2 P0, 17 P1, 50 P2, 20 P3.
- Evidence: the full hands-on transcript is committed at [evidence/oxy-session-2026-11-14.md](evidence/oxy-session-2026-11-14.md) (every command with exit code, stdout and stderr; findings cite its line numbers). Code references are `path:line` against b35731eb. Paths outside the repository use `%TEMP%` placeholders.

## Verification level

| Level | Meaning | Items |
| --- | --- | --- |
| Verified in code | The principal reviewer read the cited lines and confirms the defect | every P0 and P1; all P2 except those below; see the table in each findings file |
| Observed on the binary | Reproduced in the hands-on session (transcript line cited) | LOG-01, LOG-02, LOG-05, LOG-07, LOG-10, TIM-01, TIM-04, TIM-05, TIM-06, TIM-07, TIM-10, TIM-12, RES-02, RPT-02, RPT-09, MCH-01, MCH-02, MCH-03, MCH-06, MCH-07, MCH-09, SUB-03, SUB-04, SUB-05, SUB-06 |
| Helper-reported | Taken from a Haiku pass and not re-read | TIM-09, TIM-11, RPT-08, RPT-10, RPT-12, RPT-16, SBX-05, ARC-09, ARC-10, ARC-11, parts of TIM-06, SUB-08, SBX-09, ARC-03, ARC-07 and the DOC rows marked so |

## Coverage gaps (honest)

- Two findings are verified by reading only and were not executed: LOG-03 (`log edit --duration` with `--end`) and LOG-08 (duration overflow panic). RPT-01 (depth-3 HTML/ODS failure) was derived from the types and `rows.rs`, not from a run.
- The hands-on session ran against a scratch database on Windows through a non-TTY harness, so interactive prompts (ambiguity selection, `log rm` confirmation, `start` without target) were exercised only through unit tests with a fake prompter, not on the binary.
- `src-tauri/tests/integration/cli/error/envelope_test.rs` and the persistence layer behind `db backup`/`db restore` (DOC-40, DOC-41) were not read.
- The in-app CLI was reviewed in code only; no desktop session was driven and no browser sandbox session was recorded.
- XLSX and ODS files were inspected structurally (sheet and row counts), not opened in Excel or LibreOffice (the manual check from PR #148 is still open).
- Stryker was not re-run; ARC-09 repeats the orchestration note.
- No Rust test suite was run for this review (cargo rewrites `Cargo.lock` in this environment); claims about test coverage come from reading the test tree.

## Work packages

Sizes: S < 50 LOC, M 50-200, L > 200 (split before dispatch). Layers: Engine (Rust) and browser `EnginePlugin`, CLI handler, exporter, sandbox, React, docs. Every package ships the regression test named in its findings and updates `CLI.md` for the lines it changes (DOC-xx cross-references in the findings).

### Phase 23 - Correct Data and Safety

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| CLIX-50 | Test baseline: local Vitest passes under parallel cargo load without raising timeouts (next to the UI program's FLOW-29 stale spec, so the suites are a reliable gate for the rest of the program) | ARC-11 | test infra | S |
| CLIX-01 | `log add` goes through the Engine and gets the same validation as `log edit` (overlap, future, zero length), both runtimes | LOG-01, DOC-64 | Engine Rust + browser EnginePlugin + CLI handler + parity fixture | M |
| CLIX-02 | `log add` argument grammar: conflicting duration is an error, unparsable duration is an error, notes only from the note positional or `--note` | LOG-02 | CLI handler | S |
| CLIX-03 | `log edit --duration` applies to the new `--end` or `--start`; three-flag conflict rejected | LOG-03 | CLI handler | S |
| CLIX-04 | Naive timestamps in `log add`/`log edit` resolve in the user zone (`--tz` > setting > system) and the confirmation names the zone | LOG-04, DOC-54 | Engine range helpers + CLI handler | M |
| CLIX-05 | `--exact` no longer disables prompts (`TerminalPrompter::new(is_machine)`) | LOG-06 | CLI handler | S |
| CLIX-06 | Secrets masked in `config ls`/`config get` (`--reveal`), webhook token via `--token-stdin`/env, in-app echo and history redact tokens | SUB-01, SUB-02 | CLI handler + React (CliSession) | M |
| CLIX-07 | `db restore` asks (TTY / `--yes` / machine), writes a pre-restore backup, runs `integrity_check` on the source | SUB-05, DOC-40 | CLI handler + persistence core | M |
| CLIX-08 | Timer rules: archived tasks cannot start (OD-2), `switch` uses the `start` closing rule, `switch` to the running task is `alreadyRunning` | TIM-01, TIM-03 | Engine Rust + browser EnginePlugin + repository SQL + parity | M |
| CLIX-09 | `task done`, `task archive`, `project archive` close the running logs in the same transaction and report it | TIM-02 | Engine Rust + browser EnginePlugin + CLI handler | M |
| CLIX-10 | Billing rounding boundary coverage (old Phase 20 B item) and default-rate fallbacks surfaced as errors in both engines | ARC-09, RPT-15, ARC-08 (billing part) | Engine Rust + browser + tests | M |
| CLIX-11 | Rate-without-currency policy (OD-3) and no zero-amount currency buckets, with parity vectors | RPT-05, RPT-06 | Engine Rust + browser EnginePlugin + parity vectors | M |

### Phase 24 - Reports Flow and Exporter Correctness

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| CLIX-12 | HTML and ODS rendered from `ReportDocument` (ODS keeps the XLSX sheet structure via `exporters/sheets.rs`); `rows.rs` and `report_tree_adapter.rs` deleted; absorbs the open "ODS" item and the adapter removal follow-up | RPT-01, RPT-03, RPT-16, DOC-62 | exporter | L - split: ODS port (M), HTML port (M), adapter removal after CLIX-13 (S) |
| CLIX-13 | Table renderer on `ReportDocument`: `--variant` honoured, billing amounts per project and in the totals line (absorbs "CLI Billing View"), nested subtasks with parent, shares from basis points, honest task-count label | RPT-02, RPT-09, RPT-10, RPT-11, RPT-12 (label), DOC-28, DOC-60 | formatter/exporter | L - split: renderer (M), billing columns (M) |
| CLIX-14 | XLSX conventions: task amount per OD-4, `Start (UTC)`/`End (UTC)` labels, fixed document properties so bytes are reproducible; manual open check in Excel and LibreOffice recorded | RPT-04, RPT-07, RPT-08, DOC-61 | exporter | M |
| CLIX-15 | Cross-format consistency test (absorbs the open Phase 22 C item): totals, entry count, per-project sums and per-task amounts equal across every format and variant | RPT-02, RPT-04 (verification) | tests | M |
| CLIX-16 | Delivery edge cases: `report schema -o -` means stdout; CSV flags in envelope mode decided and documented; variant check before the table branch | RPT-13, RPT-14 | CLI handler | S |

### Phase 25 - Time Tracking Flow: Timer, Tasks and Logs

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| CLIX-17 | Flow messages: names instead of UUIDs, `stop` names the task and the elapsed time, idle status in words, one duration format through `human_duration.rs` (absorbs old Phase 24 B "Flow Messages") | TIM-04, TIM-05, TIM-12, DOC-63 | CLI handler + constants | M |
| CLIX-18 | Lifecycle visibility: hidden-count footer on `task ls`, `task reopen`, `task restore`, `project restore`, completed-task error names the way back, orphan rendering | TIM-06 | CLI handler (+ parser) | M |
| CLIX-19 | `project ls` counts active tasks with plural forms; `project rename` confirms what changed; error lists every accepted flag | TIM-07, TIM-10 | CLI handler | S |
| CLIX-20 | Deterministic default project for `task add` and the confirmation names it | TIM-08 | CLI handler + repository ORDER BY | S |
| CLIX-21 | Resolver: prefix-only ID matching, case-insensitive typo suggestions, strict-mode candidates in `details`, re-prompt on a bad selection | RES-01, RES-02, RES-03, RES-04, DOC-26 | CLI resolver | M |
| CLIX-22 | Log targets by unique 8+ character prefix and `last` | LOG-07 | CLI handler + resolver | M |
| CLIX-23 | `log ls` rows in the resolved zone with offset; machine timestamps whole-second `Z` | LOG-05 | CLI handler | S |
| CLIX-24 | Duration parser: checked arithmetic and an upper bound | LOG-08 | CLI shared utils | S |
| CLIX-25 | Entity command hygiene: same-project `task move` says no-op and the cascade is one transaction, color validation, dashboard lists every active session | TIM-09, TIM-11, TIM-13 | CLI handler + repository | S |
| CLIX-26 | Repository queries for active logs and for overlap-by-window; `log ls` filtered in SQL; resolver loads once per command | ARC-06, ARC-07 | repository + Engine + CLI handler | M |

### Phase 26 - CLI Machine Contract Hardening

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| CLIX-27 | `-q` for every command (semantics per OD-9), `cli_quiet_mode_test.rs` covers all of them | MCH-01, DOC-25 | CLI handler + output | M |
| CLIX-28 | Remediation text per error class (business, missing database file, mask) | MCH-02 | error layer | S |
| CLIX-29 | Error classification: path resolution is `STO_SQLITE_INIT`, `db restore` source code decided, `doctor` and `sink test` failures as structured envelopes, no JSON inside `technical` | MCH-05, DOC-27, DOC-33, DOC-34 | error layer + CLI handler | M |
| CLIX-30 | Machine mode derived from parsed flags; missing subcommand gives an envelope; human-mode clap errors use the oxy banner and did-you-mean format | MCH-04, MCH-06, DOC-24 | `bin/oxy.rs` + error mapping | M |
| CLIX-31 | No decoration on captured values (`config get`, receipts); decoration only on a TTY without `NO_COLOR` through the existing `detect_decoration` | MCH-03 | output | S |
| CLIX-32 | `oxy.log.list` items carry `taskName` and `projectName` | MCH-07 | CLI handler + types/bindings | S |
| CLIX-33 | Envelope conventions per OD-7: error envelope casing, `report schema` export envelope, `oxy.today`/`start` payload identities, `ENG_TIMER_ACTIVE` removed or emitted | MCH-08, MCH-09, MCH-11, DOC-31, DOC-32, DOC-39 | types + error layer + schema | M (breaking, one change) |
| CLIX-34 | Typed resolver storage errors (`ResolveError::Storage(PersistenceError)`) | ARC-04 | CLI resolver + error layer | S |

### Phase 27 - In-App CLI and Sandbox Parity

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| CLIX-35 | Leading global flags routed; `-j`/`-m`/`-q` aliases honoured | SBX-01, SBX-02 | sandbox router + parser | S |
| CLIX-36 | Sandbox validation parity: `log add` grammar and flags, project rename, task rate parsing, parent/project mismatch | SBX-03, SBX-06 | sandbox handlers | M |
| CLIX-37 | Sandbox metrics correct for today, week and subtasks (delegate to the shared browser engine per OD-10) | SBX-04 | sandbox store / browser engine | M |
| CLIX-38 | "Not available in the sandbox" error with a stable code for unmirrored commands | SBX-05 | sandbox router | S |
| CLIX-39 | In-app help reflects the active backend; legacy browser commands fixed (`today` zone, `stop all` on idle, log dates) | SBX-08, SBX-10 | React CLI feature | M |
| CLIX-40 | Sandbox messages mirror the native constants after CLIX-17; one table renderer for sandbox lists | SBX-07, SBX-12 | sandbox handlers | M |
| CLIX-41 | Parity harness: subprocess run of the real binary compared with the sandbox for machine rows; fixture rows for the missing domains; `CLI.md` count fixed | SBX-09, DOC-56 | tests | L - split: harness (M), fixtures (M) |
| CLIX-42 | Shared CLI envelope helpers out of the sandbox router | SBX-11 | React CLI feature | S |
| CLIX-51 | Desktop live mode validates an explicit `--db` path like the binary (no silent database creation) | SBX-13 | Tauri command + CLI shared | S |

### Phase 28 - Shell and Subsystem Truthfulness

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| CLIX-43 | `sink test` reports what it checked ("syntax only, not contacted"), no side effects for CSV | SUB-03, SUB-10, DOC-09 | CLI handler | S |
| CLIX-44 | `doctor --fix` removed or hidden until the recovery manager exists (OD-6) | SUB-04, DOC-17 | parser | S |
| CLIX-45 | `config` key registry with per-key validation (OD-8); drives the secret mask of CLIX-06 | SUB-06, DOC-16 | CLI handler + shared registry | M |
| CLIX-46 | Mask hardening: global flag list shared with clap, built-in names reserved, `$10` tokens | SUB-07, SUB-08, SUB-09, DOC-11, DOC-12 | CLI handler (mask) | M |
| CLIX-47 | `CLI.md` rebuilt from the DOC-01..DOC-65 checklist, including the `cli_machine_locale` note. **Delivered with this review**: `CLI.md` now describes the behaviour at b35731eb and links the known defects here. From now on every fix package updates the `CLI.md` lines it changes in the same PR | DOC-01..DOC-65, MCH-10 | docs | done |

### Phase 34 - Engine Parity, CLI Modularity and Structural Hygiene (structural, after the fix program)

These packages fix no user-visible defect, so they wait for the structural phase instead of delaying the fix program.

| ID | Package | Findings | Layer | Size |
| --- | --- | --- | --- | --- |
| CLIX-48 | Structural hygiene: delete dead code, one home per constant, user-facing strings into `constants.rs`, split `cli_error.rs`, `entity_resolver.rs`, `xml.rs`, `sheets.rs`, HTML template; `unwrap()` and `MockPrompter` out of production | ARC-01, ARC-02, ARC-03, ARC-05 | CLI (Rust) + sandbox TS | L - split per module |
| CLIX-49 | Move `clamping.ts` to `src/common/engine/metrics/` | ARC-08 (location part) | browser engine | S |

## Remaining v1.16 feature work

Items from the orchestration thread and the two plans that are not defects. Items that fix a defect were moved into the packages above and are listed with their new home.

| Item (plan reference) | Status | Target phase |
| --- | --- | --- |
| ODS port to `ReportDocument` (TASK-406, Phase 22 B) | fixes RPT-01, RPT-03 -> CLIX-12 | Phase 24 |
| Legacy adapter removal (`report_tree_adapter.rs`, `rows.rs`) | fixes RPT-01, RPT-16 -> CLIX-12/CLIX-13 | Phase 24 |
| CLI billing view (Phase 22 C) | fixes RPT-09 -> CLIX-13 | Phase 24 |
| Cross-format consistency test (TASK-409, Phase 22 C) | verification of RPT-02/RPT-04 -> CLIX-15 | Phase 24 |
| Phase 20 B "Billing Rounding Coverage" | ARC-09 -> CLIX-10 | Phase 23 |
| `--lang` for locale-dependent formats (TASK-401 note, DOC-10) | feature | Phase 29 - Human-Readable Reports |
| Rust translator over shared dictionaries + 10-locale completeness test (TASK-510, TASK-511) | feature | Phase 29 |
| Shared report layout and SVG charts; Markdown, print HTML, DOCX, ODT; `--entries`, `--no-notes` (TASK-501..506) | feature | Phase 29 |
| Lists and help: `project ls` with rates, help with examples, separated global flags, aliases and short flags shown (TASK-603; DOC-18..DOC-23) | feature; old Phase 24 B "Flow Messages" is absorbed by CLIX-17 | Phase 30 - Terminal Output |
| Empty period output in every format, `contentHash` and export metadata, `--output-dir` with predictable names, pipeline documentation and column dictionary (TASK-703..706; RPT-12, DOC-65) | feature; depends on CLIX-14 determinism | Phase 31 - Pipeline Readiness |
| Browser exporters on `ReportDocument`; missing formats or documented differences (TASK-801, TASK-802) | feature | Phase 32 - Browser Export Parity |
| Localized terminal messages and error `user` layer; `cli_machine_locale` removed or merged (TASK-901, TASK-902; MCH-10, DOC-29, DOC-30); clap help stays English (D12) | feature | Phase 33 - Terminal and Error Localization |
| F2 pre-release contract audit (envelopes, schemas, CSV columns, exit codes) and the `1.16.0` bump via `metadata.json`, CHANGELOG, README, wiki in 6 locales | release gate | Phase 33 (closing items) |
| Sandbox delegation to the Engine (old Phase 28 C note: v1.16 added more mirrors) | architecture; see OD-10 | Phase 34 unless OD-10 pulls it into Phase 27 |
| XLSX manual open check in Excel and LibreOffice (PR #148) | acceptance step | Phase 24 (CLIX-14) |

## Owner decisions needed

| ID | Question | Options | Affects |
| --- | --- | --- | --- |
| OD-1 | `log rm` without `--yes` outside a TTY deletes immediately (Phase 19 decision). Keep, or require `--yes` / machine mode outside a TTY and fail with exit 2 otherwise? | keep (document loudly) / require `--yes` | LOG-10, CLIX-05 |
| OD-2 | May an archived task be started? | refuse like completed (recommended) / allow and show a badge | TIM-01, CLIX-08 |
| OD-3 | A task with a rate but no resolved currency: treat as unconfigured (no amount), or bill in a configured default currency? | unconfigured (recommended) / default currency | RPT-05, CLIX-11 |
| OD-4 | XLSX task amount: direct amount with subtask rows (same as CSV/JSON/XML), or cumulative with a labelled column? | direct + subtask rows (recommended) / cumulative | RPT-04, CLIX-14 |
| OD-5 | `log edit --reason`: keep mandatory free text, or prefill a default like the GUI (UI decision D2)? | keep / default `cli edit` | LOG-09 |
| OD-6 | `doctor --fix`: remove the flag now, or hide it until the recovery manager (new Phase 43) implements it? | remove (recommended) / hide | SUB-04, CLIX-44 |
| OD-7 | Machine contract conventions: break once (camelCase error envelope with `schemaVersion`, `report schema` export envelope, `start`/`today` identities, drop `ENG_TIMER_ACTIVE`) under plan decision D6, or keep and document? | break once (recommended, before 1.16.0) / document | MCH-08, MCH-09, MCH-11, CLIX-33 |
| OD-8 | `config set` with an unknown key: reject with the list of known keys, or warn and store? | reject (recommended) / warn | SUB-06, CLIX-45 |
| OD-9 | `-q` for read commands: `status` prints active task IDs, `today` the total seconds, `doctor` nothing on success? | as proposed / suppress all output | MCH-01, CLIX-27 |
| OD-10 | Sandbox parity: patch the mirrors in Phase 27, or pull the Engine delegation (new Phase 34 C) forward for timer ops and metrics? | delegate (recommended for SBX-04, SBX-07) / patch | SBX-04, SBX-07, CLIX-37, CLIX-40 |

## Works well - keep

- Exit codes are consistent between human and JSON mode for the main classes (2 syntax, 3 storage, 4 entity, 5 engine, 1 business).
- Machine stdout is pure: one JSON line per command, errors on stderr as an envelope with `code`, `category`, `exit_code`; `report -f json -o -` writes the bare document.
- Totals reconcile across CSV, JSON, XLSX and the table (937.71 PLN = 93771 minor units in the session); CSV `--csv-delimiter ';' --bom` and the rejections of `|` and `--bom` with JSON behave as documented.
- `report schema` (JSON, XSD, `--target envelope`) and the rejected `--format xml --target envelope` combination work as documented.
- Period presets including Monday-start weeks select the expected days; empty ranges give a clear message and zero totals; `--tz` filtering is correct.
- Name resolution: case-insensitive substrings, `--exact`, 8+ character task ID prefixes and a human-mode ambiguity error with candidates.
- Timer flow: `start` on the running task is idempotent, `stop --if-running` is a clean no-op, `start` on another task auto-stops the previous one and reports it.
- `db backup`, `db restore` and `doctor` work; mask aliases substitute `$1`; `config set cli_machine_locale` validates values; `status --json` fails loudly on a dangling active log instead of hiding it.

## Architecture decisions (Main, 2026-11-14)

1. **Phase numbering.** Phases 1-22 keep their numbers. Phase 22 (Data Exporters v2) is closed: its open items (ODS, billing view, cross-format test) fix defects and moved into CLIX-12, CLIX-13 and CLIX-15 in Phase 24, and `--lang` moved to Phase 29. Phase 20's open "Billing Rounding Coverage" moved into CLIX-10 (Phase 23). The Stabilization and Flow Program takes Phases 23-28 and absorbs the UI/UX flow program (former Phases 38-41). The remaining v1.16 feature phases follow as 29-33 (former 23-27) and the former Phases 28-37 become 34-43.
2. **Flow messages.** CLIX-17 absorbs the former Phase 24 B item "Flow Messages"; Phase 30 keeps "Lists and Help". CLIX-31 stays in Phase 26 because script safety depends on it.
3. **Structural hygiene.** CLIX-48 and CLIX-49 fix no user-visible defect, so they moved to Phase 34 (CLI Modularity and Structural Hygiene) and Phase 28 covers only truthfulness.
4. **Sandbox delegation.** OD-10 stays with the owner. Until it is answered, Phase 27 lists CLIX-37 and CLIX-40 as written, and the Phase 34 delegation item notes that it may be pulled forward.
5. **`CLI.md`.** The rebuild (CLIX-47) was delivered with this review so that the contract document is accurate during the fix program. Each fix PR updates the lines it changes.
6. **Parity serialization.** CLIX-01, CLIX-08, CLIX-09 and CLIX-11 touch both engines and the parity fixtures, like FLOW-01 and FLOW-30 in the UI program; only one engine PR per fixture file is open at a time.
7. **Test baseline first.** CLIX-50 joins FLOW-29 at the start of Phase 23 so that local and CI suites are a reliable gate for the rest of the program.
