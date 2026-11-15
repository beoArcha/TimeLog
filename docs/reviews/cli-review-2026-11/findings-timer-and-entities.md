# Findings - Timer, Projects, Tasks and Target Resolution (TIM-xx, RES-xx)

Scope: `start`, `stop`, `switch`, `status`, `today`, the bare `oxy` dashboard, `project *`, `task *`, archive and complete lifecycle, and the entity resolver (names, prefixes, `--exact`, ambiguity, did-you-mean). Code references are against `main` b35731eb, paths relative to `src-tauri/src/`. Transcript line numbers refer to [evidence/oxy-session-2026-11-14.md](evidence/oxy-session-2026-11-14.md).

| ID | Priority | Verification | Title |
| --- | --- | --- | --- |
| TIM-01 | P1 | Verified in code, observed on the binary | An archived task can be started or switched to |
| TIM-02 | P1 | Verified in code | `task done`, `task archive` and `project archive` leave a running timer open |
| TIM-03 | P2 | Verified in code | `switch` closes every active log and reopens an already running task |
| TIM-04 | P2 | Verified in code, observed on the binary | `stop` and `status` messages are jargon and name nothing |
| TIM-05 | P2 | Verified in code, observed on the binary | Human output prints UUIDs instead of names |
| TIM-06 | P2 | Helper-reported (render logic), observed on the binary | Done and archived tasks vanish without a hint; no reopen or restore |
| TIM-07 | P2 | Verified in code, observed on the binary | `project ls` counts archived tasks and prints "1 tasks" |
| TIM-08 | P2 | Verified in code | Default project for `task add` is the first row of an unordered query |
| TIM-09 | P3 | Helper-reported | `task move` same-project no-op reports success; cascade is not atomic |
| TIM-10 | P3 | Verified in code, observed on the binary | `project rename` with billing flags says only "Updated project: uuid"; stale error text |
| TIM-11 | P3 | Helper-reported | Project color is never validated |
| TIM-12 | P2 | Verified in code, observed on the binary | Per-entry durations use `MMm SSs` while totals use `HHh MMm` |
| TIM-13 | P3 | Verified in code | A dangling active log fails `status --json` and the dashboard; the dashboard shows one session |
| RES-01 | P2 | Verified in code | Lenient resolver matches ID suffixes and ID substrings before names |
| RES-02 | P2 | Verified in code, observed on the binary | Strict mode reports an ambiguous name as "not found" with no candidates |
| RES-03 | P2 | Verified in code | Typo suggestion compares a lowercased target with original-case names |
| RES-04 | P3 | Verified in code | A non-numeric answer to the selection prompt cancels instead of re-asking |

Related: `--exact` disabling prompts is LOG-06 and log ID prefixes are LOG-07 in [findings-time-logs.md](findings-time-logs.md).

---

## TIM-01 (P1) An archived task can be started or switched to

- **Evidence:** `engine/timer.rs:34-36` and `:87-91` reject only `task.completed`. The resolver loads every task (`cli/resolver/entity_resolver.rs:129-149`, helper-reported) and does not filter `archived`.
- **Observed:** transcript 3588 (`task archive "Fix login"`), then 3728 (`start "Fix login"` -> "Started tracking task", exit 0) while `task list` no longer shows it (3598).
- **Expected:** owner decision OD-2 (README). Recommended: archived tasks are refused like completed ones (`DOM_BUSINESS_VIOLATION`, exit 1, remediation naming `task restore`), in both engines.
- **Regression test:** integration (BDT) in `src-tauri/tests/integration/cli/flow/lifecycle_test.rs`; parity fixture; `CrossRuntimeParity.test.ts` case for `startTimer` on an archived task.

## TIM-02 (P1) `task done`, `task archive` and `project archive` leave a running timer open

- **Evidence:** `cli/handlers/task_handler/update.rs:86-109` (complete) and `:135-162` (archive) patch the task only; `cli/handlers/project_handler.rs:232-255` calls `projects.archive` only. The archive SQL touches the entity tables only (`repositories/business/constants.rs:26-28`, `:60-62`, helper-reported).
- **Repro (not executed):** `oxy start X`, `oxy task done X`, `oxy status` still lists X as running on a completed task.
- **Expected:** the Engine closes the active logs of the entity (and, for a project, those of all its tasks) in the same transaction and the message reports the stopped time; both runtimes.
- **Regression test:** integration in `lifecycle_test.rs` for each of the three commands: given a running timer, when the entity is completed or archived, then `status` is idle and the log has an end time.

## TIM-03 (P2) `switch` closes every active log and reopens an already running task

- **Evidence:** `repositories/business/time_logs.rs:232-250` (`switch_active_logs`) runs `CLOSE_ALL_ACTIVE_LOGS` (`constants.rs:180-184`), while `start_active_log` (`:188-230`) closes only the same project and non-concurrent projects. `engine/timer.rs:79-100` has no `AlreadyRunning` branch, so `switch` to the running task closes and reopens it, producing two adjacent logs.
- **Expected:** `switch` uses the same closing rule as `start` and returns `alreadyRunning` for the running task; the browser mirror follows.
- **Regression test:** integration in `src-tauri/tests/integration/cli/flow/shortcuts_test.rs`: switch to the running task leaves one log; with a concurrent project, switch keeps the timer of the other project.

## TIM-04 (P2) `stop` and `status` messages are jargon and name nothing

- **Evidence:** `cli/handlers/constants.rs:139` ("Stopped all active projects timer tracking threads."), `:141-142` ("Count of Concurrent Tracking Threads: {}", "Task active in SQLite: {}"); `flow_handler/stop.rs:40` always returns `CliOutput::Stopped`; human `status` prints task IDs only (`flow_handler/status.rs:19`).
- **Observed:** transcript 935-944 (`stop` after one timer), 860-870 and 1012 (status), 1024 (`-q stop` prints the full line).
- **Expected:** `Stopped 'Write API docs' (Acme Corp) after 12m 05s`; idle status `No timer running`; running status lists task, project and elapsed (the `--json` payload already has them). `CLI.md:139` promises the elapsed time.
- **Regression test:** integration golden assertions in `lifecycle_test.rs` for the human lines (query by content, not by decoration).

## TIM-05 (P2) Human output prints UUIDs instead of names

- **Evidence:** `constants.rs:136` (`OUT_STARTED`, used at `start.rs:127-131` and `switch.rs:68`), `MSG_TASK_CREATED`, `MSG_PROJECT_CREATED`, `MSG_TASK_RENAMED`, `MSG_LOG_RECORDED` (`constants.rs:1-28`). A unique substring match is taken silently (`entity_resolver.rs:219-220`), so `oxy start doc` starts "Write API docs" and prints only its UUID.
- **Observed:** transcript 871-880, 913-922, 1303-1312.
- **Expected:** every confirmation names the resolved entity (`Started 'Write API docs' (Acme Corp)`), with the short ID in brackets. The `-q` contract keeps bare IDs.
- **Regression test:** integration golden lines in `shortcuts_test.rs` and `entities/task_test.rs`.

## TIM-06 (P2) Done and archived tasks vanish without a hint; no reopen or restore

- **Evidence:** `task_handler/list.rs:247-257` hides completed and archived tasks by default (helper-reported); `render.rs:23-31` renders a subtask whose parent is hidden as an orphan with a `(Subtask)` badge (helper-reported). `cli/parser/tier2_entities.rs:79-152` has no `reopen`, `restore` or `unarchive`. Starting a completed task fails with exit 1 and no hint (`engine/timer.rs:34-36`).
- **Observed:** transcript 3552-3577 (`task done "Design logo"`, then `task ls` without it).
- **Expected:** a footer `2 completed, 1 archived hidden (use --all)`; `task reopen <target>`, `task restore <target>`, `project restore <target>`; the completed-task error names `task reopen`.
- **Regression test:** integration in `task_test.rs` for the footer and for `reopen`/`restore`; unit for the orphan rendering when the parent is hidden.

## TIM-07 (P2) `project ls` counts archived tasks and prints "1 tasks"

- **Evidence:** `project_handler.rs:130` counts every task with the project ID; `constants.rs:119` (`FORMAT_PROJECT_ROW`) hard-codes "tasks".
- **Observed:** transcript 3598-3635: "Acme Corp - 4 tasks" while `task list` shows 3; "1 tasks" for Personal Site.
- **Expected:** count active tasks (optionally `3 tasks, 1 archived`), singular and plural forms.
- **Regression test:** integration in `entities/project_test.rs`.

## TIM-08 (P2) Default project for `task add` is the first row of an unordered query

- **Evidence:** `task_handler/create.rs:91-96` takes the first non-archived project from `projects.get_all()`; `SELECT_ALL_PROJECTS` (`repositories/business/constants.rs:212-215`) has no `ORDER BY`. The message does not say which project was used.
- **Expected:** deterministic choice (oldest `created_at`, or the only project) and the confirmation names it; with several projects and no `-p`, an error or a prompt in a TTY.
- **Regression test:** integration in `task_test.rs` with two projects created in a known order.

## TIM-09 (P3) `task move` same-project no-op reports success; cascade is not atomic

- **Evidence (helper-reported):** `task_handler/hierarchy.rs:258-269` returns "Moved task" without a patch when the project is unchanged; `:295-310` patches each descendant separately.
- **Expected:** an explicit no-op message; one transaction for the cascade.
- **Regression test:** integration in `task_test.rs` (same-project move) and a unit test on the repository transaction.

## TIM-10 (P3) `project rename` with billing flags says only "Updated project: uuid"; stale error text

- **Evidence:** `project_handler.rs:191-200` accepts rate, rate-cents and currency, but `constants.rs:9` (`ERR_PROJECT_RENAME_EMPTY`) mentions only name and color; `:224-228` prints `MSG_PROJECT_UPDATED` with the ID.
- **Observed:** transcript 3508-3517 (the rate did apply; the message does not say so).
- **Expected:** `Updated 'Personal Site': rate 120.00 EUR`; the error lists every accepted flag.
- **Regression test:** integration in `project_test.rs`.

## TIM-11 (P3) Project color is never validated

- **Evidence (helper-reported):** `project_handler.rs:166` and `:213-215` store any string, while the help (`tier2_entities.rs:21-26`) says hex or semantic name.
- **Expected:** validate against the palette shared with the GUI, or document free text.
- **Regression test:** unit on the validator; integration for the error.

## TIM-12 (P2) Per-entry durations use `MMm SSs` while totals use `HHh MMm`

- **Evidence:** `cli/handlers/log_handler/mod.rs:106-123` (`format_log_duration`, `FORMAT_DURATION_MINS_SECS` at `constants.rs:127`), `flow_handler/today.rs:73-74` (helper-reported), report tree `HHh MMm`. Phase 30 (old 24) Group A delivered `formatters/human_duration.rs`, which no handler uses.
- **Observed:** "00m 03s", "0h 00m", "05h 15m", "90m 00s", "3h 45m" and "(0m 0s)" in one session.
- **Expected:** one human duration format (`1h 05m`, `45m`, `12s`) from the shared formatter everywhere.
- **Regression test:** unit in `src-tauri/tests/unit/cli/human_duration_test.rs` (exists) plus an architecture rule that forbids ad-hoc `{}m {}s` formats in handlers.

## TIM-13 (P3) A dangling active log fails `status --json` and the dashboard; the dashboard shows one session

- **Evidence:** `flow_handler/status.rs:34-59` fails with `EntityNotFound` when the task or project of an active log is missing (intentional, per the comment); `flow_handler/dashboard.rs:40` takes only the first active session. `log ls` renders the same condition as "Unknown Task" (`log_handler/list.rs:156-160`, helper-reported).
- **Expected:** keep the loud failure for `status --json`; the dashboard lists every active session and renders a missing task as a labelled row with a `doctor` hint. Low priority.
- **Regression test:** unit in `src-tauri/tests/unit/cli/dashboard_test.rs` with two active sessions.

## RES-01 (P2) Lenient resolver matches ID suffixes and ID substrings before names

- **Evidence:** `entity_resolver.rs:312-328` (`find_prefix_id`: `starts_with || ends_with`), `:330-347` (`find_substring_matches` also matches `id.contains`). Neither is in `CLI.md:465` or the `--exact` help.
- **Expected:** prefix only (any length in lenient mode, 8+ in strict mode); names are searched by substring, IDs are not.
- **Regression test:** unit in `src-tauri/tests/unit/cli/resolver_test.rs`: a suffix of one ID no longer resolves.

## RES-02 (P2) Strict mode reports an ambiguous name as "not found" with no candidates

- **Evidence:** `resolver/strict_match.rs:69-84` returns `NotFound` for a substring, so `--json`/`--exact` never see the candidates that human mode lists.
- **Observed:** transcript 1199 (human: `DOM_ENTITY_AMBIGUOUS`, two candidates) vs 1210 (`--json`: `DOM_ENTITY_NOT_FOUND`, no `details`).
- **Decision check:** strict resolution is a Phase 31 (old 25) decision ("Strict Machine Resolution") and stays. The remediation plan (risk row for TASK-702) promised that the strict error carries candidates with IDs to copy.
- **Expected:** strict `NotFound` for a target with two or more substring matches carries `details.candidates`, and the human remediation says that `--exact` needs the exact name or an 8-character ID.
- **Regression test:** unit in `src-tauri/tests/unit/cli/strict_match_test.rs`; e2e `cli_envelope_test.rs` assertion on `details.candidates`.

## RES-03 (P2) Typo suggestion compares a lowercased target with original-case names

- **Evidence:** `entity_resolver.rs:356-362` computes `levenshtein_distance(&lower, name_fn(entity))` without lowercasing the name, so "design lgo" vs "Design logo" counts the capital as an extra edit and can exceed the distance limit of 2.
- **Expected:** case-insensitive distance.
- **Regression test:** unit in `src-tauri/tests/unit/cli/levenshtein_test.rs` or `resolver_test.rs`: `design lgo` suggests `Design logo`.

## RES-04 (P3) A non-numeric answer to the selection prompt cancels instead of re-asking

- **Evidence:** `resolver/prompter.rs:49-60` returns `None` for anything that is not a valid index, and the caller turns that into `AmbiguousMatch` (`entity_resolver.rs:233-237`).
- **Expected:** one re-prompt with the valid range, `q` or empty to cancel.
- **Regression test:** unit in `prompter_test.rs` with queued input `x`, then `2`.