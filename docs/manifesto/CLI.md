# CLI Contract & Reference

## oXyFlow — `oxy` and the In-App CLI

This document describes the command-line interface as it behaves today: the native `oxy` binary, the same command set running inside the desktop app, and the browser sandbox emulator. Planned behavior is marked **[PLANNED]** and linked to [MASTERMAP.md](MASTERMAP.md). Defects found in review are listed in [Known issues](#11-known-issues), not described as behavior.

The clap definitions in `src-tauri/src/cli/parser/` are the source of truth for commands and flags. `oxy --help` and `oxy <command> --help` print them.

---

## 1. Scope & Stability

| Surface | Where it runs | Executes against |
| --- | --- | --- |
| `oxy` binary | Any shell, scripts, CI | SQLite database (see [Database selection](#21-database-selection)) |
| In-app CLI, live mode | Desktop app (Tauri): CLI drawer and CLI view | The app's SQLite database, through the `cli_execute` IPC command and the same Rust dispatcher as `oxy` |
| Sandbox emulator | Desktop and browser, after `sandbox on` | In-memory demo data in `SandboxEmulatorStore` |

The CLI module (`src-tauri/src/cli/`) imports no Tauri GUI types and talks to the application only through `Engine` and `Persistence`.

**Contract** (changes need a version bump or a CHANGELOG entry and an update here):

- exit codes ([section 4.4](#44-exit-codes));
- semantic error codes and their exit-code mapping ([section 4.5](#45-error-codes));
- success envelope shape, every `schema` / `schemaVersion` pair and the error envelope keys ([section 4](#4-envelopes));
- the `oxy.report` v2 document, its JSON Schema and the XML XSD v2 ([section 8](#8-reports--export-formats));
- the CSV column sets and the `-q` output of each command ([section 3.2](#32-quiet-mode--q)).

**Not contract:** human-readable text (messages, emoji markers, table layout, help wording). Scripts must use `--json` / `--machine` or `-q`.

---

## 2. Invocation

```text
oxy [GLOBAL FLAGS] [COMMAND] [SUBCOMMAND] [ARGS] [FLAGS]
```

Global flags are accepted before or after the command (`oxy --json status` and `oxy status --json` are equivalent). Running `oxy` with no command prints the dashboard ([section 7.1](#71-flow-commands)).

### 2.1. Database selection

The database path is resolved once, in this order:

1. `--db <path>`. The file **must already exist**; otherwise the command fails with `STO_SQLITE_INIT` (exit 3) before anything is created. Only `db restore` may name a path that does not exist yet.
2. `OXY_DB_PATH`, then `OXYTIME_DB_PATH`. The file is created on first use, along with its parent directories.
3. The OS default, created on first run:

| OS | Default path |
| --- | --- |
| Windows | `%APPDATA%\com.oxyflow.timelog\oxytime.db` |
| macOS | `$HOME/Library/Application Support/com.oxyflow.timelog/oxytime.db` |
| Linux | `$XDG_DATA_HOME/com.oxyflow.timelog/oxytime.db`, or `$HOME/.local/share/com.oxyflow.timelog/oxytime.db` |

The default CSV sink directory is `csv/` next to the database file.

```bash
# Work on a scratch database without touching the real one
export OXY_DB_PATH="$HOME/tmp/oxy-scratch.db"
oxy project add "Scratch"
```

### 2.2. Global flags

| Flag | Short | Value | Effect |
| --- | --- | --- | --- |
| `--machine` | `-m` | — | Machine mode: success output is a compact JSON envelope on stdout, errors are a JSON envelope on stderr, no prompts, strict target resolution |
| `--json` | `-j` | — | Same as `--machine`, except that output is pretty-printed when stdout is a terminal |
| `--quiet` | `-q` | — | Minimal success output for scripts ([section 3.2](#32-quiet-mode--q)) |
| `--exact` | — | — | Strict target resolution in human mode ([section 5](#5-target-resolution)) |
| `--db` | — | path | Database file ([section 2.1](#21-database-selection)) |
| `--tz` | — | IANA name | Timezone for periods in `log list`, `report`, `today` and the dashboard ([section 6](#6-periods--timezones)) |
| `--help` | `-h` | — | Help on stdout, exit 0 |
| `--version` | `-V` | — | `oxy <version>` on stdout, exit 0 |

---

## 3. Output Modes & Streams

### 3.1. Modes

| Mode | stdout | stderr |
| --- | --- | --- |
| Human (default) | Text. Success messages start with `✅`, flow messages with `▶️` / `⏹️` / `⚡` | `Error [CODE]: <message>`, followed by `Suggestion:` and `Remediation:` lines when available |
| `--json` | One success envelope; indented when stdout is a terminal and `--machine` is absent, one line otherwise | One-line JSON error envelope, without the `user` layer |
| `--machine` | One success envelope on one line | One-line JSON error envelope, without the `user` layer |

Rules that hold in every mode:

- Success output goes to stdout only; errors go to stderr only.
- Diagnostics use `env_logger` on stderr. The default filter is `error`; `RUST_LOG` overrides it.
- Interactive prompts ([section 5.3](#53-interactive-prompts)) are written to stdout and appear only when stdin is a terminal, machine mode is off and `--exact` is absent.
- In machine mode, clap parse errors become JSON envelopes (`CLI_SYNTAX_UNKNOWN_COMMAND`, `CLI_SYNTAX_INVALID_ARGS`, exit 2). A command group without a subcommand (`oxy --machine task`) still prints clap's plain help to stderr with exit 2.
- The CLI writes no ANSI color codes. `NO_COLOR` is not read.

### 3.2. Quiet mode (`-q`)

`-q` changes successful output only. Errors are never suppressed. `--json` / `--machine` win when combined with `-q`.

| Command | Output with `-q` |
| --- | --- |
| `project add`, `rename`, `archive`; `task add`, `done`, `rename`, `rate`, `reparent`, `move`, `archive`; `log add`, `edit`, `remove` | The affected entity's full ID and a newline |
| `project list`, `task list`, `log list` | The rows without header, footer or `✅` prefix; nothing for an empty list |
| `start`, `switch` | The ID of the time log that was opened; `start` on a task that is already running prints nothing (exit 0) |
| `report` (table, no `-o`) | One line: `Total Time: <duration> (<n> active tasks)`, also for an empty period |
| `report -o <path>` | The written path |
| `report -o -`, `report -f <text format>` without `-o` | Unchanged: the export is the output |
| `stop`, `status`, `today`, bare `oxy`, `config`, `sink`, `mask`, `doctor`, `db`, `report schema` | `-q` is accepted and ignored |

```bash
TASK_ID=$(oxy task add "Code review" -p "Core" -q)
LOG_ID=$(oxy start "$TASK_ID" -q)
```

---

## 4. Envelopes

### 4.1. Success envelope

Every successful `--json` / `--machine` response, except the cases in [section 4.3](#43-output-that-is-not-enveloped), is one envelope on stdout. The TypeScript type is generated into `src/bindings/SuccessEnvelope.ts`; the JSON Schema is printed by `oxy report schema --target envelope`.

```json
{
  "schema": "oxy.stop",
  "schemaVersion": 1,
  "data": { "action": "noop", "stoppedCount": 0 },
  "meta": {
    "generatedAt": "2026-11-14T21:53:13Z",
    "generator": { "name": "oxy", "version": "1.14.5" }
  }
}
```

- Envelope and `data` keys are camelCase; enum values such as `action` are camelCase too.
- `meta.generatedAt` is whole-second RFC 3339 UTC.
- `schemaVersion` changes on any breaking change to that schema's `data`. There is no compatibility mode; consumers pin on `schema` + `schemaVersion`.
- A successful exit code and the envelope itself signal success. There is no `status` field.

### 4.2. Schemas

All schemas are version 1 except `oxy.report` (version 2).

| Command | `schema` | `data` |
| --- | --- | --- |
| bare `oxy` | `oxy.dashboard` | `{ running, activeSession: { taskId, taskName, projectId, projectName, start, elapsedSeconds } \| null, todayDate, todayTotalSeconds, sessionCount, recentTasks: { taskId, taskName, projectName, durationSeconds }[] }` |
| `start <target>` | `oxy.start` | `{ action: "started" \| "alreadyRunning", taskId, timeLogId \| null, stoppedTaskIds[] }` |
| `start` (no target, timer running) | `oxy.status` | The `oxy.status` payload |
| `stop` | `oxy.stop` | `{ action: "stopped" \| "noop", stoppedCount }` |
| `switch <target>` | `oxy.switch` | `{ action: "switched", taskId, timeLogId }` |
| `status` | `oxy.status` | `{ active: { taskId, taskName, projectId, projectName, start, elapsedSeconds }[], count, running }` |
| `today` | `oxy.today` | An `oxy.report` v2 `ReportDocument` (full variant, patches excluded) for the current local day; it carries its own `schema: "oxy.report"` |
| `report` (no `-o`) | `oxy.report` (v2) | The `ReportDocument`; `summary` has no `entries` |
| `report -o <path>` | `oxy.report.export` | `{ path, format, variant, totalSeconds }` |
| `project list` | `oxy.project.list` | `{ items: Project[] }` |
| `project add` / `rename` | `oxy.project.add` / `oxy.project.rename` | `Project` |
| `project archive` | `oxy.project.archive` | `{ id, action: "archived" }` |
| `task list` | `oxy.task.list` | `{ items: Task[] }` |
| `task add` / `done` / `rename` / `rate` / `reparent` / `move` | `oxy.task.add` / `.done` / `.rename` / `.rate` / `.reparent` / `.move` | `Task` |
| `task archive` | `oxy.task.archive` | `{ id, action: "archived" }` |
| `log list` | `oxy.log.list` | `{ items: TimeLog[], totalMatched }` |
| `log add` / `edit` | `oxy.log.add` / `oxy.log.edit` | `TimeLog` |
| `log remove` | `oxy.log.remove` | `{ id, action: "removed", entry: TimeLog }` |
| `config list` | `oxy.config.list` | `{ items: { key, value }[] }` |
| `config get` / `set` | `oxy.config.get` / `oxy.config.set` | `{ key, value }` |
| `sink list` | `oxy.sink.list` | `{ items: { name, sinkType, target, hasToken, enabled, createdAt }[] }` |
| `sink set-csv` / `set-webhook` | `oxy.sink.set` | `{ sinkType: "csv" \| "webhook", target }` |
| `sink test` | `oxy.sink.test` | `{ items: { name, sinkType, target, passed, detail }[] }` (only when every sink passes) |
| `mask list` | `oxy.mask.list` | `{ items: { name, template, createdAt }[] }` |
| `mask set` / `remove` | `oxy.mask.set` / `oxy.mask.remove` | `{ name, template }` / `{ name }` |
| `doctor` | `oxy.doctor` | `{ overallStatus: "ok", dbPath, dbSizeBytes, checks: { name, status, message }[] }` (only when every check passes) |
| `db backup` / `restore` | `oxy.db.backup` / `oxy.db.restore` | `{ destination }` / `{ source }` |

`Project`, `Task`, `TimeLog` and `ReportDocument` are the generated types in `src/bindings/`.

### 4.3. Output that is not enveloped

| Command | stdout in machine mode |
| --- | --- |
| `report -o -` | The raw export bytes |
| `report schema` (no `-o`) | The schema document itself |
| `report schema -o <path>` | `{ "status": "success", "exported_path", "schema", "schema_version" }` (snake_case) |

### 4.4. Exit codes

Defined in `src-tauri/src/cli/shared/constants.rs`, mapped by `CliError::exit_code()`.

| Code | Constant | Meaning |
| --- | --- | --- |
| `0` | `EXIT_CODE_SUCCESS` | Success, including `stop --if-running` with nothing to stop and a cancelled `log remove` |
| `1` | `EXIT_CODE_GENERIC_FAILURE` | Business rule violation, engine operation failure, sink failure, failed `doctor` |
| `2` | `EXIT_CODE_CLI_SYNTAX` | Invalid syntax or arguments, unknown command, invalid timezone or range, unknown mask |
| `3` | `EXIT_CODE_STORAGE_ERROR` | SQLite or storage failure, missing `--db` file |
| `4` | `EXIT_CODE_ENTITY_ERROR` | Entity not found, ambiguous target, did-you-mean |
| `5` | `EXIT_CODE_ENGINE_ERROR` | No active timer, active timer conflict |

### 4.5. Error codes

Defined in `src-tauri/src/cli/error/codes.rs`.

| Code | Category | Exit | Raised when |
| --- | --- | --- | --- |
| `CLI_SYNTAX_INVALID_ARGS` | `syntax` | 2 | Invalid flag value or combination, invalid timestamp, timezone or range, missing `--reason` |
| `CLI_SYNTAX_MISSING_TARGET` | `syntax` | 2 | `start` without a target, no timer running and no terminal to prompt |
| `CLI_SYNTAX_INVALID_DURATION` | `syntax` | 2 | Duration cannot be parsed |
| `CLI_SYNTAX_EMPTY_ID` | `syntax` | 2 | Empty target ID |
| `CLI_SYNTAX_UNKNOWN_COMMAND` | `syntax` | 2 | Unknown command or subcommand |
| `DOM_ENTITY_NOT_FOUND` | `entity` | 4 | Target does not exist |
| `DOM_ENTITY_AMBIGUOUS` | `entity` | 4 | Target matches more than one entity |
| `DOM_ENTITY_DID_YOU_MEAN` | `entity` | 4 | No match, one close name found |
| `STO_SQLITE_INIT` | `storage` | 3 | Database cannot be opened, `--db` file missing |
| `STO_SQLITE_QUERY` | `storage` | 3 | Query or other storage failure |
| `STO_SQLITE_CONSTRAINT` | `storage` | 3 | Constraint violation |
| `ENG_TIMER_ACTIVE` | `engine` | 5 | Reserved; no code path raises it |
| `ENG_TIMER_INACTIVE` | `engine` | 5 | `stop` with no timer running |
| `ENG_TIMER_CONFLICT` | `engine` | 5 | Active timer conflict |
| `ENG_OPERATION_FAILED` | `engine` | 1 | Engine operation failed |
| `DOM_BUSINESS_VIOLATION` | `business` | 1 | Business rule violated (completed task, invalid log range, several timers without `--all`, failed `doctor`) |
| `DOM_BUSINESS_NO_PROJECTS` | `business` | 1 | `task add` without `-p` and no active project exists |
| `SNK_EXTERNAL_IO` | `sink` | 1 | Sink I/O failure or failed `sink test` |
| `SNK_SERIALIZATION` | `sink` | 1 | Report export could not be formatted or written |
| `MSK_ALIAS_NOT_FOUND` | `mask` | 2 | `mask remove` on an unknown mask |
| `MSK_ALIAS_SYNTAX` | `mask` | 2 | Invalid mask definition |

### 4.6. Error envelope

`CliErrorEnvelope` (`src-tauri/src/types/cli.rs`). Top-level keys are **snake_case**; members of `details` are camelCase. Empty optional members are omitted.

```json
{
  "code": "CLI_SYNTAX_INVALID_ARGS",
  "category": "syntax",
  "exit_code": 2,
  "timestamp": "2026-11-14T21:53:35.407369+00:00",
  "technical": "invalid value 'yaml' for '--format <FORMAT>'",
  "details": { "field": "--format", "value": "yaml" }
}
```

| Key | Content |
| --- | --- |
| `code`, `category`, `exit_code` | As in [section 4.5](#45-error-codes) |
| `timestamp` | RFC 3339 with fractional seconds |
| `technical` | English message |
| `details.candidates` | `{ id, name }[]` for `DOM_ENTITY_AMBIGUOUS` |
| `details.suggestion` | `{ id, name }` for `DOM_ENTITY_DID_YOU_MEAN` |
| `details.field`, `details.value` | Offending flag (without clap's placeholder) and value for invalid arguments |
| `user` | `{ locale, message, suggestion?, remediation? }`, present only outside machine mode, where the native binary renders the error as text instead. `message` repeats `technical` in English |

---

## 5. Target Resolution

Commands that take a project or task (`start`, `switch`, `-p`, `-t`, `-P`, `task …`, `project …`, `log add`, `log edit --task`) resolve the target as follows.

### 5.1. Strict mode (`--json`, `--machine` or `--exact`)

1. Exact ID (a leading `#` is ignored).
2. Unique ID prefix of **8 or more** characters.
3. Exact name, case-insensitive.

Anything else is `DOM_ENTITY_NOT_FOUND`. Several matches at step 2 or 3 are `DOM_ENTITY_AMBIGUOUS` with `details.candidates`. No prompts, no fuzzy matching, no suggestions.

### 5.2. Human mode (default)

1. Exact ID.
2. Unique ID prefix or suffix of any length (a leading `#` is ignored).
3. Case-insensitive substring of the name or the ID. One match is used; several are ambiguous. An exact name that is also contained in another name (`Core` and `Core API`) is ambiguous here; use `--exact` or the ID.
4. Typo suggestion: the closest name within Levenshtein distance 2 is returned as `DOM_ENTITY_DID_YOU_MEAN`, with its ID in the remediation line.
5. Otherwise `DOM_ENTITY_NOT_FOUND`.

Time logs (`log edit <id>`, `log remove <id>`) are always looked up by exact ID.

### 5.3. Interactive prompts

Prompts appear only when stdin is a terminal, machine mode is off and `--exact` is absent. `--exact` therefore also skips the `log remove` confirmation ([LOG-06](../reviews/cli-review-2026-11/findings-time-logs.md#log-06-p1---exact-disables-the-log-rm-confirmation-and-the-start-prompt)):

| Situation | Prompt |
| --- | --- |
| Ambiguous target in human mode | Numbered list of candidates; `q` or empty input cancels and the ambiguity error is returned |
| `start` without a target and no timer running | `Enter task name or ID to start tracking (or 'q' to cancel):` |
| `log remove <id>` without `--yes` | `Remove entry <short id> (<duration>, <task name>)? [y/N]` |

---

## 6. Periods & Timezones

`log list` and `report` accept the period flags. `today` and the bare dashboard always cover the current local day and accept only `--tz`.

| Flag | Range |
| --- | --- |
| `--today`, `--yesterday` | Local calendar day |
| `--week`, `--last-week` | Local calendar week, Monday through Sunday |
| `--month`, `--last-month` | Local calendar month |
| `--from <v>`, `--to <v>` | Custom bounds: `YYYY-MM-DD`, `YYYY-MM-DDTHH:MM:SS`, `YYYY-MM-DD HH:MM:SS` or RFC 3339 |
| none | All time |

- Ranges are half-open, `[from, to)`. A date-only `--to 2026-10-31` ends at the start of 2026-11-01, so the whole day is included.
- Naive values (no offset) are local times in the resolved timezone.
- The six presets exclude each other and `--from` / `--to`. Combining them is a clap error (exit 2).
- A `--from` that is not earlier than `--to` (an empty range) and an unknown zone (`--tz Mars/Olympus`) are `CLI_SYNTAX_INVALID_ARGS` (exit 2).
- Timezone precedence: `--tz`, then the app's `timezone` setting (config key `timezone`, see [section 9](#9-configuration--environment)), then the OS zone, then UTC. `System` or an unset setting means the OS zone.
- All boundaries come from `Engine::resolve_range`; the sandbox uses the browser mirror `resolveRangeAt`.

`log add --from/--to` and `log edit --start/--end` parse timestamps differently: naive values there are read as **UTC**, and `YYYY-MM-DD` means midnight UTC. `--tz` does not apply to them ([LOG-04](../reviews/cli-review-2026-11/findings-time-logs.md#log-04-p1-naive-timestamps-are-read-as-utc-and---tz-does-not-apply-to-log-add--log-edit), known issue).

---

## 7. Command Reference

Aliases are listed in parentheses. Every command also accepts the global flags.

### 7.1. Flow commands

| Command | Usage | Notes |
| --- | --- | --- |
| *(none)* | `oxy` | Dashboard: running session, today's total, session count, the three latest sessions of today |
| `start` (`s`) | `oxy start [TARGET]` | Starts a timer. Starting a task that already runs is a no-op (`alreadyRunning`). Timers stopped as a side effect are listed in `stoppedTaskIds`. Without a target: prints the running timers if any, otherwise prompts (terminal) or fails with `CLI_SYNTAX_MISSING_TARGET` |
| `stop` (`sp`) | `oxy stop [--all] [--if-running]` | Stops the running timer. No timer: `ENG_TIMER_INACTIVE` (exit 5), or a `noop` success with `--if-running`. More than one timer: `--all` is required, otherwise `DOM_BUSINESS_VIOLATION` (exit 1) |
| `switch` (`sw`) | `oxy switch <TARGET>` | Stops the running timer and starts the target in one operation |
| `status` (`st`) | `oxy status` | Running timers with elapsed time from the Engine |
| `today` (`summary`) | `oxy today` | Today's entries and total (patches excluded) |

```bash
oxy start "Code review"
oxy sw 3f9a2c1b --json
oxy stop --if-running -m      # safe in a logout hook
```

### 7.2. `project` (`p`, `proj`)

| Subcommand | Usage |
| --- | --- |
| `list` (`ls`) | `oxy project list [-a]` |
| `add` (`create`) | `oxy project add <NAME> [-c <COLOR>] [--rate <AMOUNT> \| --rate-cents <CENTS>] [--currency <CODE>]` |
| `rename` (`ren`, `update`) | `oxy project rename <TARGET> [NEW_NAME] [-c <COLOR>] [--rate <AMOUNT> \| --rate-cents <CENTS>] [--currency <CODE>]` |
| `archive` (`rm`) | `oxy project archive <TARGET>` |

| Flag | Short | Value | Default | Notes |
| --- | --- | --- | --- | --- |
| `--all` | `-a` | — | off | `list`: include archived projects |
| `--color` | `-c` | hex or color name | `#FFFFFF` on `add` | e.g. `#3b82f6`, `indigo` |
| `--rate` | — | major units | none | `150.00` or `150`; `none` clears on `rename` |
| `--rate-cents` | — | integer | none | Excludes `--rate` |
| `--currency` | — | three-letter code | none | `none` clears on `rename` |

`rename` needs at least one of `NEW_NAME`, `--color`, `--rate`, `--rate-cents`, `--currency`. `archive` sets `archived = true`; it does not delete.

### 7.3. `task` (`t`)

| Subcommand | Usage |
| --- | --- |
| `list` (`ls`) | `oxy task list [-p <PROJECT>] [-a]` |
| `add` (`create`) | `oxy task add <NAME> [-p <PROJECT>] [-P <PARENT>] [--rate <AMOUNT> \| --rate-cents <CENTS>]` |
| `done` (`complete`) | `oxy task done <TARGET>` |
| `rename` (`ren`) | `oxy task rename <TARGET> <NEW_NAME>` |
| `rate` | `oxy task rate <TARGET> <RATE> [--currency <CODE>] [--cents]` |
| `reparent` | `oxy task reparent <TARGET> <NEW_PARENT>` |
| `move` | `oxy task move <TARGET> <NEW_PROJECT>` |
| `archive` (`rm`) | `oxy task archive <TARGET>` |

| Flag | Short | Value | Notes |
| --- | --- | --- | --- |
| `--project` | `-p` | target | `list`: filter. `add`: owning project; defaults to the parent's project with `-P`, else to the first non-archived project (`DOM_BUSINESS_NO_PROJECTS` when none). A parent from another project is `DOM_BUSINESS_VIOLATION` |
| `--all` | `-a` | — | `list`: include completed and archived tasks |
| `--parent` | `-P` | target | `add`: create a subtask |
| `--rate`, `--rate-cents` | — | amount / integer | `add`: task override; mutually exclusive |
| `--currency` | — | code | `rate`: currency override |
| `--cents` | — | — | `rate`: read `RATE` as integer cents |

- `done` sets `completed = true`; it does not toggle.
- `RATE` accepts major units (`220.00`), a `c` suffix for cents (`15000c`), or `inherit` / `none` / `clear` to remove the override. `0.00` is an explicit non-billable override.
- `reparent` accepts `none` or `root` as `NEW_PARENT` to make the task a root task.
- `move` moves the task with its subtasks.
- `archive` takes no project flag.

```bash
oxy task add "Implementation" -p "Client Work" --rate 200.00
oxy task add "Tests" -P "Implementation" -q
oxy task rate "Implementation" inherit
```

### 7.4. `log` (`l`)

| Subcommand | Usage |
| --- | --- |
| `list` (`ls`) | `oxy log list [-t <TASK>] [-p <PROJECT>] [PERIOD] [-l <N>]` |
| `add` (`create`) | `oxy log add <TARGET> [DURATION] [NOTE] [--from <TS>] [--to <TS>] [--note <TEXT>]` |
| `edit` (`update`) | `oxy log edit <ID> [-d <DURATION>] [-n <NOTE>] [--start <TS>] [--end <TS>] [--task <TARGET>] -r <REASON>` |
| `remove` (`rm`, `delete`) | `oxy log remove <ID> [-y]` |

| Flag | Short | Subcommand | Notes |
| --- | --- | --- | --- |
| `--task`, `--project` | `-t`, `-p` | `list` | Filters |
| `--limit` | `-l` | `list` | 1 or more. Default 20 in human mode (with a footer), unlimited in machine mode |
| `--from`, `--to` | — | `add` | Explicit start / end ([timestamp rules](#6-periods--timezones)) |
| `--note` | — | `add` | Wins over the positional `NOTE` |
| `--duration` | `-d` | `edit` | New duration |
| `--note` | `-n` | `edit` | New note |
| `--start`, `--end` | — | `edit` | New bounds |
| `--task` | — | `edit` | Reassign to another task |
| `--reason` | `-r` | `edit` | Required at runtime (`CLI_SYNTAX_INVALID_ARGS` without it), together with at least one change |
| `--yes` | `-y` | `remove` | Delete without prompting |

Durations: `45m`, `1h30m`, `2h`, `90s`, or a bare number of minutes (`90`).

`log add` combines its inputs like this:

| Given | Start | End |
| --- | --- | --- |
| `DURATION` | now − duration | now |
| `--from` + `DURATION` | `--from` | `--from` + duration |
| `--from` only | `--from` | now |
| `--from` + `--to` | `--from` | `--to` |
| `--to` + `DURATION` | `--to` − duration | `--to` |

With `--from`, a second positional value that is not a valid duration is taken as the note.

`log remove`: in a terminal it prompts (anything but `y` / `yes` cancels, prints `Operation cancelled.` and exits 0). With `--yes`, in machine mode, with `--exact`, or when stdin is not a terminal, it deletes without asking. The machine envelope returns the removed entry, so it can be recreated with `log add`.

```bash
oxy log add "Code review" 1h30m "pairing with Ana"
oxy log add Review --from 2026-11-10T09:00:00Z --to 2026-11-10T10:00:00Z --note "retro"
oxy log ls --week -p "Core" -l 50
```

### 7.5. `report` (`rep`)

```text
oxy report [-f <FORMAT>] [--variant full|summary] [-o <PATH>|-] [--csv-delimiter <CHAR>] [--bom]
           [PERIOD] [-p <PROJECT>] [-t <TASK>]
oxy report schema [-f json|xml] [--target report|envelope] [-o <PATH>]
```

| Flag | Short | Value | Default | Notes |
| --- | --- | --- | --- | --- |
| `--format` | `-f` | `table`, `html`, `csv`, `json`, `jsonl`, `xml`, `ods`, `xlsx` | `table` | See [section 8](#8-reports--export-formats) |
| `--variant` | — | `full`, `summary` | `full` | |
| `--output` | `-o` | path or `-` | none | `-` writes to stdout |
| `--csv-delimiter` | — | `,`, `;`, `tab` / `\t` / a literal tab | `,` | csv only |
| `--bom` | — | — | off | csv only: UTF-8 byte order mark for Excel on Windows |
| period flags | — | see [section 6](#6-periods--timezones) | all time | |
| `--project` | `-p` | target | none | Filter |
| `--task` | `-t` | target | none | Filter; must belong to `--project` when both are given |

`report schema` flags: `-f, --format` (`json` default, `xml`), `--target` (`report` default, `envelope`), `-o, --output <PATH>` (default stdout; `-` is a file name here, not stdout).

```bash
oxy report --week                                  # terminal tree
oxy report --last-month -f csv --bom -o march.csv
oxy report --today -f json -o - | jq '.totals.seconds'
oxy report --month -f xlsx -o timesheet.xlsx --json
```

### 7.6. `config`

| Subcommand | Usage | Behavior |
| --- | --- | --- |
| `list` (`ls`) | `oxy config list` | Every row stored in the `config` table, including app settings |
| `get` | `oxy config get <KEY>` | Stored value; `cli_machine_locale` returns `en` when unset; any other missing key is `DOM_ENTITY_NOT_FOUND` |
| `set` | `oxy config set <KEY> <VALUE>` | Writes any key. Only `cli_machine_locale` is validated |

### 7.7. `sink`

| Subcommand | Usage | Behavior |
| --- | --- | --- |
| `list` (`ls`) | `oxy sink list` | Configured sinks; a webhook token is shown only as `hasToken` |
| `set-csv` | `oxy sink set-csv -d, --dir <DIR>` | Sets the CSV audit directory, creating it if needed |
| `set-webhook` | `oxy sink set-webhook -u, --url <URL> [-t, --token <TOKEN>]` | URL must start with `http://` or `https://`. The token is stored as plain text in `cli_sinks.config` |
| `test` | `oxy sink test` | CSV: creates the directory and a probe file. Webhook: checks the URL scheme only; nothing is sent. A failure is `SNK_EXTERNAL_IO` (exit 1) |

### 7.8. `mask` (`alias`)

| Subcommand | Usage | Behavior |
| --- | --- | --- |
| `list` (`ls`) | `oxy mask list` | Registered masks |
| `set` | `oxy mask set <NAME> <TEMPLATE>` | Name and template must be non-empty; the template may not start with its own name |
| `remove` (`rm`) | `oxy mask remove <NAME>` | Unknown name: `MSK_ALIAS_NOT_FOUND` (exit 2) |

Expansion happens before clap parses the command line, in `oxy` and in the desktop in-app CLI. The first non-flag token is looked up as a mask name, so a mask named like a built-in command replaces it.

- `$1`, `$2`, … take the positional arguments after the mask name; an argument containing spaces is quoted unless the token is already quoted in the template.
- `$LAST` and `$LAST_TASK` take the ID of the running task, or of the task with the most recent log.
- `-m`, `-j`, `-q` and `--db` given with the mask are carried into the expansion. `--tz` and `--exact` are not.
- Masks may call masks, up to 5 levels; deeper expansion is `CLI_SYNTAX_INVALID_ARGS`.

```bash
oxy mask set standup 'log add meetings 15m "Daily standup"'
oxy mask set go 'switch $1'
oxy go "Code review" -q
```

### 7.9. `doctor`

`oxy doctor [--fix]` checks that the database file is readable, runs `PRAGMA integrity_check`, verifies the core tables and checks sink destinations. When every check passes it prints the report (`oxy.doctor` in machine mode). Any failed check makes the command fail with `DOM_BUSINESS_VIOLATION` (exit 1); in machine mode the full report is embedded as JSON text in `technical`.

`--fix` is parsed but has no effect. **[PLANNED]** in [Phase 28](MASTERMAP.md).

### 7.10. `db`

| Subcommand | Usage | Behavior |
| --- | --- | --- |
| `backup` | `oxy db backup <PATH>` | Writes a copy of the database, creating parent directories |
| `restore` | `oxy db restore <PATH>` | Replaces the current database with the file, without confirmation. A missing source is `CLI_SYNTAX_INVALID_ARGS` (exit 2) |

---

## 8. Reports & Export Formats

All report numbers come from `Engine::build_report` and the `ReportDocument` model (`oxy.report` v2, see [`ENGINEERING.md`](./ENGINEERING.md#canonical-report-model-reportdocument)). The CLI always includes patches in reports.

### 8.1. Format registry

`src-tauri/src/cli/exporters/registry.rs` holds one entry per format; a test fails when an `ExportFormat` value has no entry or more than one. No format is locale-dependent yet.

| Format | Group | Binary | Built from | `--variant` effect | Content |
| --- | --- | --- | --- | --- | --- |
| `table` | human | no | legacy adapter | none | Unicode tree with progress bars |
| `html` | human | no | legacy adapter | none | Self-contained HTML with embedded CSS |
| `csv` | data | no | `ReportDocument` | yes | One flat table ([section 8.3](#83-csv-columns)) |
| `json` | data | no | `ReportDocument` | yes | The bare document, pretty-printed, one trailing newline |
| `jsonl` | data | no | `ReportDocument` | yes | `{"type":"header",…}` line with `schema`, `schemaVersion`, `variant`, `generatedAt`, `generator`, `range`, `filters`, `totals`, then one `{"type":"entry",…}` line per entry; `summary` has the header only |
| `xml` | data | no | `ReportDocument` | yes | XML projection valid against XSD v2; `days` and `entries` only in `full` |
| `ods` | data | yes | legacy adapter | none | OpenDocument spreadsheet (`spreadsheet-ods`) |
| `xlsx` | data | yes | `ReportDocument` | yes | Workbook (`rust_xlsxwriter`): `Summary` sheet with a pie chart; `full` adds `Entries` (Excel table with autofilter) and `Days` (column chart). Durations are `[h]:mm` numbers, money uses a per-currency number format |

"Legacy adapter" means the format is rendered from an intermediate tree shape (`formatters/report_tree_adapter.rs`); it shows no per-entry rows in either variant. **[PLANNED]**: ODS, table and HTML on `ReportDocument` in [Phase 24](MASTERMAP.md).

### 8.2. Delivery

| Invocation | Result |
| --- | --- |
| No `-o`, `table` | Human tree on stdout |
| No `-o`, other text format | Export bytes on stdout |
| No `-o`, `ods` / `xlsx` | `CLI_SYNTAX_INVALID_ARGS` (exit 2): binary output needs `-o` |
| `-o -` | Export bytes on stdout in every mode, binary formats included; no status prefix, no added newline |
| `-o <path>` | Atomic write (temporary file in the target directory, then rename; parent directories are created). Prints a message, the path with `-q`, or `oxy.report.export` in machine mode |
| `--json` / `--machine`, no `-o` | `oxy.report` envelope; `--format` is ignored |

- `oxy report -f csv -o - > a.csv` produces the same bytes as `oxy report -f csv -o a.csv`.
- `--csv-delimiter` and `--bom` with any format other than `csv` are `CLI_SYNTAX_INVALID_ARGS`, also in machine mode where `--format` is otherwise ignored. Format, variant and CSV flags are validated before the Engine runs.
- A formatting or write failure is `SNK_SERIALIZATION` (exit 1).

### 8.3. CSV columns

One header row, then one row per record in document order. Names repeat on every row. Decimals use a dot and two places, no thousands separator; money is minor units / 100. Cells starting with `=`, `+`, `-` or `@` (after leading whitespace) get a `'` prefix unless the whole cell is a number. A cell is quoted only when it contains the delimiter, a quote or a line break. Lines end with `\n`.

- **`summary`**: one row per root task and per subtask (subtasks carry `parentTaskId`), plus one task-less row per project with project-level time. Columns: `projectId`, `projectName`, `taskId`, `taskName`, `parentTaskId`, `seconds` (task and descendants), `directSeconds` (task alone; sums to the total), `hours` (`seconds` / 3600, two decimals, half up), `shareBasisPoints`, `rate`, `amount` (on `directSeconds`), `currency`, `billingStatus` (`inherited`, `custom`, `nonBillable`, `unconfigured`).
- **`full`**: one row per entry. Columns: `entryId`, `projectId`, `projectName`, `taskId`, `taskName` (empty for a project-level patch), `date` (local), `startUtc`, `endUtc` (empty while running), `seconds`, `note`, `amount`, `currency`.

### 8.4. Billing per format

Rates are stored as integer cents; each amount is rounded half-to-even to two decimals. The accepted maximum rate is 9,007,199,254,740,991 cents.

| Format | Billing content |
| --- | --- |
| `json`, `jsonl` | Everything in the document: per-task and per-subtask `rateMinor`, `currency`, `rateStatus`, `amountMinor`; per-project and per-currency totals; per-entry amounts (`full`); billable / non-billable / unconfigured seconds. `jsonl` carries totals in the header and amounts on entry lines |
| `xml` | Rates, statuses and amounts for tasks, projects and entries; per-currency totals |
| `csv` | `summary`: `rate`, `amount`, `currency`, `billingStatus`. `full`: `amount`, `currency` per entry |
| `xlsx` | Amount columns per currency on `Summary`, entry amounts on `Entries`; no rate column |
| `table`, `html`, `ods` | None |

### 8.5. Determinism

- Order is fixed by the Engine (projects and root tasks by seconds descending then ID, entries by start then ID, days by date). No exporter iterates a hash map.
- `generatedAt` appears in `json`, `jsonl` and `xml`; two exports of the same data differ only there.
- `csv` and `table` contain no timestamp of generation.
- `xlsx` bytes differ between runs because the workbook embeds its creation time.

### 8.6. Schemas

| Command | Output | Committed copy |
| --- | --- | --- |
| `oxy report schema` | JSON Schema (draft 2020-12) of `oxy.report` v2, `$id` `urn:oxyflow:schema:oxy.report:2` | `schemas/json/report/v2/report.schema.json` |
| `oxy report schema --target envelope` | JSON Schema of the success envelope, `$id` `urn:oxyflow:schema:oxy.envelope:1`; `data` is unconstrained | `schemas/json/envelope/v1/envelope.schema.json` |
| `oxy report schema -f xml` | XSD version 2 of the `-f xml` export | `schemas/xml/report/v2/report.xsd` |

- `-f xml --target envelope` is `CLI_SYNTAX_INVALID_ARGS` and writes nothing.
- The JSON schemas are generated from the Rust types with `schemars`, with alphabetically sorted properties. Optional properties are not in `required` and do not accept `null`.
- An integration test fails when the committed copies differ from the generated output. After an intentional change, run `cargo test --test integration_tests regenerate_json_schemas -- --ignored` and review the diff.
- XSD 1.0 cannot express "no `days` / `entries` in `summary`", so both are optional in the XSD and the rule is documented there.

---

## 9. Configuration & Environment

### 9.1. Config keys

`config` reads and writes the SQLite `config` table that the desktop app also uses.

| Key | Effect on the CLI |
| --- | --- |
| `timezone` | App timezone setting, used for periods when `--tz` is absent (IANA name or `System`) |
| `cli_machine_locale` | Validated against `en`, `pl`, `de`, `es`, `fr`, `pt-br`, `uk`, `ja`, `nl`, `it`; `config get` returns `en` when unset, `config list` shows it only once set. No CLI output depends on it today: the machine envelope omits the `user` layer. **[PLANNED]**: a localized user layer, or removal of the key, in [Phase 33](MASTERMAP.md) |
| any other key | Stored and returned as-is. App settings such as `auto_start` or `include_patches_in_reports` live here too; the CLI does not validate them |

### 9.2. Environment variables

| Variable | Effect |
| --- | --- |
| `OXY_DB_PATH` | Database path when `--db` is absent |
| `OXYTIME_DB_PATH` | Fallback when `OXY_DB_PATH` is unset |
| `APPDATA` (Windows), `HOME`, `XDG_DATA_HOME` | Base directory of the default database |
| `RUST_LOG` | Log filter for stderr diagnostics (default `error`) |

`TZ` and `NO_COLOR` are not read. The OS timezone comes from the system API.

---

## 10. In-App CLI

The CLI drawer opens with ``Ctrl+` `` in every layout and closes with `Esc`; the CLI view (`CliInterface.tsx`) shares the same session (`CliSessionContext`): history, arrow-key navigation and sandbox state. Opening the drawer in the Compact layout switches the window to Medium.

### 10.1. Modes

| Mode | Active when | Commands go to |
| --- | --- | --- |
| Live, desktop | Default in the Tauri app | The native dispatcher through `cli_execute`. Output, errors, exit codes and mask expansion match `oxy`; the app refreshes its data after a successful command. `--db` opens another database file; unlike `oxy`, a missing file is created instead of failing with `STO_SQLITE_INIT` |
| Sandbox | After `sandbox on`, in either runtime | `SandboxCommandRouter` on `SandboxEmulatorStore`: demo data (`sandboxDemoData.ts`), persisted in browser storage under `oxy_cli_sandbox_state`, never in the real database |
| Live, browser | Default in the browser runtime | A legacy TypeScript command set (`src/features/cli/commands/`) acting on the browser's own data |

Local shell commands: `clear` in every mode; `sandbox on | off | status | reset`. `help` and the legacy names (`addproject`, `addtask`, `addsubtask`, `projects`, `tasks`, `logs`, `complete`, `break`, `holidays`, `time`, …) work in the sandbox and browser modes; in desktop live mode everything except `clear` and `sandbox` goes to the native parser, where `help` is clap's help and the legacy names are unknown commands.

### 10.2. Sandbox coverage

| Area | Sandbox behavior |
| --- | --- |
| `start`, `stop`, `switch`, `status`, `today` | Supported; human text differs from `oxy`, envelopes match |
| `project list/add/rename/archive` | Supported; no `--rate-cents`, no `update` alias |
| `task list/add/done/rename/archive/rate` | Supported; `task rate` does not validate the value and ignores `--currency` / `--cents` |
| `task reparent`, `task move`, `log edit` | Not supported |
| `log list/add/remove` | Supported; `-l` is ignored (use `--limit`), `log add` ignores `--from` / `--to` / `--note`, `log remove` never prompts |
| `report` | Legacy command: period words and sorting only; no formats, `-o` or envelope |
| `sink`, `mask`, `config`, `doctor`, `db`, bare `oxy` | Not supported |
| Global flags | Must follow the command. `--json`, `--machine`, `-q`, `--exact` work; `-j` / `-m` are not recognized; `--db` is ignored; `--tz` applies to `today` and `log list` only |
| Top-level aliases (`s`, `sw`, …) | Not recognized |

Full sandbox parity is **[PLANNED]** in [Phase 27](MASTERMAP.md). The shared fixture `tests/shared/fixtures/cli-parity-cases.json` (63 cases) is run by `tests/integration/cli/cli-cross-runtime-parity.test.ts` and `src-tauri/tests/integration/cli/parity/parity_matrix_test.rs`.

---

## 11. Known Issues

The CLI review of November 2026 lists confirmed defects with evidence: [`docs/reviews/cli-review-2026-11/`](../reviews/cli-review-2026-11/README.md). Points that affect scripts today:

- `log add` skips the overlap, future and zero-length checks that `log edit` applies, so it accepts entries that `log edit` would reject.
- `--exact` disables the `log remove` confirmation and the `start` prompt.
- `start` and `switch` accept archived tasks, and `task done`, `task archive` and `project archive` leave a running timer open.
- Error envelopes use snake_case keys while success envelopes use camelCase.
- `doctor` and `sink test` failures embed a JSON report inside the `technical` string.
- `report schema -o -` writes a file named `-`.
- HTML and ODS exports ignore `--variant` and still use the legacy tree shape, which handles nested subtasks differently from the other formats.
- XLSX task amounts include subtask amounts, while CSV, JSON and XML report the task's own amount.
- `config list` and `config get` print every stored value as-is, including secrets kept in the `config` table, such as the desktop app's `api_token`.

## 12. Planned

| Area | Phase |
| --- | --- |
| Data safety in destructive commands | [Phase 23](MASTERMAP.md) |
| Exporter correctness across formats | [Phase 24](MASTERMAP.md) |
| Timer, task and log flows | [Phase 25](MASTERMAP.md) |
| Machine contract hardening | [Phase 26](MASTERMAP.md) |
| In-app CLI and sandbox parity | [Phase 27](MASTERMAP.md) |
| Truthful subsystem commands (`doctor --fix`, `sink test`) | [Phase 28](MASTERMAP.md) |
| ODS on `ReportDocument`, billing view, cross-format consistency test | [Phase 24](MASTERMAP.md) |
| Human-readable formats (Markdown, print HTML, DOCX), `--lang` | [Phase 29](MASTERMAP.md) |
| Consistent terminal messages and help | [Phase 30](MASTERMAP.md) |
| `contentHash`, `--output-dir`, pipeline guide | [Phase 31](MASTERMAP.md) |
| Browser exporters on `ReportDocument` | [Phase 32](MASTERMAP.md) |
| Localized terminal messages and error `user` layer | [Phase 33](MASTERMAP.md) |

---

## Related Documentation

- [`ENGINEERING.md`](./ENGINEERING.md) — architecture, layers and the report model.
- [`MASTERMAP.md`](./MASTERMAP.md) — roadmap.
- [`USER_GUIDE.md`](./USER_GUIDE.md) — end-user guide.
- [`testing_standards.md`](../../.agents/rules/testing_standards.md) — test tiers, CLI subprocess and parity tests.
