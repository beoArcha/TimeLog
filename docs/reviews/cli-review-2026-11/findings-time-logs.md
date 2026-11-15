# Findings - Time Logs (LOG-xx)

Scope: `log add`, `log edit`, `log rm`, `log ls`, duration and timestamp parsing, validation parity between `add` and `edit`. Code references are against `main` b35731eb, paths relative to `src-tauri/src/` unless shown otherwise. Transcript line numbers refer to [evidence/oxy-session-2026-11-14.md](evidence/oxy-session-2026-11-14.md).

Priorities: P0 data loss, wrong data or secret exposure; P1 contract break, blocked or misleading flow; P2 friction; P3 polish.

| ID | Priority | Verification | Title |
| --- | --- | --- | --- |
| LOG-01 | P0 | Verified in code, observed on the binary | `log add` skips every validation that `log edit` applies |
| LOG-02 | P1 | Verified in code, observed on the binary | Duration argument silently dropped or turned into the note |
| LOG-03 | P1 | Verified in code | `log edit --duration` ignores `--end` and `--start` given in the same call |
| LOG-04 | P1 | Verified in code | Naive timestamps are read as UTC and `--tz` does not apply to `log add` / `log edit` |
| LOG-05 | P2 | Observed on the binary | `log ls` prints UTC without a zone marker; JSON timestamps mix formats |
| LOG-06 | P1 | Verified in code | `--exact` disables the `log rm` confirmation and the `start` prompt |
| LOG-07 | P2 | Verified in code, observed on the binary | Log IDs must be typed in full; the prompt shows a prefix the command rejects |
| LOG-08 | P2 | Verified in code (not executed) | Huge durations overflow and panic |
| LOG-09 | P3 | Verified in code | Every `log edit` needs a typed `--reason` (owner decision) |
| LOG-10 | P3 | Observed on the binary | Non-TTY `log rm` without `--yes` deletes immediately (Phase 19 decision, owner decision) |

---

## LOG-01 (P0) `log add` skips every validation that `log edit` applies

- **Evidence:** `cli/handlers/log_handler/add.rs:56` inserts through `persistence.time_logs.insert_full` directly. `Engine::validate_time_log` (`engine/validation.rs:174-215`: end before start, start in the future, overlap with any other log) is reached only from `Engine::edit_log` (`engine/timer.rs:107-110`). The only check in `add.rs` is `start > end` (`add.rs:41-45`).
- **Observed:** transcript 1343-1352 and 1364-1372 (two overlapping entries on the same task, both exit 0), 1374-1383 (`log add "Build landing page" 0m` creates a zero-length row), 1303-1323 (a 45 m manual entry overlapping a live timer, accepted). `log edit -d 30m` on the same data fails with `DOM_BUSINESS_VIOLATION` (1787-1797), so the two commands disagree on one rule. `docs/manifesto/CLI.md` promises that time logs do not overlap.
- **Expected:** `log add` goes through an Engine entry point (`Engine::add_log`) that applies the same `validate_time_log` rules as `edit_log`, rejects zero-length and negative windows, and the browser `EnginePlugin` mirrors it. Overlap -> `DOM_BUSINESS_VIOLATION`, exit 1, with the colliding log ID in `details`.
- **Decision check:** no MASTERMAP item or plan decision allows overlapping retroactive entries; Phase 19 touched `log rm` and quiet mode only.
- **Regression test:** integration (BDT) in `src-tauri/tests/integration/cli/entities/log_test.rs`: given an existing log 09:00-10:00, when `log add` targets 09:30-10:30, then exit 1 and the row count is unchanged; a second case for `0m`, a third for an end in the future. Parity fixture row in `tests/shared/fixtures/cli-parity-cases.json`; unit test for the browser `EnginePlugin` add path in `tests/unit/plugins/`.

## LOG-02 (P1) Duration argument silently dropped or turned into the note

- **Evidence:** `cli/handlers/log_handler/add.rs:109-111`: with `--from` and `--to`, a parsable duration is discarded (`adopt_candidate_as_note` keeps only unparsable text). `add.rs:114-123`: with `--from` and no `--to`, an unparsable duration becomes the note and the end becomes `Utc::now()`.
- **Observed:** transcript 1364-1373: `log add "Build landing page" 2h --from 09:00 --to 10:00` logs 60 minutes, exit 0, no warning.
- **Expected:** a duration together with `--from` and `--to` is a conflict -> `CLI_SYNTAX_INVALID_ARGS`, exit 2. An unparsable duration is always `CLI_SYNTAX_INVALID_DURATION`, exit 2. Notes come only from the third positional or `--note`.
- **Regression test:** integration in `log_test.rs`: given `--from` and `--to`, when a duration is also passed, then exit 2; given `--from` only, when the duration is `45mm`, then exit 2 and no row.

## LOG-03 (P1) `log edit --duration` ignores `--end` and `--start` given in the same call

- **Evidence:** `cli/handlers/log_handler/edit.rs:58-61` computes the start from `calculate_adjusted_start_time(&existing, duration)`, and that function (`edit.rs:93-108`) subtracts the duration from `existing.end_time`, not from `input.end` (`edit.rs:63-66`). When `--start` is given, the `--duration` value is never read (`edit.rs:58-59`).
- **Repro (not executed):** a log 11:00-12:00; `oxy log edit <id> --end 13:00:00Z -d 30m -r fix` stores 11:30-13:00 (90 minutes) instead of 12:30-13:00.
- **Expected:** `--duration` applies to the new end when `--end` is given, and to the new start (end = start + duration) when `--start` is given; all three together is a syntax error.
- **Regression test:** integration in `src-tauri/tests/integration/cli/entities/log_edit_test.rs`: `--end` + `--duration`, `--start` + `--duration`, and the three-flag conflict (`log_edit_test.rs` currently covers `--duration` alone).

## LOG-04 (P1) Naive timestamps are read as UTC and `--tz` does not apply to `log add` / `log edit`

- **Evidence:** `cli/shared/utils.rs:128-139` parses `YYYY-MM-DDTHH:MM:SS` and `YYYY-MM-DD HH:MM:SS` with `from_naive_utc_and_offset(.., Utc)`. `add.rs` and `edit.rs` never receive `tz` (`cli/handlers/mod.rs:48-56` passes it to `log_handler::handle`, which forwards it to `list` only). `log ls` and `report` resolve the same naive input in the user zone through `Engine::resolve_range` (Phase 19, Group A).
- **Expected:** `log add/edit` resolve naive inputs with the same precedence (`--tz` > app timezone setting > system zone) and the confirmation line states the zone. RFC 3339 inputs with an offset keep their offset.
- **Regression test:** unit (AAA) for the shared parser with `Europe/Warsaw`; integration: `log add T --from "2026-11-11 00:30:00" --tz Europe/Warsaw` stores `2026-11-10T23:30:00Z`.

## LOG-05 (P2) `log ls` prints UTC without a zone marker; JSON timestamps mix formats

- **Observed:** transcript 1606-1618: `log list --from 2026-11-11 --to 2026-11-12 --tz Europe/Warsaw` filters correctly but prints the row as `[2026-11-10T23:30:00]`; 1629-1638: `--json` emits `+00:00` and `Z` forms with nanosecond precision in one document.
- **Expected:** human rows show the local time of the resolved zone with an offset; machine output normalizes to whole-second RFC 3339 `Z` (the `ReportDocument` already does this).
- **Regression test:** integration in `log_test.rs` asserting the rendered row for a fixture log under `--tz Europe/Warsaw`; e2e `cli_json_contract_test.rs` assertion that every timestamp in `oxy.log.list` is a whole-second `Z` instant.

## LOG-06 (P1) `--exact` disables the `log rm` confirmation and the `start` prompt

- **Evidence:** `cli/handlers/mod.rs:29` sets `strict = is_machine || args.exact`. `cli/handlers/log_handler/mod.rs:101` builds `TerminalPrompter::new(strict)` and `flow_handler/start.rs:34` does the same; `resolver/prompter.rs:31-33` returns `is_terminal() == false` whenever that flag is set. `remove.rs:70-72` then deletes without asking; `start.rs:70-72` fails with `MissingTarget` instead of prompting.
- **Repro (not executed):** in a terminal, `oxy --exact log rm <id>` deletes without a prompt.
- **Expected:** `--exact` changes resolution only. Prompts depend on machine mode and the TTY (`TerminalPrompter::new(is_machine)`).
- **Regression test:** unit (AAA) in `src-tauri/tests/unit/cli/prompter_test.rs` with a fake prompter: `remove_log` with `strict = true` still asks; integration: `--exact start` with a TTY prompter asks for a target.

## LOG-07 (P2) Log IDs must be typed in full; the prompt shows a prefix the command rejects

- **Evidence:** `edit.rs:47` and `remove.rs:36` call `get_by_id(id)` with the raw argument; `remove.rs:41` builds the prompt label from the first `MIN_MACHINE_PREFIX_LEN` (8) characters.
- **Observed:** transcript 1673-1760 (`log edit bfba2ec3` -> not found, exit 4), 1798 (`--exact log edit bfba2ec3` -> not found, although the `--exact` help promises an 8-character prefix), 1787 (full UUID works). Timer logs get `log_<ms>_<n>` IDs, retroactive logs UUIDs.
- **Expected:** log targets resolve like tasks: exact ID, unique prefix of 8 or more characters, and a `last` keyword for the most recently closed entry (saves copying an ID after `stop`).
- **Regression test:** integration in `log_test.rs` and `log_edit_test.rs`: 8-character unique prefix succeeds, 7 characters fails with exit 4, ambiguous prefix fails with candidates.

## LOG-08 (P2) Huge durations overflow and panic

- **Evidence:** `cli/shared/utils.rs:69-71` multiplies the parsed integer by 60 unchecked (`84`, `91`, `110` likewise). `add.rs:91`, `add.rs:99`, `add.rs:116` and `edit.rs:103` call `chrono::Duration::seconds`, which panics when the value exceeds the chrono range. Not executed.
- **Repro:** `oxy log add <task> 200000000000000`.
- **Expected:** checked arithmetic with an upper bound (for example 24 h x 366) -> `CLI_SYNTAX_INVALID_DURATION`.
- **Regression test:** unit (AAA) in `src-tauri/tests/unit/cli/duration_parser_test.rs` for the overflow boundary.

## LOG-09 (P3) Every `log edit` needs a typed `--reason` (owner decision)

- **Evidence:** `edit.rs:42-45`; `AuditSource::CliEdit` requires a reason in the Engine (`engine/timer.rs:118-120`). This is intentional audit behavior. The UI review decided (D2) that the GUI prefills a default reason the user may change.
- **Owner decision needed:** mirror D2 in the CLI (`-r` optional with the default `cli edit`), or keep the mandatory free text. See README, OD-5.

## LOG-10 (P3) Non-TTY `log rm` without `--yes` deletes immediately

- **Evidence:** `remove.rs:70-72`; MASTERMAP Phase 19 "Confirmed Log Removal" states that non-TTY skips the prompt, and `CLI.md:471` documents it.
- **Observed:** transcript 2031-2040: `log remove <id>` through the non-TTY harness, exit 0, row deleted.
- **Owner decision needed:** a script that forgets `--yes` deletes silently. Keep the decision, or require `--yes` (or machine mode) outside a TTY and fail with exit 2 otherwise. See README, OD-1. Not counted as a defect.