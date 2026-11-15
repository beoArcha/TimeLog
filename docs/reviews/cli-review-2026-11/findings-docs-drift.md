# Findings - Documentation Drift (DOC-xx)

Scope: `docs/manifesto/CLI.md` against the code at `main` b35731eb. This table is the checklist for the CLI.md rebuild (CLIX-47): every row is either fixed in the document or, when the code is the defect, cross-referenced to its finding. Line numbers in the "CLI.md says" column are CLI.md's own; code paths are relative to `src-tauri/src/`.

Verification: rows marked "Verified" were read by the principal reviewer in both CLI.md and the cited code; "Helper-reported" rows come from the contract inventory pass and were not re-read. Kinds: `wrong` (doc contradicts code), `missing-in-code` (doc promises what code lacks; mark `[PLANNED]` or remove), `missing-in-docs` (code has it, doc does not), `stale` (outdated or misleading wording).

## Commands, flags and syntax

| ID | Item | CLI.md says | Code does | Kind | Verification |
| --- | --- | --- | --- | --- | --- |
| DOC-01 | `timer` command group | `oxy timer start`, `timer stop`, `timer log` (105, 138-141) | no `timer` group; `start`, `stop` are top level (`parser/mod.rs:80-84`); transcript 3208 | wrong | Verified |
| DOC-02 | `start` target | target required (138) | optional; prompts or reports status (`flow_handler/start.rs:56-79`) | wrong | Verified |
| DOC-03 | `timer log` | documented (141) | use `log add` (`parser/tier2_entities.rs:178-198`) | wrong | Verified |
| DOC-04 | `task archive -p` | `oxy task archive <id> -p <project-id>` (133) | `archive` takes only `<target>` (`tier2_entities.rs:147-151`) | wrong | Verified |
| DOC-05 | `task complete` semantics | "Toggles `completed: true`" (134) | sets `completed = true` only (`task_handler/update.rs:96`) | stale | Verified |
| DOC-06 | `subtask create` | `oxy subtask create -t <parent-id>` (137) | `task add -P/--parent` (`tier2_entities.rs:98-99`) | wrong | Verified |
| DOC-07 | `sink set csv` | `oxy sink set csv --dir` (159) | `sink set-csv -d/--dir` (`tier3_subsystems.rs:127-131`); CLI.md:270 uses the right name | wrong | Verified |
| DOC-08 | `sink set webhook` | `oxy sink set webhook` (160) | `sink set-webhook` (`tier3_subsystems.rs:132-138`) | wrong | Verified |
| DOC-09 | `sink test` semantics | "Synthetic event verification", "green checkmarks" (161) | webhook: URL prefix check only (`sink_handler.rs:220-226`); see SUB-03 | wrong | Verified |
| DOC-10 | `--lang` | "Strict English (`--lang en`)" (90) | no `--lang` in `CliArgs` (`parser/mod.rs:19-74`) | missing-in-code, mark `[PLANNED]` (Phase 29) | Verified |
| DOC-11 | Built-in compound masks | "Built-in Compound Actions" (92), `switch`, `wrap-up` (116, 122) | masks expand templates only (`mask_handler.rs:141-165`) | missing-in-code | Verified |
| DOC-12 | Mask tokens | "`$1..$9`" (164) | any `$N`, plus `$LAST` and `$LAST_TASK` (`mask_handler.rs:144-161`) | stale | Verified |
| DOC-13 | Interactive flows in the matrix | prompts for project name/color (128), confirmations (129, 133), format selector (150), directory prompt (159); line 124 calls the matrix "target command design" | only three prompts exist: `start` target, `log rm`, ambiguous selection | missing-in-code; mark each row `[PLANNED]` or drop the column | Verified |
| DOC-14 | Create-on-the-spot | "create it on the spot" (463) | selector among existing matches only (`resolver/prompter.rs:36-61`) | missing-in-code | Verified |
| DOC-15 | Report format list | `table\|html\|csv\|json\|xml\|ods\|xlsx` (150) | `jsonl` also (`tier3_subsystems.rs:90-100`); listed at 343 | wrong (incomplete) | Verified |
| DOC-16 | `config set` validation | "Validates supported keys and values" (156) | only `cli_machine_locale` (`config_handler.rs:119-123`); see SUB-06 | wrong | Verified |
| DOC-17 | `doctor --fix` | `oxy doctor` only (153) | `--fix` exists and is a no-op (`doctor_handler.rs:22`); see SUB-04 | missing-in-docs | Verified |
| DOC-18 | `task list -a`, `project list -a` | not documented | `--all` on both (`tier2_entities.rs:12-16`, `:85-86`) | missing-in-docs | Helper-reported |
| DOC-19 | `task add -P/--parent` | not documented | `tier2_entities.rs:98-99` | missing-in-docs | Verified |
| DOC-20 | `log add --note` | positional note only (143) | `--note` long flag (`tier2_entities.rs:196-197`) | missing-in-docs | Verified |
| DOC-21 | `--version` / `-V` | not documented | `parser/mod.rs:21-24` | missing-in-docs | Helper-reported |
| DOC-22 | Command aliases | none listed | 11 top-level (`s sp sw st summary p proj t l rep alias`) and 19 subcommand aliases (`parser/mod.rs:80-127`, `tier2_entities.rs`, `tier3_subsystems.rs`); transcript 3158-3207 | missing-in-docs | Verified (sample) |
| DOC-23 | Short flags | long names only | `-d/-n/-r` on `log edit`, `-u/-d` on sink, `-c` on project, `-y` on `log rm` | missing-in-docs | Verified (sample) |
| DOC-24 | Machine mode, missing subcommand | "help and version output are unaffected" (404) | `oxy --machine <group>` prints clap text (`bin/oxy.rs:79-83, 90`); see MCH-04 | missing-in-docs | Verified |
| DOC-25 | `-q` scope | "one contract" (188), partial list (190-201) | ignored by `stop`, `status`, `today`, dashboard, `config`, `sink`, `mask`, `db`, `doctor` (`handlers/mod.rs`); see MCH-01 | missing-in-docs | Verified |
| DOC-26 | Lenient matching | "fuzzy matching, substring matching, prefixes < 8 characters, and suggestions are human-mode only" (465) | also ID suffix and ID substring (`entity_resolver.rs:317-321, 338`); see RES-01 | missing-in-docs | Verified |
| DOC-27 | `db restore` exit codes | not documented | missing source = exit 2, missing `--db` = exit 3; see MCH-05 | missing-in-docs | Verified |

## Output, envelopes and errors

| ID | Item | CLI.md says | Code does | Kind | Verification |
| --- | --- | --- | --- | --- | --- |
| DOC-28 | Billing in reports | "Billing-aware CLI report output is not implemented yet" (316) | CSV, JSON, JSONL, XML and XLSX carry rates, amounts and totals; CLI.md:346-351 documents the columns | wrong (self-contradictory) | Verified |
| DOC-29 | `cli_machine_locale` effect | reads the envelope locale from the key (514); locale-selected machine output (103) | no output depends on it (`cli_error.rs:219-222`); see MCH-10 | wrong | Verified |
| DOC-30 | Locale list | nine locales, no `uk` (512, 517) | ten locales including `uk` (`handlers/constants.rs:84-86`); parser help at `tier3_subsystems.rs:188` also omits `uk` | stale (doc and help) | Verified |
| DOC-31 | JSON key casing | "All JSON keys are camelCase at every depth" (234) | error envelope snake_case (`types/cli.rs:76-88`), `report schema` summary snake_case; see MCH-08 | stale (scope) | Verified |
| DOC-32 | Schema stdout claim | "stdout is always exactly one JSON document, with and without `--machine`" (364) | with `-o` and no `--machine` stdout is the human message (`report_schema_handler.rs:39-42`) | stale | Verified |
| DOC-33 | `doctor` failure | "otherwise the command fails as before" (275) | `DOM_BUSINESS_VIOLATION`, exit 1, JSON inside the message (`doctor_handler.rs:172-179`); see MCH-05 | stale | Verified |
| DOC-34 | `sink test` failure | "a failing sink makes the command fail" (271) | `SNK_EXTERNAL_IO`, exit 1, JSON inside the message (`sink_handler.rs:201-208`) | missing-in-docs | Verified |
| DOC-35 | `start` no-target envelope | `oxy.status` (242) | matches `start.rs:63-66`; surprising for consumers (MCH-09) | none (documented) | Verified |
| DOC-36 | `log rm` non-TTY | prompt skipped in pipelines (471) | matches `remove.rs:70-72`; owner decision OD-1 | none (documented) | Verified |
| DOC-37 | Quiet file receipt | "prints only the path" (201) | matches `report_delivery.rs:79-85` | none | Helper-reported |
| DOC-38 | Exit code table | 0-5 (418-425) | matches `shared/constants.rs:47-52` | none | Verified |
| DOC-39 | Semantic codes | 21 codes, `ENG_TIMER_ACTIVE` "not yet emitted" (433-453) | matches `codes.rs`; see MCH-11 | none | Verified |
| DOC-40 | `db restore` integrity | "schema integrity verification" (155) | no integrity check on the restore path (`persistence/core.rs:48-52`); see SUB-05 | missing-in-code | Helper-reported |
| DOC-41 | `db backup` method | "Online Backup API" (154) | delegates to `backup_database` (`persistence/core.rs:41-46`); method not verified | unverified | Helper-reported |
| DOC-42 | `--db` missing file | `STO_SQLITE_INIT` exit 3 (455) | matches `shared/db_target.rs:48-54`; transcript 2944 | none | Verified |
| DOC-43 | `OXY_DB_PATH`, `OXYTIME_DB_PATH` | not mentioned | `common/paths.rs:192, 225-231` (wiki documents them) | missing-in-docs | Helper-reported |
| DOC-44 | Default DB path and CSV dir | not mentioned | `common/paths.rs:150-151, 185-190` | missing-in-docs | Helper-reported |
| DOC-45 | `RUST_LOG` | not mentioned | `cli/mod.rs:35-38` | missing-in-docs | Helper-reported |

## Log removal, periods and misc

| ID | Item | CLI.md says | Code does | Kind | Verification |
| --- | --- | --- | --- | --- | --- |
| DOC-46 | `log rm` prompt text | `Remove entry <short id> (45m, <task name>)? [y/N]` (146, 470) | matches `handlers/constants.rs:31` | none | Verified |
| DOC-47 | `log rm` cancel exit | exit 0 (470) | matches `remove.rs:47-49` | none | Verified |
| DOC-48 | `log rm -q` | prints only the ID (473) | matches `remove.rs:63-67` | none | Verified |
| DOC-49 | `--tz` precedence | `--tz` > setting > OS zone (183) | matches `engine/range.rs:32-43` | none | Helper-reported |
| DOC-50 | `--to` date-only | up to the start of the next day (181) | matches `engine/range.rs:240` | none | Helper-reported |
| DOC-51 | `log ls` default limit | 20 human, none machine (145) | matches `log_handler/list.rs:59-62` | none | Helper-reported |
| DOC-52 | `task list` default filter | not stated | completed and archived hidden (`task_handler/list.rs:247-257`) | missing-in-docs | Helper-reported |
| DOC-53 | Period naive format | `YYYY-MM-DD`, `YYYY-MM-DD HH:MM:SS` or RFC3339 (177) | matches `engine/range.rs:10-11` | none | Helper-reported |
| DOC-54 | `log add --from/--to` naive | "RFC3339" in help and `<iso>` at 143 | naive forms accepted and read as UTC (`shared/utils.rs:128-139`); see LOG-04 | stale | Verified |
| DOC-55 | `task rate clear` | `inherit`, `none`, `clear` (314) | matches `billing_input.rs:112-115`; parser help lists only `inherit`/`none` (`tier2_entities.rs:124-126`) | stale (help) | Helper-reported |

## Tests and fixtures

| ID | Item | CLI.md says | Code does | Kind | Verification |
| --- | --- | --- | --- | --- | --- |
| DOC-56 | Parity vector count | 39 (543, 548, 551) | 63 rows in `tests/shared/fixtures/cli-parity-cases.json` | stale | Verified |
| DOC-57 | Test layout | file list (527-551) | every listed path exists | none | Helper-reported |
| DOC-58 | Schema regeneration command | `cargo test --test integration_tests regenerate_json_schemas -- --ignored` (366) | test exists in `src-tauri/tests/integration/report_json_schema_test.rs` | none | Helper-reported |
| DOC-59 | Schema files | `schemas/json/...`, `schemas/xml/report/v2/report.xsd` (366-367) | files exist | none | Helper-reported |

## Additional drift found in the other passes

| ID | Item | CLI.md says | Code does | Kind | Verification |
| --- | --- | --- | --- | --- | --- |
| DOC-60 | `--variant` per format | "`full` carries the per-entry rows" (329) | table, HTML and ODS ignore the variant; see RPT-02 | wrong | Verified |
| DOC-61 | Byte identity of exports | "byte-identical apart from `generatedAt` in the JSON document" (324) | XML and JSONL also carry `generatedAt`; XLSX differs between runs (RPT-08) | stale | Helper-reported |
| DOC-62 | Adapter entries | "`start_time` / `end_time` are whole-second RFC 3339 instants" (324) | the adapter entries are never written (RPT-16) | stale | Helper-reported |
| DOC-63 | `stop` elapsed time | "Prints total elapsed time for session" (139) | prints a fixed sentence (`constants.rs:139`); see TIM-04 | missing-in-code | Verified |
| DOC-64 | Overlap rule | time logs cannot overlap (project principle in CLI.md and `ENGINEERING.md`) | `log add` does not check (LOG-01) | missing-in-code | Verified |
| DOC-65 | Column dictionary | duration, percentage and task-count conventions per format are not written down | see RPT-12 | missing-in-docs | Helper-reported |

Verified as matching (no row needed): envelope shapes for `oxy.start`, `oxy.stop`, `oxy.switch`, `oxy.status`, `oxy.dashboard`, `oxy.today`, `oxy.report`, `oxy.report.export`, `oxy.project.*`, `oxy.task.*`, `oxy.log.*`, `oxy.config.*`, `oxy.sink.*`, `oxy.mask.*`, `oxy.doctor`, `oxy.db.*` against `types/cli_flow.rs`, `types/cli_subsystems.rs`, `types/cli_entities.rs` (helper-reported); XLSX sheet names; atomic `-o` writes; `report schema` `$id` values.

Rebuild checklist for CLIX-47: fix DOC-01..DOC-16, DOC-28..DOC-34, DOC-54, DOC-56, DOC-60..DOC-63 in the text; add DOC-17..DOC-27, DOC-43..DOC-45, DOC-52, DOC-65; mark DOC-10, DOC-11, DOC-13, DOC-14, DOC-40 as `[PLANNED]` with their phase or remove them; rows with kind `none` stay as they are. Rows whose root cause is a code defect (DOC-09, DOC-16, DOC-25, DOC-33, DOC-60, DOC-63, DOC-64) describe the current behaviour until the fix lands, then the fixed one.