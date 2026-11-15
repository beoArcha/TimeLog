# h5 hands-on CLI session log (main b35731eb binary)

### `oxy db --help`
exit: 0
stdout (17 lines):
```
Manage database backup and recovery operations

Usage: oxy db [OPTIONS] <COMMAND>

Commands:
  backup   Safely backup SQLite database to target destination file
  restore  Safely restore SQLite database from backup file
  help     Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy config --help`
exit: 0
stdout (18 lines):
```
Inspect and modify SQLite configuration settings

Usage: oxy config [OPTIONS] <COMMAND>

Commands:
  list  List physically stored configuration keys in SQLite. Note: Absence of 'cli_machine_locale' means the effective default ('en') is active.
  get   Get configuration value by key. For 'cli_machine_locale', returns effective default 'en' when not explicitly set in SQLite.
  set   Set configuration key to value. For 'cli_machine_locale', validates supported locales (en, pl, de, es, fr, pt-br, ja, nl, it).
  help  Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy project --help`
exit: 0
stdout (19 lines):
```
Manage projects (ls, add, ren, rm)

Usage: oxy project [OPTIONS] <COMMAND>

Commands:
  list     List projects with summary metrics
  add      Create a new project
  rename   Rename, update, or recolor an existing project
  archive  Archive a project
  help     Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy task --help`
exit: 0
stdout (23 lines):
```
Manage tasks and subtasks (ls, add, ren, done, rm)

Usage: oxy task [OPTIONS] <COMMAND>

Commands:
  list      List tasks and subtasks hierarchically
  add       Add a new task (or subtask)
  done      Mark task as done / completed
  rename    Rename an existing task
  rate      Set task billing rate override (or 'inherit'/'none' to clear)
  reparent  Change the parent of a task (or promote to root with 'none')
  move      Move a task and its subtasks to another project
  archive   Archive a task
  help      Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy --db t.db project list`
exit: 0
stdout (1 lines):
```
✅ No projects found.
```
stderr (0 lines):
```
```

### `oxy log --help`
exit: 0
stdout (19 lines):
```
Manage time logs and retroactive adjustments

Usage: oxy log [OPTIONS] <COMMAND>

Commands:
  list    List recent time log entries
  add     Add a retroactive time log entry
  edit    Edit an existing log entry
  remove  Delete a log entry
  help    Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy report --help`
exit: 0
stdout (31 lines):
```
Generate reports or export to HTML/CSV/JSON

Usage: oxy report [OPTIONS] [COMMAND]

Commands:
  schema  Output the JSON Schema of the report document or the CLI envelope
  help    Print this message or the help of the given subcommand(s)

Options:
  -m, --machine               Deterministic silent machine JSON output
  -f, --format <FORMAT>       Output format: table, html, csv, json, jsonl, xml, ods, xlsx [default: table] [possible values: table, html, csv, json, jsonl, xml, ods, xlsx]
  -j, --json                  Output clean JSON to stdout
  -q, --quiet                 Suppress non-essential output
      --variant <VARIANT>     Report variant: full (with entries) or summary (totals only) [default: full] [possible values: full, summary]
      --exact                 Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
  -o, --output <OUTPUT>       Write the report to a file; '-' writes it to stdout
      --csv-delimiter <CHAR>  CSV field delimiter: ',' (default), ';' or 'tab' (csv format only)
      --db <DB>               Explicit path to SQLite database file
      --bom                   Start the CSV with a UTF-8 byte order mark, recommended for Excel on Windows (csv format only)
      --tz <TZ>               IANA timezone for date ranges (default: app setting or system)
      --today                 Scope to today
      --yesterday             Scope to yesterday
      --week                  Scope to the current week (Monday start)
      --last-week             Scope to last week (Monday start)
      --month                 Scope to the current month
      --last-month            Scope to last month
      --from <FROM>           Start of range, inclusive (YYYY-MM-DD or RFC3339)
      --to <TO>               End of range, exclusive (YYYY-MM-DD covers that whole day, or RFC3339)
  -p, --project <PROJECT>     Filter report by project (ID or name)
  -t, --task <TASK>           Filter report by task (ID or name)
  -h, --help                  Print help
```
stderr (0 lines):
```
```

### `oxy start --help`
exit: 0
stdout (15 lines):
```
Start timer on task (by ID, prefix, or name)

Usage: oxy start [OPTIONS] [TARGET]

Arguments:
  [TARGET]  Target task to start (by ID, prefix, or name substring)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy --help`
exit: 0
stdout (30 lines):
```
High-velocity native time tracking CLI

Usage: oxy [OPTIONS] [COMMAND]

Commands:
  start    Start timer on task (by ID, prefix, or name)
  stop     Stop active timer session
  switch   Atomically switch active timer to new task
  status   Display current running timer status
  today    Display today's work summary
  project  Manage projects (ls, add, ren, rm)
  task     Manage tasks and subtasks (ls, add, ren, done, rm)
  log      Manage time logs and retroactive adjustments
  report   Generate reports or export to HTML/CSV/JSON
  sink     Configure and test audit CSV and webhook sinks
  mask     Manage custom action macros and shortcuts
  config   Inspect and modify SQLite configuration settings
  doctor   Perform system and database health diagnostics
  db       Manage database backup and recovery operations
  help     Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
  -V, --version  Print version
```
stderr (0 lines):
```
```

### `oxy project add --help`
exit: 0
stdout (19 lines):
```
Create a new project

Usage: oxy project add [OPTIONS] <NAME>

Arguments:
  <NAME>  Project name

Options:
  -c, --color <COLOR>            Hex or semantic color (e.g. '#3b82f6' or 'indigo')
  -m, --machine                  Deterministic silent machine JSON output
  -j, --json                     Output clean JSON to stdout
      --rate <RATE>              Hourly billing rate in major units (e.g. '150.00' or '150')
  -q, --quiet                    Suppress non-essential output
      --rate-cents <RATE_CENTS>  Hourly billing rate in cents (e.g. '15000')
      --currency <CURRENCY>      Currency code (e.g. 'USD', 'PLN', 'EUR')
      --exact                    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>                  Explicit path to SQLite database file
      --tz <TZ>                  IANA timezone for date ranges (default: app setting or system)
  -h, --help                     Print help
```
stderr (0 lines):
```
```

### `oxy task add --help`
exit: 0
stdout (19 lines):
```
Add a new task (or subtask)

Usage: oxy task add [OPTIONS] <NAME>

Arguments:
  <NAME>  Task title / name

Options:
  -m, --machine                  Deterministic silent machine JSON output
  -p, --project <PROJECT>        Project to attach task to (optional if default exists)
  -j, --json                     Output clean JSON to stdout
  -P, --parent <PARENT>          Parent task to make this a subtask
  -q, --quiet                    Suppress non-essential output
      --rate <RATE>              Task hourly billing rate in major units (e.g. '200.00', '0.00' for non-billable)
      --exact                    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --rate-cents <RATE_CENTS>  Task hourly billing rate in cents (e.g. '20000')
      --db <DB>                  Explicit path to SQLite database file
      --tz <TZ>                  IANA timezone for date ranges (default: app setting or system)
  -h, --help                     Print help
```
stderr (0 lines):
```
```

### `oxy log add --help`
exit: 0
stdout (20 lines):
```
Add a retroactive time log entry

Usage: oxy log add [OPTIONS] <TARGET> [DURATION] [NOTE]

Arguments:
  <TARGET>    Target task (by ID, prefix, or name)
  [DURATION]  Duration (e.g. '45m', '1h30m', '90')
  [NOTE]      Optional log note/description

Options:
      --from <FROM>           Explicit start timestamp (RFC3339, e.g. '2026-10-24T10:00:00Z')
  -m, --machine               Deterministic silent machine JSON output
  -j, --json                  Output clean JSON to stdout
      --to <TO>               Explicit end timestamp (RFC3339, e.g. '2026-10-24T11:30:00Z')
      --note <EXPLICIT_NOTE>  Optional log note when using --from/--to
  -q, --quiet                 Suppress non-essential output
      --exact                 Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>               Explicit path to SQLite database file
      --tz <TZ>               IANA timezone for date ranges (default: app setting or system)
  -h, --help                  Print help
```
stderr (0 lines):
```
```

### `oxy log list --help`
exit: 0
stdout (23 lines):
```
List recent time log entries

Usage: oxy log list [OPTIONS]

Options:
  -m, --machine            Deterministic silent machine JSON output
  -t, --task <TASK>        Filter by task (by ID, prefix, or name)
  -j, --json               Output clean JSON to stdout
  -p, --project <PROJECT>  Filter by project (by ID, prefix, or name)
  -q, --quiet              Suppress non-essential output
      --today              Scope to today
      --exact              Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --yesterday          Scope to yesterday
      --db <DB>            Explicit path to SQLite database file
      --week               Scope to the current week (Monday start)
      --last-week          Scope to last week (Monday start)
      --tz <TZ>            IANA timezone for date ranges (default: app setting or system)
      --month              Scope to the current month
      --last-month         Scope to last month
      --from <FROM>        Start of range, inclusive (YYYY-MM-DD or RFC3339)
      --to <TO>            End of range, exclusive (YYYY-MM-DD covers that whole day, or RFC3339)
  -l, --limit <LIMIT>      Limit number of entries returned
  -h, --help               Print help
```
stderr (0 lines):
```
```

### `oxy log edit --help`
exit: 0
stdout (21 lines):
```
Edit an existing log entry

Usage: oxy log edit [OPTIONS] <ID>

Arguments:
  <ID>  Log ID

Options:
  -d, --duration <DURATION>  New duration (e.g. '30m', '1h')
  -m, --machine              Deterministic silent machine JSON output
  -j, --json                 Output clean JSON to stdout
  -n, --note <NOTE>          New note
  -q, --quiet                Suppress non-essential output
      --start <START>        New start timestamp (RFC3339, e.g. '2026-10-24T10:00:00Z')
      --end <END>            New end timestamp (RFC3339, e.g. '2026-10-24T11:30:00Z')
      --exact                Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>              Explicit path to SQLite database file
      --task <TASK>          Reassign log to target task (by ID, prefix, or name)
  -r, --reason <REASON>      Reason for editing the log (required for audit history)
      --tz <TZ>              IANA timezone for date ranges (default: app setting or system)
  -h, --help                 Print help
```
stderr (0 lines):
```
```

### `oxy log remove --help`
exit: 0
stdout (16 lines):
```
Delete a log entry

Usage: oxy log remove [OPTIONS] <ID>

Arguments:
  <ID>  Log ID

Options:
  -m, --machine  Deterministic silent machine JSON output
  -y, --yes      Confirm deletion without prompting
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy stop --help`
exit: 0
stdout (14 lines):
```
Stop active timer session

Usage: oxy stop [OPTIONS]

Options:
      --all         Stop all active timers
  -m, --machine     Deterministic silent machine JSON output
      --if-running  Succeed without error when no timer is running
  -j, --json        Output clean JSON to stdout
  -q, --quiet       Suppress non-essential output
      --exact       Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>     Explicit path to SQLite database file
      --tz <TZ>     IANA timezone for date ranges (default: app setting or system)
  -h, --help        Print help
```
stderr (0 lines):
```
```

### `oxy switch --help`
exit: 0
stdout (15 lines):
```
Atomically switch active timer to new task

Usage: oxy switch [OPTIONS] <TARGET>

Arguments:
  <TARGET>  Target task to switch to (by ID, prefix, or name substring)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy status --help`
exit: 0
stdout (12 lines):
```
Display current running timer status

Usage: oxy status [OPTIONS]

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy today --help`
exit: 0
stdout (12 lines):
```
Display today's work summary

Usage: oxy today [OPTIONS]

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy sink --help`
exit: 0
stdout (19 lines):
```
Configure and test audit CSV and webhook sinks

Usage: oxy sink [OPTIONS] <COMMAND>

Commands:
  list         List configured sinks and their health status
  set-csv      Configure local CSV audit trail sink
  set-webhook  Configure outbound webhook sink
  test         Trigger a synthetic ping test to all configured sinks
  help         Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy mask --help`
exit: 0
stdout (18 lines):
```
Manage custom action macros and shortcuts

Usage: oxy mask [OPTIONS] <COMMAND>

Commands:
  list    List registered action masks and macros
  set     Register or configure an action mask macro
  remove  Delete a registered action mask
  help    Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy config --help`
exit: 0
stdout (18 lines):
```
Inspect and modify SQLite configuration settings

Usage: oxy config [OPTIONS] <COMMAND>

Commands:
  list  List physically stored configuration keys in SQLite. Note: Absence of 'cli_machine_locale' means the effective default ('en') is active.
  get   Get configuration value by key. For 'cli_machine_locale', returns effective default 'en' when not explicitly set in SQLite.
  set   Set configuration key to value. For 'cli_machine_locale', validates supported locales (en, pl, de, es, fr, pt-br, ja, nl, it).
  help  Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy doctor --help`
exit: 0
stdout (13 lines):
```
Perform system and database health diagnostics

Usage: oxy doctor [OPTIONS]

Options:
      --fix      Attempt automatic remediation of detected anomalies
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy db backup --help`
exit: 0
stdout (15 lines):
```
Safely backup SQLite database to target destination file

Usage: oxy db backup [OPTIONS] <PATH>

Arguments:
  <PATH>  Destination file path for the backup (e.g. backup.sqlite)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy db restore --help`
exit: 0
stdout (15 lines):
```
Safely restore SQLite database from backup file

Usage: oxy db restore [OPTIONS] <PATH>

Arguments:
  <PATH>  Source backup file path to restore from

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy task done --help`
exit: 0
stdout (15 lines):
```
Mark task as done / completed

Usage: oxy task done [OPTIONS] <TARGET>

Arguments:
  <TARGET>  Target task (by ID, prefix, or name)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy project archive --help`
exit: 0
stdout (15 lines):
```
Archive a project

Usage: oxy project archive [OPTIONS] <TARGET>

Arguments:
  <TARGET>  Target project (by ID, prefix, or name)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```
stderr (0 lines):
```
```

### `oxy report schema --help`
exit: 0
stdout (15 lines):
```
Output the JSON Schema of the report document or the CLI envelope

Usage: oxy report schema [OPTIONS]

Options:
  -m, --machine          Deterministic silent machine JSON output
  -o, --output <OUTPUT>  Output destination file path (default: stdout)
  -f, --format <FORMAT>  Schema format: json, xml (xml: report target only) [default: json] [possible values: json, xml]
  -j, --json             Output clean JSON to stdout
  -q, --quiet            Suppress non-essential output
      --target <TARGET>  Schema to print: report, envelope [default: report] [possible values: report, envelope]
      --exact            Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>          Explicit path to SQLite database file
      --tz <TZ>          IANA timezone for date ranges (default: app setting or system)
  -h, --help             Print help
```
stderr (0 lines):
```
```

### `oxy --db t.db project add Acme Corp --rate 150 --currency PLN`
exit: 0
stdout (1 lines):
```
✅ Created project with ID: 74adfd00-6e21-44c3-92f4-abed3e69a84b
```
stderr (0 lines):
```
```

### `oxy --db t.db project add Personal Site --color indigo`
exit: 0
stdout (1 lines):
```
✅ Created project with ID: dfbc7198-c47c-4b94-80ef-8dd84c696734
```
stderr (0 lines):
```
```

### `oxy --db t.db project ls`
exit: 0
stdout (5 lines):
```
✅ 📂 Projects:
──────────────────────────────────────────────────
 • "Acme Corp" [ID: 74adfd00-6e21-44c3-92f4-abed3e69a84b] (#FFFFFF) — 0 tasks
 • "Personal Site" [ID: dfbc7198-c47c-4b94-80ef-8dd84c696734] (indigo) — 0 tasks

```
stderr (0 lines):
```
```

### `oxy --db t.db project list`
exit: 0
stdout (5 lines):
```
✅ 📂 Projects:
──────────────────────────────────────────────────
 • "Acme Corp" [ID: 74adfd00-6e21-44c3-92f4-abed3e69a84b] (#FFFFFF) — 0 tasks
 • "Personal Site" [ID: dfbc7198-c47c-4b94-80ef-8dd84c696734] (indigo) — 0 tasks

```
stderr (0 lines):
```
```

### `oxy --db t.db task add Build landing page -p Acme Corp --rate 200`
exit: 0
stdout (1 lines):
```
✅ Created task with ID: fe792a2c-68ab-43c1-95f8-4b37cd96fd56
```
stderr (0 lines):
```
```

### `oxy --db t.db task add Write API docs -p Acme Corp`
exit: 0
stdout (1 lines):
```
✅ Created task with ID: 541d88e9-679f-4d40-91ca-de120db8972d
```
stderr (0 lines):
```
```

### `oxy --db t.db task add Design logo -p Personal Site`
exit: 0
stdout (1 lines):
```
✅ Created task with ID: fb2ce5f5-9e77-4526-b888-9b397205c6ee
```
stderr (0 lines):
```
```

### `oxy --db t.db task add Fix login bug -p Acme Corp -P Build landing page`
exit: 0
stdout (1 lines):
```
✅ Created task with ID: 346f5c41-31da-4bf5-9aa6-802963419c52
```
stderr (0 lines):
```
```

### `oxy --db t.db task list`
exit: 0
stdout (7 lines):
```
✅ 📋 Tasks:
──────────────────────────────────────────────────
[ ] "Build landing page" [ID: fe792a2c-68ab-43c1-95f8-4b37cd96fd56] (Acme Corp)
   ↳ [ ] "Fix login bug" [ID: 346f5c41-31da-4bf5-9aa6-802963419c52]
[ ] "Write API docs" [ID: 541d88e9-679f-4d40-91ca-de120db8972d] (Acme Corp)
[ ] "Design logo" [ID: fb2ce5f5-9e77-4526-b888-9b397205c6ee] (Personal Site)

```
stderr (0 lines):
```
```

### `oxy --db t.db project list`
exit: 0
stdout (5 lines):
```
✅ 📂 Projects:
──────────────────────────────────────────────────
 • "Acme Corp" [ID: 74adfd00-6e21-44c3-92f4-abed3e69a84b] (#FFFFFF) — 3 tasks
 • "Personal Site" [ID: dfbc7198-c47c-4b94-80ef-8dd84c696734] (indigo) — 1 tasks

```
stderr (0 lines):
```
```

### `oxy --db t.db status`
exit: 0
stdout (2 lines):
```
⚡ Count of Concurrent Tracking Threads: 0

```
stderr (0 lines):
```
```

### `oxy --db t.db start Build landing`
exit: 0
stdout (1 lines):
```
▶️ Started tracking task: fe792a2c-68ab-43c1-95f8-4b37cd96fd56
```
stderr (0 lines):
```
```

### `oxy --db t.db status`
exit: 0
stdout (3 lines):
```
⚡ Count of Concurrent Tracking Threads: 1
• Task active in SQLite: fe792a2c-68ab-43c1-95f8-4b37cd96fd56

```
stderr (0 lines):
```
```

### `oxy --db t.db start Build landing`
exit: 0
stdout (1 lines):
```
Already tracking 'Build landing page' [fe792a2c-68ab-43c1-95f8-4b37cd96fd56].
```
stderr (0 lines):
```
```

### `oxy --db t.db --json status`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.status","schemaVersion":1,"data":{"active":[{"elapsedSeconds":2,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","start":"2026-11-14T17:33:27.857614200+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"}],"count":1,"running":true},"meta":{"generatedAt":"2026-11-14T17:33:30Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db switch Write API`
exit: 0
stdout (1 lines):
```
▶️ Started tracking task: 541d88e9-679f-4d40-91ca-de120db8972d
```
stderr (0 lines):
```
```

### `oxy --db t.db status`
exit: 0
stdout (3 lines):
```
⚡ Count of Concurrent Tracking Threads: 1
• Task active in SQLite: 541d88e9-679f-4d40-91ca-de120db8972d

```
stderr (0 lines):
```
```

### `oxy --db t.db stop`
exit: 0
stdout (1 lines):
```
⏹️ Stopped all active projects timer tracking threads.
```
stderr (0 lines):
```
```

### `oxy --db t.db stop`
exit: 5
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [ENG_TIMER_INACTIVE]: Engine error: No active timer is currently running
Remediation: Inspect active timers using 'oxy status' or stop them with 'oxy stop'.
```

### `oxy --db t.db stop --if-running`
exit: 0
stdout (1 lines):
```
✅ No active timer; nothing to stop.
```
stderr (0 lines):
```
```

### `oxy --db t.db --json stop --if-running`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.stop","schemaVersion":1,"data":{"action":"noop","stoppedCount":0},"meta":{"generatedAt":"2026-11-14T17:33:36Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db today`
exit: 0
stdout (7 lines):
```
✅ 📅 Work Summary for Today (2026-11-14)
──────────────────────────────────────────────────
 • [Acme Corp] Build landing page ➔ 00m 03s
 • [Acme Corp] Write API docs ➔ 00m 01s
──────────────────────────────────────────────────
Total Time Today: 0h 00m (2 entries)

```
stderr (0 lines):
```
```

### `oxy --db t.db --json today`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.today","schemaVersion":1,"data":{"days":[{"date":"2026-11-14","seconds":4}],"entries":[{"amountMinor":17,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:31Z","id":"log_1794677607857_0","isPatch":false,"originalSeconds":3,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":3,"start":"2026-11-14T17:33:27Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"amountMinor":4,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:33Z","id":"log_1794677611754_0","isPatch":false,"originalSeconds":1,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"541d88e9-679f-4d40-91ca-de120db8972d","seconds":1,"start":"2026-11-14T17:33:31Z","taskId":"541d88e9-679f-4d40-91ca-de120db8972d","taskName":"Write API docs"}],"filters":{"includePatches":false},"generatedAt":"2026-11-14T17:33:38Z","generator":{"name":"oxy","version":"1.14.5"},"projects":[{"billing":[{"amountMinor":21,"billableSeconds":4,"currency":"PLN","nonBillableSeconds":0,"unconfiguredSeconds":0}],"directSeconds":0,"id":"74adfd00-6e21-44c3-92f4-abed3e69a84b","name":"Acme Corp","seconds":4,"shareBasisPoints":10000,"tasks":[{"amountMinor":17,"currency":"PLN","directSeconds":3,"id":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","name":"Build landing page","rateMinor":20000,"rateStatus":"custom","seconds":3,"shareBasisPoints":7500,"subtasks":[]},{"amountMinor":4,"currency":"PLN","directSeconds":1,"id":"541d88e9-679f-4d40-91ca-de120db8972d","name":"Write API docs","rateMinor":15000,"rateStatus":"inherited","seconds":1,"shareBasisPoints":2500,"subtasks":[]}]}],"range":{"from":"2026-11-13T23:00:00Z","preset":"today","timezone":"Europe/Warsaw","to":"2026-11-14T23:00:00Z"},"schema":"oxy.report","schemaVersion":2,"totals":{"billableSeconds":4,"billing":[{"amountMinor":21,"billableSeconds":4,"currency":"PLN","nonBillableSeconds":0,"unconfiguredSeconds":0}],"entryCount":2,"nonBillableSeconds":0,"seconds":4,"unconfiguredSeconds":0},"variant":"full"},"meta":{"generatedAt":"2026-11-14T17:33:38Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db -q start Design logo`
exit: 0
stdout (1 lines):
```
log_1794677628942_0
```
stderr (0 lines):
```
```

### `oxy --db t.db -q status`
exit: 0
stdout (3 lines):
```
⚡ Count of Concurrent Tracking Threads: 1
• Task active in SQLite: fb2ce5f5-9e77-4526-b888-9b397205c6ee

```
stderr (0 lines):
```
```

### `oxy --db t.db -q stop`
exit: 0
stdout (1 lines):
```
⏹️ Stopped all active projects timer tracking threads.
```
stderr (0 lines):
```
```

### `oxy --db t.db -q today`
exit: 0
stdout (8 lines):
```
✅ 📅 Work Summary for Today (2026-11-14)
──────────────────────────────────────────────────
 • [Acme Corp] Build landing page ➔ 00m 03s
 • [Acme Corp] Write API docs ➔ 00m 01s
 • [Personal Site] Design logo ➔ 00m 01s
──────────────────────────────────────────────────
Total Time Today: 0h 00m (3 entries)

```
stderr (0 lines):
```
```

### `oxy --db t.db`
exit: 0
stdout (14 lines):
```
✅ ⚡ oXyFlow Quick Status Dashboard
──────────────────────────────────────────────────
⏱️  Active Tracking Session
Status: ⏸️  IDLE (No active timers)
Tip: Use 'oxy start <task>' or 'oxy t ls' to view tasks.
📈 Today's Progress
 • Total Logged: 00m 05s across 3 sessions
🕒 Recent Activity
 • "Design logo" (Personal Site) ➔ 00m 01s
 • "Write API docs" (Acme Corp) ➔ 00m 01s
 • "Build landing page" (Acme Corp) ➔ 00m 03s
──────────────────────────────────────────────────
💡 Tip: Use 'oxy sw <task>' to switch tasks | 'oxy report' for full breakdown

```
stderr (0 lines):
```
```

### `oxy --db t.db --tz Europe/Warsaw`
exit: 0
stdout (14 lines):
```
✅ ⚡ oXyFlow Quick Status Dashboard
──────────────────────────────────────────────────
⏱️  Active Tracking Session
Status: ⏸️  IDLE (No active timers)
Tip: Use 'oxy start <task>' or 'oxy t ls' to view tasks.
📈 Today's Progress
 • Total Logged: 00m 05s across 3 sessions
🕒 Recent Activity
 • "Design logo" (Personal Site) ➔ 00m 01s
 • "Write API docs" (Acme Corp) ➔ 00m 01s
 • "Build landing page" (Acme Corp) ➔ 00m 03s
──────────────────────────────────────────────────
💡 Tip: Use 'oxy sw <task>' to switch tasks | 'oxy report' for full breakdown

```
stderr (0 lines):
```
```

### `oxy --db t.db --machine status`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.status","schemaVersion":1,"data":{"active":[],"count":0,"running":false},"meta":{"generatedAt":"2026-11-14T17:33:53Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db --machine stop`
exit: 5
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"ENG_TIMER_INACTIVE","category":"engine","exit_code":5,"timestamp":"2026-11-14T17:33:53.994582800+00:00","technical":"Engine error: No active timer is currently running"}
```

### `oxy --db t.db start Write API docs`
exit: 0
stdout (1 lines):
```
▶️ Started tracking task: 541d88e9-679f-4d40-91ca-de120db8972d
```
stderr (0 lines):
```
```

### `oxy --db t.db stop`
exit: 0
stdout (1 lines):
```
⏹️ Stopped all active projects timer tracking threads.
```
stderr (0 lines):
```
```

### `oxy --db t.db --json start design logo`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.start","schemaVersion":1,"data":{"action":"started","stoppedTaskIds":[],"taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","timeLogId":"log_1794677636098_0"},"meta":{"generatedAt":"2026-11-14T17:33:56Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db -j stop --if-running`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.stop","schemaVersion":1,"data":{"action":"stopped","stoppedCount":1},"meta":{"generatedAt":"2026-11-14T17:33:56Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db --json start Build landing page`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.start","schemaVersion":1,"data":{"action":"started","stoppedTaskIds":[],"taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","timeLogId":"log_1794677637655_0"},"meta":{"generatedAt":"2026-11-14T17:33:57Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db task add Write API tests -p Acme Corp`
exit: 0
stdout (1 lines):
```
✅ Created task with ID: 85aae435-769b-4c24-be77-4d2cd77bca7a
```
stderr (0 lines):
```
```

### `oxy --db t.db start Fix login`
exit: 0
stdout (2 lines):
```
▶️ Started tracking task: 346f5c41-31da-4bf5-9aa6-802963419c52
Stopped: 'Build landing page' [fe792a2c-68ab-43c1-95f8-4b37cd96fd56]
```
stderr (0 lines):
```
```

### `oxy --db t.db start Bild landing`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Task 'Bild landing' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db start Write API`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_AMBIGUOUS]: Ambiguous Task target 'Write API'. Matched: "Write API docs" (541d88e9-679f-4d40-91ca-de120db8972d), "Write API tests" (85aae435-769b-4c24-be77-4d2cd77bca7a). Please specify a unique ID or title.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db --json start Write API`
exit: 4
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"DOM_ENTITY_NOT_FOUND","category":"entity","exit_code":4,"timestamp":"2026-11-14T17:34:08.301907600+00:00","technical":"Task 'Write API' not found."}
```

### `oxy --db t.db start Write API docs --exact`
exit: 0
stdout (2 lines):
```
▶️ Started tracking task: 541d88e9-679f-4d40-91ca-de120db8972d
Stopped: 'Fix login bug' [346f5c41-31da-4bf5-9aa6-802963419c52]
```
stderr (0 lines):
```
```

### `oxy --db t.db start Write API --exact`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Task 'Write API' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db start 541d88e9`
exit: 0
stdout (1 lines):
```
Already tracking 'Write API docs' [541d88e9-679f-4d40-91ca-de120db8972d].
```
stderr (0 lines):
```
```

### `oxy --db t.db --json start 541d88e9`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.start","schemaVersion":1,"data":{"action":"alreadyRunning","stoppedTaskIds":[],"taskId":"541d88e9-679f-4d40-91ca-de120db8972d","timeLogId":null},"meta":{"generatedAt":"2026-11-14T17:34:11Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db start 541d88e`
exit: 0
stdout (1 lines):
```
Already tracking 'Write API docs' [541d88e9-679f-4d40-91ca-de120db8972d].
```
stderr (0 lines):
```
```

### `oxy --db t.db start zzz nonexistent`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Task 'zzz nonexistent' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db --json start zzz nonexistent`
exit: 4
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"DOM_ENTITY_NOT_FOUND","category":"entity","exit_code":4,"timestamp":"2026-11-14T17:34:13.955066200+00:00","technical":"Task 'zzz nonexistent' not found."}
```

### `oxy --db t.db stop --if-running`
exit: 0
stdout (1 lines):
```
⏹️ Stopped all active projects timer tracking threads.
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Write API tests 45m manual entry`
exit: 0
stdout (1 lines):
```
✅ Logged 45m 0s to 'Write API tests' [ID: bfba2ec3-ecaa-40b7-9a7a-364a08a63c54]
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Design logo 1h30m`
exit: 0
stdout (1 lines):
```
✅ Logged 90m 0s to 'Design logo' [ID: f8487c4f-680c-47fc-9423-d0b824f7c472]
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Write API tests 90`
exit: 0
stdout (1 lines):
```
✅ Logged 90m 0s to 'Write API tests' [ID: 5a2531ba-23d2-47a9-8789-5a9b55682ce6]
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Build landing page --from 2026-11-13T09:00:00Z --to 2026-11-13T10:30:00Z --note retro session`
exit: 0
stdout (1 lines):
```
✅ Logged 90m 0s to 'Build landing page' [ID: 4bd41519-d71a-405f-82a7-0d0fd72a5b65]
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Build landing page --from 2026-11-10T09:00:00Z --to 2026-11-10T09:30:00Z`
exit: 0
stdout (1 lines):
```
✅ Logged 30m 0s to 'Build landing page' [ID: 56cfe9d8-bdfa-4da3-8644-24c14350701c]
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Build landing page --from 2026-11-10T09:00:00Z --to 2026-11-10T08:00:00Z`
exit: 1
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_BUSINESS_VIOLATION]: Log start time cannot be after end time.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log add Build landing page 2h --from 2026-11-10T09:00:00Z --to 2026-11-10T10:00:00Z`
exit: 0
stdout (1 lines):
```
✅ Logged 60m 0s to 'Build landing page' [ID: c75d0397-c9ae-433e-b31d-660e2e0bd61e]
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Build landing page 0m`
exit: 0
stdout (1 lines):
```
✅ Logged 0m 0s to 'Build landing page' [ID: 1bfb1175-32a3-4c91-bbce-4509de01cd29]
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Build landing page banana`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_DURATION]: Invalid duration format: Unrecognized character 'b' in duration 'banana'
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db log list`
exit: 0
stdout (18 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:34:29] "Build landing page" (0m 0s) ➔ [ID: 1bfb1175-32a3-4c91-bbce-4509de01cd29]
 • [2026-11-14T17:34:09] "Write API docs" (0m 5s) ➔ [ID: log_1794677649129_0]
 • [2026-11-14T17:34:05] "Fix login bug" (0m 3s) ➔ [ID: log_1794677645776_0]
 • [2026-11-14T17:33:57] "Build landing page" (0m 8s) ➔ [ID: log_1794677637655_0]
 • [2026-11-14T17:33:56] "Design logo" (0m 0s) ➔ [ID: log_1794677636098_0]
 • [2026-11-14T17:33:54] "Write API docs" (0m 0s) ➔ [ID: log_1794677634691_0]
 • [2026-11-14T17:33:48] "Design logo" (0m 1s) ➔ [ID: log_1794677628942_0]
 • [2026-11-14T17:33:31] "Write API docs" (0m 1s) ➔ [ID: log_1794677611754_0]
 • [2026-11-14T17:33:27] "Build landing page" (0m 3s) ➔ [ID: log_1794677607857_0]
 • [2026-11-14T16:49:24] "Write API tests" (45m 0s) ➔ [ID: bfba2ec3-ecaa-40b7-9a7a-364a08a63c54] — "manual entry"
 • [2026-11-14T16:04:25] "Write API tests" (90m 0s) ➔ [ID: 5a2531ba-23d2-47a9-8789-5a9b55682ce6]
 • [2026-11-14T16:04:24] "Design logo" (90m 0s) ➔ [ID: f8487c4f-680c-47fc-9423-d0b824f7c472]
 • [2026-11-13T09:00:00] "Build landing page" (90m 0s) ➔ [ID: 4bd41519-d71a-405f-82a7-0d0fd72a5b65] — "retro session"
 • [2026-11-10T09:00:00] "Build landing page" (30m 0s) ➔ [ID: 56cfe9d8-bdfa-4da3-8644-24c14350701c]
 • [2026-11-10T09:00:00] "Build landing page" (60m 0s) ➔ [ID: c75d0397-c9ae-433e-b31d-660e2e0bd61e]

```
stderr (0 lines):
```
```

### `oxy --db t.db log list --today`
exit: 0
stdout (15 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:34:29] "Build landing page" (0m 0s) ➔ [ID: 1bfb1175-32a3-4c91-bbce-4509de01cd29]
 • [2026-11-14T17:34:09] "Write API docs" (0m 5s) ➔ [ID: log_1794677649129_0]
 • [2026-11-14T17:34:05] "Fix login bug" (0m 3s) ➔ [ID: log_1794677645776_0]
 • [2026-11-14T17:33:57] "Build landing page" (0m 8s) ➔ [ID: log_1794677637655_0]
 • [2026-11-14T17:33:56] "Design logo" (0m 0s) ➔ [ID: log_1794677636098_0]
 • [2026-11-14T17:33:54] "Write API docs" (0m 0s) ➔ [ID: log_1794677634691_0]
 • [2026-11-14T17:33:48] "Design logo" (0m 1s) ➔ [ID: log_1794677628942_0]
 • [2026-11-14T17:33:31] "Write API docs" (0m 1s) ➔ [ID: log_1794677611754_0]
 • [2026-11-14T17:33:27] "Build landing page" (0m 3s) ➔ [ID: log_1794677607857_0]
 • [2026-11-14T16:49:24] "Write API tests" (45m 0s) ➔ [ID: bfba2ec3-ecaa-40b7-9a7a-364a08a63c54] — "manual entry"
 • [2026-11-14T16:04:25] "Write API tests" (90m 0s) ➔ [ID: 5a2531ba-23d2-47a9-8789-5a9b55682ce6]
 • [2026-11-14T16:04:24] "Design logo" (90m 0s) ➔ [ID: f8487c4f-680c-47fc-9423-d0b824f7c472]

```
stderr (0 lines):
```
```

### `oxy --db t.db log list --yesterday`
exit: 0
stdout (4 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-13T09:00:00] "Build landing page" (90m 0s) ➔ [ID: 4bd41519-d71a-405f-82a7-0d0fd72a5b65] — "retro session"

```
stderr (0 lines):
```
```

### `oxy --db t.db log list --week`
exit: 0
stdout (18 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:34:29] "Build landing page" (0m 0s) ➔ [ID: 1bfb1175-32a3-4c91-bbce-4509de01cd29]
 • [2026-11-14T17:34:09] "Write API docs" (0m 5s) ➔ [ID: log_1794677649129_0]
 • [2026-11-14T17:34:05] "Fix login bug" (0m 3s) ➔ [ID: log_1794677645776_0]
 • [2026-11-14T17:33:57] "Build landing page" (0m 8s) ➔ [ID: log_1794677637655_0]
 • [2026-11-14T17:33:56] "Design logo" (0m 0s) ➔ [ID: log_1794677636098_0]
 • [2026-11-14T17:33:54] "Write API docs" (0m 0s) ➔ [ID: log_1794677634691_0]
 • [2026-11-14T17:33:48] "Design logo" (0m 1s) ➔ [ID: log_1794677628942_0]
 • [2026-11-14T17:33:31] "Write API docs" (0m 1s) ➔ [ID: log_1794677611754_0]
 • [2026-11-14T17:33:27] "Build landing page" (0m 3s) ➔ [ID: log_1794677607857_0]
 • [2026-11-14T16:49:24] "Write API tests" (45m 0s) ➔ [ID: bfba2ec3-ecaa-40b7-9a7a-364a08a63c54] — "manual entry"
 • [2026-11-14T16:04:25] "Write API tests" (90m 0s) ➔ [ID: 5a2531ba-23d2-47a9-8789-5a9b55682ce6]
 • [2026-11-14T16:04:24] "Design logo" (90m 0s) ➔ [ID: f8487c4f-680c-47fc-9423-d0b824f7c472]
 • [2026-11-13T09:00:00] "Build landing page" (90m 0s) ➔ [ID: 4bd41519-d71a-405f-82a7-0d0fd72a5b65] — "retro session"
 • [2026-11-10T09:00:00] "Build landing page" (30m 0s) ➔ [ID: 56cfe9d8-bdfa-4da3-8644-24c14350701c]
 • [2026-11-10T09:00:00] "Build landing page" (60m 0s) ➔ [ID: c75d0397-c9ae-433e-b31d-660e2e0bd61e]

```
stderr (0 lines):
```
```

### `oxy --db t.db log list --last-week`
exit: 0
stdout (1 lines):
```
✅ No time logs found matching criteria.
```
stderr (0 lines):
```
```

### `oxy --db t.db log list --month`
exit: 0
stdout (18 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:34:29] "Build landing page" (0m 0s) ➔ [ID: 1bfb1175-32a3-4c91-bbce-4509de01cd29]
 • [2026-11-14T17:34:09] "Write API docs" (0m 5s) ➔ [ID: log_1794677649129_0]
 • [2026-11-14T17:34:05] "Fix login bug" (0m 3s) ➔ [ID: log_1794677645776_0]
 • [2026-11-14T17:33:57] "Build landing page" (0m 8s) ➔ [ID: log_1794677637655_0]
 • [2026-11-14T17:33:56] "Design logo" (0m 0s) ➔ [ID: log_1794677636098_0]
 • [2026-11-14T17:33:54] "Write API docs" (0m 0s) ➔ [ID: log_1794677634691_0]
 • [2026-11-14T17:33:48] "Design logo" (0m 1s) ➔ [ID: log_1794677628942_0]
 • [2026-11-14T17:33:31] "Write API docs" (0m 1s) ➔ [ID: log_1794677611754_0]
 • [2026-11-14T17:33:27] "Build landing page" (0m 3s) ➔ [ID: log_1794677607857_0]
 • [2026-11-14T16:49:24] "Write API tests" (45m 0s) ➔ [ID: bfba2ec3-ecaa-40b7-9a7a-364a08a63c54] — "manual entry"
 • [2026-11-14T16:04:25] "Write API tests" (90m 0s) ➔ [ID: 5a2531ba-23d2-47a9-8789-5a9b55682ce6]
 • [2026-11-14T16:04:24] "Design logo" (90m 0s) ➔ [ID: f8487c4f-680c-47fc-9423-d0b824f7c472]
 • [2026-11-13T09:00:00] "Build landing page" (90m 0s) ➔ [ID: 4bd41519-d71a-405f-82a7-0d0fd72a5b65] — "retro session"
 • [2026-11-10T09:00:00] "Build landing page" (30m 0s) ➔ [ID: 56cfe9d8-bdfa-4da3-8644-24c14350701c]
 • [2026-11-10T09:00:00] "Build landing page" (60m 0s) ➔ [ID: c75d0397-c9ae-433e-b31d-660e2e0bd61e]

```
stderr (0 lines):
```
```

### `oxy --db t.db log list --last-month`
exit: 0
stdout (1 lines):
```
✅ No time logs found matching criteria.
```
stderr (0 lines):
```
```

### `oxy --db t.db log list --from 2026-11-10 --to 2026-11-11 --tz Europe/Warsaw`
exit: 0
stdout (5 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-10T09:00:00] "Build landing page" (30m 0s) ➔ [ID: 56cfe9d8-bdfa-4da3-8644-24c14350701c]
 • [2026-11-10T09:00:00] "Build landing page" (60m 0s) ➔ [ID: c75d0397-c9ae-433e-b31d-660e2e0bd61e]

```
stderr (0 lines):
```
```

### `oxy --db t.db log list --from 2026-11-10 --to 2026-11-11`
exit: 0
stdout (5 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-10T09:00:00] "Build landing page" (30m 0s) ➔ [ID: 56cfe9d8-bdfa-4da3-8644-24c14350701c]
 • [2026-11-10T09:00:00] "Build landing page" (60m 0s) ➔ [ID: c75d0397-c9ae-433e-b31d-660e2e0bd61e]

```
stderr (0 lines):
```
```

### `oxy --db t.db log list -p Acme Corp --limit 2`
exit: 0
stdout (6 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:34:29] "Build landing page" (0m 0s) ➔ [ID: 1bfb1175-32a3-4c91-bbce-4509de01cd29]
 • [2026-11-14T17:34:09] "Write API docs" (0m 5s) ➔ [ID: log_1794677649129_0]
… 10 more entries not shown. Use --limit <n> to show more.

```
stderr (0 lines):
```
```

### `oxy --db t.db --json log list --limit 2`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.log.list","schemaVersion":1,"data":{"items":[{"editHistory":null,"endTime":"2026-11-14T17:34:29.480927800+00:00","id":"1bfb1175-32a3-4c91-bbce-4509de01cd29","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:34:29.480927800+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"},{"editHistory":null,"endTime":"2026-11-14T17:34:14.699115600+00:00","id":"log_1794677649129_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:34:09.128693+00:00","taskId":"541d88e9-679f-4d40-91ca-de120db8972d"}],"totalMatched":15},"meta":{"generatedAt":"2026-11-14T17:34:45Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db --machine log list --from 2026-11-10 --to 2026-11-11 --tz Europe/Warsaw`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.log.list","schemaVersion":1,"data":{"items":[{"editHistory":null,"endTime":"2026-11-10T09:30:00+00:00","id":"56cfe9d8-bdfa-4da3-8644-24c14350701c","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-10T09:00:00+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"},{"editHistory":null,"endTime":"2026-11-10T10:00:00+00:00","id":"c75d0397-c9ae-433e-b31d-660e2e0bd61e","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-10T09:00:00+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"}],"totalMatched":2},"meta":{"generatedAt":"2026-11-14T17:34:46Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db log add Design logo --from 2026-11-10T23:30:00Z --to 2026-11-10T23:50:00Z --note late night UTC`
exit: 0
stdout (1 lines):
```
✅ Logged 20m 0s to 'Design logo' [ID: 1b77b2f3-91c7-4d7f-a93e-2ac288272309]
```
stderr (0 lines):
```
```

### `oxy --db t.db log list --from 2026-11-11 --to 2026-11-12 --tz Europe/Warsaw`
exit: 0
stdout (4 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-10T23:30:00] "Design logo" (20m 0s) ➔ [ID: 1b77b2f3-91c7-4d7f-a93e-2ac288272309] — "late night UTC"

```
stderr (0 lines):
```
```

### `oxy --db t.db log list --from 2026-11-11 --to 2026-11-12 --tz UTC`
exit: 0
stdout (1 lines):
```
✅ No time logs found matching criteria.
```
stderr (0 lines):
```
```

### `oxy --db t.db log list --from 2026-11-11 --to 2026-11-12 --tz Europe/Warsaw --json`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.log.list","schemaVersion":1,"data":{"items":[{"editHistory":null,"endTime":"2026-11-10T23:50:00+00:00","id":"1b77b2f3-91c7-4d7f-a93e-2ac288272309","note":"late night UTC","projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","startTime":"2026-11-10T23:30:00+00:00","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee"}],"totalMatched":1},"meta":{"generatedAt":"2026-11-14T17:35:00Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db log list --from 2026-11-11 --to 2026-11-12 --tz Not/AZone`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Invalid timezone: 'Not/AZone'
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db log list --from 2026/11/11`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Invalid range input: unrecognized date/time value: '2026/11/11'
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db log list --limit 0`
exit: 2
stdout (0 lines):
```
```
stderr (3 lines):
```
error: invalid value '0' for '--limit <LIMIT>': 0 is not in 1..18446744073709551615

For more information, try '--help'.
```

### `oxy --db t.db log edit bfba2ec3 -d 30m -n trimmed`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Audit reason is required for editing a time log. Provide --reason <text> (or -r <text>).
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db log edit bfba2ec3 -d 30m -n trimmed -r client asked for 30m`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log 'bfba2ec3' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit bfba2ec3 -r no-op edit`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: At least one field to edit must be provided (--duration, --note, --start, --end, --task).
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db --json log edit bfba2ec3 -d 40m -r json edit`
exit: 4
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"DOM_ENTITY_NOT_FOUND","category":"entity","exit_code":4,"timestamp":"2026-11-14T17:35:11.460508400+00:00","technical":"Time log 'bfba2ec3' not found."}
```

### `oxy --db t.db log edit bfba2ec3 --task Fix login -r reassign`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log 'bfba2ec3' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit 1b77b2f3 --start 2026-11-10T22:00:00Z -r shift start`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '1b77b2f3' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit 1b77b2f3 --start 2026-11-10T23:55:00Z -r bad order`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '1b77b2f3' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit 00000000 -d 5m -r missing`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '00000000' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit 1b77b2f3 -d 5m`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Audit reason is required for editing a time log. Provide --reason <text> (or -r <text>).
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db log list -l 3`
exit: 0
stdout (7 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:34:29] "Build landing page" (0m 0s) ➔ [ID: 1bfb1175-32a3-4c91-bbce-4509de01cd29]
 • [2026-11-14T17:34:09] "Write API docs" (0m 5s) ➔ [ID: log_1794677649129_0]
 • [2026-11-14T17:34:05] "Fix login bug" (0m 3s) ➔ [ID: log_1794677645776_0]
… 13 more entries not shown. Use --limit <n> to show more.

```
stderr (0 lines):
```
```

### `oxy --db t.db log edit bfba2ec3-ecaa-40b7-9a7a-364a08a63c54 -d 30m -n trimmed -r client asked for 30m`
exit: 1
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_BUSINESS_VIOLATION]: Time log overlaps with an existing log (ID: log_1794677607857_0)
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db --exact log edit bfba2ec3 -d 30m -r exact prefix`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log 'bfba2ec3' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit bfba2ec3-ecaa-40b7-9a7a-364a08a63c54 -d 40m -r json edit --json`
exit: 1
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"DOM_BUSINESS_VIOLATION","category":"business","exit_code":1,"timestamp":"2026-11-14T17:35:22.882483700+00:00","technical":"Time log overlaps with an existing log (ID: log_1794677607857_0)"}
```

### `oxy --db t.db log edit bfba2ec3-ecaa-40b7-9a7a-364a08a63c54 --task Fix login -r reassign`
exit: 1
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_BUSINESS_VIOLATION]: Time log overlaps with an existing log (ID: log_1794677607857_0)
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit 1b77b2f3-91c7-4d7f-a93e-2ac288272309 --start 2026-11-10T23:55:00Z -r bad order`
exit: 1
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_BUSINESS_VIOLATION]: End time cannot be before start time
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log edit 1b77b2f3-91c7-4d7f-a93e-2ac288272309 --start 2026-11-10T22:00:00Z -r shift start`
exit: 0
stdout (1 lines):
```
✅ Updated time log: 1b77b2f3-91c7-4d7f-a93e-2ac288272309
```
stderr (0 lines):
```
```

### `oxy --db t.db log edit 00000000-0000-0000-0000-000000000000 -d 5m -r missing`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '00000000-0000-0000-0000-000000000000' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db --json log list --limit 30`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.log.list","schemaVersion":1,"data":{"items":[{"editHistory":null,"endTime":"2026-11-14T17:34:29.480927800+00:00","id":"1bfb1175-32a3-4c91-bbce-4509de01cd29","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:34:29.480927800+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"},{"editHistory":null,"endTime":"2026-11-14T17:34:14.699115600+00:00","id":"log_1794677649129_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:34:09.128693+00:00","taskId":"541d88e9-679f-4d40-91ca-de120db8972d"},{"editHistory":null,"endTime":"2026-11-14T17:34:09.128693+00:00","id":"log_1794677645776_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:34:05.776634700+00:00","taskId":"346f5c41-31da-4bf5-9aa6-802963419c52"},{"editHistory":null,"endTime":"2026-11-14T17:34:05.776634700+00:00","id":"log_1794677637655_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:33:57.655663100+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"},{"editHistory":null,"endTime":"2026-11-14T17:33:56.874131300+00:00","id":"log_1794677636098_0","note":null,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","startTime":"2026-11-14T17:33:56.098685+00:00","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee"},{"editHistory":null,"endTime":"2026-11-14T17:33:55.358863400+00:00","id":"log_1794677634691_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:33:54.691845600+00:00","taskId":"541d88e9-679f-4d40-91ca-de120db8972d"},{"editHistory":null,"endTime":"2026-11-14T17:33:50.514661800+00:00","id":"log_1794677628942_0","note":null,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","startTime":"2026-11-14T17:33:48.942928800+00:00","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee"},{"editHistory":null,"endTime":"2026-11-14T17:33:33.724923+00:00","id":"log_1794677611754_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:33:31.754307200+00:00","taskId":"541d88e9-679f-4d40-91ca-de120db8972d"},{"editHistory":null,"endTime":"2026-11-14T17:33:31.754307200+00:00","id":"log_1794677607857_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:33:27.857614200+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"},{"editHistory":null,"endTime":"2026-11-14T17:34:24.078131800+00:00","id":"bfba2ec3-ecaa-40b7-9a7a-364a08a63c54","note":"manual entry","projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T16:49:24.078131800+00:00","taskId":"85aae435-769b-4c24-be77-4d2cd77bca7a"},{"editHistory":null,"endTime":"2026-11-14T17:34:25.628017100+00:00","id":"5a2531ba-23d2-47a9-8789-5a9b55682ce6","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T16:04:25.628017100+00:00","taskId":"85aae435-769b-4c24-be77-4d2cd77bca7a"},{"editHistory":null,"endTime":"2026-11-14T17:34:24.769215400+00:00","id":"f8487c4f-680c-47fc-9423-d0b824f7c472","note":null,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","startTime":"2026-11-14T16:04:24.769215400+00:00","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee"},{"editHistory":null,"endTime":"2026-11-13T10:30:00+00:00","id":"4bd41519-d71a-405f-82a7-0d0fd72a5b65","note":"retro session","projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-13T09:00:00+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"},{"editHistory":[{"auditSource":"CLI Edit","editedAt":"2026-11-14T17:35:25.051999200+00:00","prevEndTime":null,"prevNote":null,"prevStartTime":"2026-11-10T23:30:00+00:00","reason":"shift start"}],"endTime":"2026-11-10T23:50:00+00:00","id":"1b77b2f3-91c7-4d7f-a93e-2ac288272309","note":"late night UTC","projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","startTime":"2026-11-10T22:00:00+00:00","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee"},{"editHistory":null,"endTime":"2026-11-10T09:30:00+00:00","id":"56cfe9d8-bdfa-4da3-8644-24c14350701c","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-10T09:00:00+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"},{"editHistory":null,"endTime":"2026-11-10T10:00:00+00:00","id":"c75d0397-c9ae-433e-b31d-660e2e0bd61e","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-10T09:00:00+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"}],"totalMatched":16},"meta":{"generatedAt":"2026-11-14T17:35:38Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db log rm 1bfb1175-91c7-4d7f-a93e-2ac288272309 --yes`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '1bfb1175-91c7-4d7f-a93e-2ac288272309' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log rm 1bfb1175-32a3-4c91-bbce-4509de01cd29 --yes`
exit: 0
stdout (1 lines):
```
✅ Deleted time log: 1bfb1175-32a3-4c91-bbce-4509de01cd29
```
stderr (0 lines):
```
```

### `oxy --db t.db log remove 1bfb1175-32a3-4c91-bbce-4509de01cd29`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '1bfb1175-32a3-4c91-bbce-4509de01cd29' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log remove 1bfb1175-32a3-4c91-bbce-4509de01cd29 -y`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '1bfb1175-32a3-4c91-bbce-4509de01cd29' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db --json log remove 1bfb1175-32a3-4c91-bbce-4509de01cd29 -y`
exit: 4
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"DOM_ENTITY_NOT_FOUND","category":"entity","exit_code":4,"timestamp":"2026-11-14T17:35:48.631111400+00:00","technical":"Time log '1bfb1175-32a3-4c91-bbce-4509de01cd29' not found."}
```

### `oxy --db t.db log remove log_1794677649129_0 -y`
exit: 0
stdout (1 lines):
```
✅ Deleted time log: log_1794677649129_0
```
stderr (0 lines):
```
```

### `oxy --db t.db log remove 1bfb1175-32a3-4c91-bbce-4509de01cd29 -y`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '1bfb1175-32a3-4c91-bbce-4509de01cd29' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db log list -l 2`
exit: 0
stdout (6 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:34:05] "Fix login bug" (0m 3s) ➔ [ID: log_1794677645776_0]
 • [2026-11-14T17:33:57] "Build landing page" (0m 8s) ➔ [ID: log_1794677637655_0]
… 12 more entries not shown. Use --limit <n> to show more.

```
stderr (0 lines):
```
```

### `oxy --db t.db log add Design logo 10m to delete`
exit: 0
stdout (1 lines):
```
✅ Logged 10m 0s to 'Design logo' [ID: eb9a34f9-1f13-486b-8be3-c5a0cace6abf]
```
stderr (0 lines):
```
```

### `oxy --db t.db --json log list -l 1`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.log.list","schemaVersion":1,"data":{"items":[{"editHistory":null,"endTime":"2026-11-14T17:34:09.128693+00:00","id":"log_1794677645776_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:34:05.776634700+00:00","taskId":"346f5c41-31da-4bf5-9aa6-802963419c52"}],"totalMatched":15},"meta":{"generatedAt":"2026-11-14T17:35:57Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db log remove log_1794677645776_0`
exit: 0
stdout (1 lines):
```
✅ Deleted time log: log_1794677645776_0
```
stderr (0 lines):
```
```

### `oxy --db t.db --json log remove log_1794677645776_0`
exit: 4
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"DOM_ENTITY_NOT_FOUND","category":"entity","exit_code":4,"timestamp":"2026-11-14T17:35:58.691547100+00:00","technical":"Time log 'log_1794677645776_0' not found."}
```

### `oxy --db t.db log add Design logo 10m delete with yes`
exit: 0
stdout (1 lines):
```
✅ Logged 10m 0s to 'Design logo' [ID: d40c7577-0b4f-4654-a1eb-671ec35c8dbe]
```
stderr (0 lines):
```
```

### `oxy --db t.db --json log list -l 1`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.log.list","schemaVersion":1,"data":{"items":[{"editHistory":null,"endTime":"2026-11-14T17:34:05.776634700+00:00","id":"log_1794677637655_0","note":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","startTime":"2026-11-14T17:33:57.655663100+00:00","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56"}],"totalMatched":15},"meta":{"generatedAt":"2026-11-14T17:36:00Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db log remove log_1794677637655_0 --yes`
exit: 0
stdout (1 lines):
```
✅ Deleted time log: log_1794677637655_0
```
stderr (0 lines):
```
```

### `oxy --db t.db log remove eb9a34f9-1f13-486b-8be3-c5a0cace6abf`
exit: 0
stdout (1 lines):
```
✅ Deleted time log: eb9a34f9-1f13-486b-8be3-c5a0cace6abf
```
stderr (0 lines):
```
```

### `oxy --db t.db --json log remove d40c7577-0b4f-4654-a1eb-671ec35c8dbe`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.log.remove","schemaVersion":1,"data":{"action":"removed","entry":{"editHistory":null,"endTime":"2026-11-14T17:35:59.435988500+00:00","id":"d40c7577-0b4f-4654-a1eb-671ec35c8dbe","note":"delete with yes","projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","startTime":"2026-11-14T17:25:59.435988500+00:00","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee"},"id":"d40c7577-0b4f-4654-a1eb-671ec35c8dbe"},"meta":{"generatedAt":"2026-11-14T17:36:10Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db log list -l 3`
exit: 0
stdout (7 lines):
```
✅ ⏱️  Time Logs:
────────────────────────────────────────────────────────────────────────────
 • [2026-11-14T17:33:56] "Design logo" (0m 0s) ➔ [ID: log_1794677636098_0]
 • [2026-11-14T17:33:54] "Write API docs" (0m 0s) ➔ [ID: log_1794677634691_0]
 • [2026-11-14T17:33:48] "Design logo" (0m 1s) ➔ [ID: log_1794677628942_0]
… 9 more entries not shown. Use --limit <n> to show more.

```
stderr (0 lines):
```
```

### `oxy --db t.db report`
exit: 0
stdout (11 lines):
```
✅ 📊 Time Tracking Hierarchy Report (All Time, Europe/Warsaw)
──────────────────────────────────────────────────
📦 "Acme Corp" [05h 15m] (61.2%) [██████░░░░]
├── 📋 "Build landing page" [03h 00m] (35.0%) [███░░░░░░░]
├── 📋 "Write API tests" [02h 15m] (26.2%) [███░░░░░░░]
└── 📋 "Write API docs" [00m 01s] (0.0%) [░░░░░░░░░░]
📦 "Personal Site" [03h 20m] (38.8%) [████░░░░░░]
└── 📋 "Design logo" [03h 20m] (38.8%) [████░░░░░░]
──────────────────────────────────────────────────
Total Time: 08h 35m (4 active tasks)

```
stderr (0 lines):
```
```

### `oxy --db t.db report --week`
exit: 0
stdout (11 lines):
```
✅ 📊 Time Tracking Hierarchy Report (This Week, Europe/Warsaw)
──────────────────────────────────────────────────
📦 "Acme Corp" [05h 15m] (61.2%) [██████░░░░]
├── 📋 "Build landing page" [03h 00m] (35.0%) [███░░░░░░░]
├── 📋 "Write API tests" [02h 15m] (26.2%) [███░░░░░░░]
└── 📋 "Write API docs" [00m 01s] (0.0%) [░░░░░░░░░░]
📦 "Personal Site" [03h 20m] (38.8%) [████░░░░░░]
└── 📋 "Design logo" [03h 20m] (38.8%) [████░░░░░░]
──────────────────────────────────────────────────
Total Time: 08h 35m (4 active tasks)

```
stderr (0 lines):
```
```

### `oxy --db t.db report --variant summary`
exit: 0
stdout (11 lines):
```
✅ 📊 Time Tracking Hierarchy Report (All Time, Europe/Warsaw)
──────────────────────────────────────────────────
📦 "Acme Corp" [05h 15m] (61.2%) [██████░░░░]
├── 📋 "Build landing page" [03h 00m] (35.0%) [███░░░░░░░]
├── 📋 "Write API tests" [02h 15m] (26.2%) [███░░░░░░░]
└── 📋 "Write API docs" [00m 01s] (0.0%) [░░░░░░░░░░]
📦 "Personal Site" [03h 20m] (38.8%) [████░░░░░░]
└── 📋 "Design logo" [03h 20m] (38.8%) [████░░░░░░]
──────────────────────────────────────────────────
Total Time: 08h 35m (4 active tasks)

```
stderr (0 lines):
```
```

### `oxy --db t.db report -q --month`
exit: 0
stdout (1 lines):
```
Total Time: 08h 35m (4 active tasks)
```
stderr (0 lines):
```
```

### `oxy --db t.db --json report --month`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.report","schemaVersion":2,"data":{"days":[{"date":"2026-11-01","seconds":0},{"date":"2026-11-02","seconds":0},{"date":"2026-11-03","seconds":0},{"date":"2026-11-04","seconds":0},{"date":"2026-11-05","seconds":0},{"date":"2026-11-06","seconds":0},{"date":"2026-11-07","seconds":0},{"date":"2026-11-08","seconds":0},{"date":"2026-11-09","seconds":0},{"date":"2026-11-10","seconds":9000},{"date":"2026-11-11","seconds":3000},{"date":"2026-11-12","seconds":0},{"date":"2026-11-13","seconds":5400},{"date":"2026-11-14","seconds":13505},{"date":"2026-11-15","seconds":0},{"date":"2026-11-16","seconds":0},{"date":"2026-11-17","seconds":0},{"date":"2026-11-18","seconds":0},{"date":"2026-11-19","seconds":0},{"date":"2026-11-20","seconds":0},{"date":"2026-11-21","seconds":0},{"date":"2026-11-22","seconds":0},{"date":"2026-11-23","seconds":0},{"date":"2026-11-24","seconds":0},{"date":"2026-11-25","seconds":0},{"date":"2026-11-26","seconds":0},{"date":"2026-11-27","seconds":0},{"date":"2026-11-28","seconds":0},{"date":"2026-11-29","seconds":0},{"date":"2026-11-30","seconds":0}],"entries":[{"amountMinor":10000,"clamped":false,"currency":"PLN","date":"2026-11-10","end":"2026-11-10T09:30:00Z","id":"56cfe9d8-bdfa-4da3-8644-24c14350701c","isPatch":false,"originalSeconds":1800,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":1800,"start":"2026-11-10T09:00:00Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"amountMinor":20000,"clamped":false,"currency":"PLN","date":"2026-11-10","end":"2026-11-10T10:00:00Z","id":"c75d0397-c9ae-433e-b31d-660e2e0bd61e","isPatch":false,"originalSeconds":3600,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":3600,"start":"2026-11-10T09:00:00Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"clamped":false,"date":"2026-11-10","end":"2026-11-10T23:50:00Z","id":"1b77b2f3-91c7-4d7f-a93e-2ac288272309","isPatch":false,"note":"late night UTC","originalSeconds":6600,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":6600,"start":"2026-11-10T22:00:00Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":30000,"clamped":false,"currency":"PLN","date":"2026-11-13","end":"2026-11-13T10:30:00Z","id":"4bd41519-d71a-405f-82a7-0d0fd72a5b65","isPatch":false,"note":"retro session","originalSeconds":5400,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":5400,"start":"2026-11-13T09:00:00Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"clamped":false,"date":"2026-11-14","end":"2026-11-14T17:34:24Z","id":"f8487c4f-680c-47fc-9423-d0b824f7c472","isPatch":false,"originalSeconds":5400,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":5400,"start":"2026-11-14T16:04:24Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":22500,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:34:25Z","id":"5a2531ba-23d2-47a9-8789-5a9b55682ce6","isPatch":false,"originalSeconds":5400,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","seconds":5400,"start":"2026-11-14T16:04:25Z","taskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","taskName":"Write API tests"},{"amountMinor":11250,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:34:24Z","id":"bfba2ec3-ecaa-40b7-9a7a-364a08a63c54","isPatch":false,"note":"manual entry","originalSeconds":2700,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","seconds":2700,"start":"2026-11-14T16:49:24Z","taskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","taskName":"Write API tests"},{"amountMinor":17,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:31Z","id":"log_1794677607857_0","isPatch":false,"originalSeconds":3,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":3,"start":"2026-11-14T17:33:27Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"amountMinor":4,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:33Z","id":"log_1794677611754_0","isPatch":false,"originalSeconds":1,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"541d88e9-679f-4d40-91ca-de120db8972d","seconds":1,"start":"2026-11-14T17:33:31Z","taskId":"541d88e9-679f-4d40-91ca-de120db8972d","taskName":"Write API docs"},{"clamped":false,"date":"2026-11-14","end":"2026-11-14T17:33:50Z","id":"log_1794677628942_0","isPatch":false,"originalSeconds":1,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":1,"start":"2026-11-14T17:33:48Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":0,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:55Z","id":"log_1794677634691_0","isPatch":false,"originalSeconds":0,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"541d88e9-679f-4d40-91ca-de120db8972d","seconds":0,"start":"2026-11-14T17:33:54Z","taskId":"541d88e9-679f-4d40-91ca-de120db8972d","taskName":"Write API docs"},{"clamped":false,"date":"2026-11-14","end":"2026-11-14T17:33:56Z","id":"log_1794677636098_0","isPatch":false,"originalSeconds":0,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":0,"start":"2026-11-14T17:33:56Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"}],"filters":{"includePatches":true},"generatedAt":"2026-11-14T17:36:18Z","generator":{"name":"oxy","version":"1.14.5"},"projects":[{"billing":[{"amountMinor":93771,"billableSeconds":18904,"currency":"PLN","nonBillableSeconds":0,"unconfiguredSeconds":0}],"directSeconds":0,"id":"74adfd00-6e21-44c3-92f4-abed3e69a84b","name":"Acme Corp","seconds":18904,"shareBasisPoints":6117,"tasks":[{"amountMinor":60017,"currency":"PLN","directSeconds":10803,"id":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","name":"Build landing page","rateMinor":20000,"rateStatus":"custom","seconds":10803,"shareBasisPoints":3496,"subtasks":[]},{"amountMinor":33750,"currency":"PLN","directSeconds":8100,"id":"85aae435-769b-4c24-be77-4d2cd77bca7a","name":"Write API tests","rateMinor":15000,"rateStatus":"inherited","seconds":8100,"shareBasisPoints":2621,"subtasks":[]},{"amountMinor":4,"currency":"PLN","directSeconds":1,"id":"541d88e9-679f-4d40-91ca-de120db8972d","name":"Write API docs","rateMinor":15000,"rateStatus":"inherited","seconds":1,"shareBasisPoints":0,"subtasks":[]}]},{"billing":[],"directSeconds":0,"id":"dfbc7198-c47c-4b94-80ef-8dd84c696734","name":"Personal Site","seconds":12001,"shareBasisPoints":3883,"tasks":[{"directSeconds":12001,"id":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","name":"Design logo","rateStatus":"unconfigured","seconds":12001,"shareBasisPoints":3883,"subtasks":[]}]}],"range":{"from":"2026-10-31T23:00:00Z","preset":"month","timezone":"Europe/Warsaw","to":"2026-11-30T23:00:00Z"},"schema":"oxy.report","schemaVersion":2,"totals":{"billableSeconds":18904,"billing":[{"amountMinor":93771,"billableSeconds":18904,"currency":"PLN","nonBillableSeconds":0,"unconfiguredSeconds":0}],"entryCount":12,"nonBillableSeconds":0,"seconds":30905,"unconfiguredSeconds":12001},"variant":"full"},"meta":{"generatedAt":"2026-11-14T17:36:18Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db report --from 2001-01-01 --to 2001-01-02`
exit: 0
stdout (1 lines):
```
✅ No time logs recorded for the selected period.
```
stderr (0 lines):
```
```

### `oxy --db t.db report --from 2001-01-01 --to 2001-01-02 --json`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.report","schemaVersion":2,"data":{"days":[{"date":"2001-01-01","seconds":0},{"date":"2001-01-02","seconds":0}],"entries":[],"filters":{"includePatches":true},"generatedAt":"2026-11-14T17:36:19Z","generator":{"name":"oxy","version":"1.14.5"},"projects":[],"range":{"from":"2000-12-31T23:00:00Z","timezone":"Europe/Warsaw","to":"2001-01-02T23:00:00Z"},"schema":"oxy.report","schemaVersion":2,"totals":{"billableSeconds":0,"billing":[],"entryCount":0,"nonBillableSeconds":0,"seconds":0,"unconfiguredSeconds":0},"variant":"full"},"meta":{"generatedAt":"2026-11-14T17:36:19Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db report --from 2026-11-01 --to 2026-11-15 --tz Europe/Warsaw -p Acme Corp`
exit: 0
stdout (9 lines):
```
✅ 📊 Time Tracking Hierarchy Report (Custom Range, Europe/Warsaw)
──────────────────────────────────────────────────
📦 "Acme Corp" [05h 15m] (100.0%) [██████████]
├── 📋 "Build landing page" [03h 00m] (57.1%) [██████░░░░]
├── 📋 "Write API tests" [02h 15m] (42.8%) [████░░░░░░]
└── 📋 "Write API docs" [00m 01s] (0.0%) [░░░░░░░░░░]
──────────────────────────────────────────────────
Total Time: 05h 15m (3 active tasks)

```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f html --variant full -o out-html-full.html`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-html-full.html' (html)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f html --variant summary -o out-html-summary.html`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-html-summary.html' (html)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f csv --variant full -o out-csv-full.csv`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-csv-full.csv' (csv)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f csv --variant summary -o out-csv-summary.csv`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-csv-summary.csv' (csv)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f json --variant full -o out-json-full.json`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-json-full.json' (json)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f json --variant summary -o out-json-summary.json`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-json-summary.json' (json)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f jsonl --variant full -o out-jsonl-full.jsonl`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-jsonl-full.jsonl' (jsonl)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f jsonl --variant summary -o out-jsonl-summary.jsonl`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-jsonl-summary.jsonl' (jsonl)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f xml --variant full -o out-xml-full.xml`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-xml-full.xml' (xml)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f xml --variant summary -o out-xml-summary.xml`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-xml-summary.xml' (xml)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f ods --variant full -o out-ods-full.ods`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-ods-full.ods' (ods)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f ods --variant summary -o out-ods-summary.ods`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-ods-summary.ods' (ods)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f xlsx --variant full -o out-xlsx-full.xlsx`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-xlsx-full.xlsx' (xlsx)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f xlsx --variant summary -o out-xlsx-summary.xlsx`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-xlsx-summary.xlsx' (xlsx)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f json -o -`
exit: 0
stdout (441 lines):
```
{
  "schema": "oxy.report",
  "schemaVersion": 2,
  "variant": "full",
  "generatedAt": "2026-11-14T17:37:03Z",
  "generator": {
    "name": "oxy",
    "version": "1.14.5"
  },
  "range": {
    "from": "2026-10-31T23:00:00Z",
    "to": "2026-11-30T23:00:00Z",
    "timezone": "Europe/Warsaw",
    "preset": "month"
  },
  "filters": {
    "includePatches": true
  },
  "totals": {
    "seconds": 30905,
    "entryCount": 12,
    "billableSeconds": 18904,
    "nonBillableSeconds": 0,
    "unconfiguredSeconds": 12001,
    "billing": [
      {
        "currency": "PLN",
        "amountMinor": 93771,
        "billableSeconds": 18904,
        "nonBillableSeconds": 0,
        "unconfiguredSeconds": 0
      }
    ]
  },
  "projects": [
    {
      "id": "74adfd00-6e21-44c3-92f4-abed3e69a84b",
      "name": "Acme Corp",
      "directSeconds": 0,
      "seconds": 18904,
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f csv -o - --csv-delimiter ; --bom`
exit: 0
stdout (13 lines):
```
﻿entryId;projectId;projectName;taskId;taskName;date;startUtc;endUtc;seconds;note;amount;currency
56cfe9d8-bdfa-4da3-8644-24c14350701c;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;fe792a2c-68ab-43c1-95f8-4b37cd96fd56;Build landing page;2026-11-10;2026-11-10T09:00:00Z;2026-11-10T09:30:00Z;1800;;100.00;PLN
c75d0397-c9ae-433e-b31d-660e2e0bd61e;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;fe792a2c-68ab-43c1-95f8-4b37cd96fd56;Build landing page;2026-11-10;2026-11-10T09:00:00Z;2026-11-10T10:00:00Z;3600;;200.00;PLN
1b77b2f3-91c7-4d7f-a93e-2ac288272309;dfbc7198-c47c-4b94-80ef-8dd84c696734;Personal Site;fb2ce5f5-9e77-4526-b888-9b397205c6ee;Design logo;2026-11-10;2026-11-10T22:00:00Z;2026-11-10T23:50:00Z;6600;late night UTC;;
4bd41519-d71a-405f-82a7-0d0fd72a5b65;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;fe792a2c-68ab-43c1-95f8-4b37cd96fd56;Build landing page;2026-11-13;2026-11-13T09:00:00Z;2026-11-13T10:30:00Z;5400;retro session;300.00;PLN
f8487c4f-680c-47fc-9423-d0b824f7c472;dfbc7198-c47c-4b94-80ef-8dd84c696734;Personal Site;fb2ce5f5-9e77-4526-b888-9b397205c6ee;Design logo;2026-11-14;2026-11-14T16:04:24Z;2026-11-14T17:34:24Z;5400;;;
5a2531ba-23d2-47a9-8789-5a9b55682ce6;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;85aae435-769b-4c24-be77-4d2cd77bca7a;Write API tests;2026-11-14;2026-11-14T16:04:25Z;2026-11-14T17:34:25Z;5400;;225.00;PLN
bfba2ec3-ecaa-40b7-9a7a-364a08a63c54;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;85aae435-769b-4c24-be77-4d2cd77bca7a;Write API tests;2026-11-14;2026-11-14T16:49:24Z;2026-11-14T17:34:24Z;2700;manual entry;112.50;PLN
log_1794677607857_0;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;fe792a2c-68ab-43c1-95f8-4b37cd96fd56;Build landing page;2026-11-14;2026-11-14T17:33:27Z;2026-11-14T17:33:31Z;3;;0.17;PLN
log_1794677611754_0;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;541d88e9-679f-4d40-91ca-de120db8972d;Write API docs;2026-11-14;2026-11-14T17:33:31Z;2026-11-14T17:33:33Z;1;;0.04;PLN
log_1794677628942_0;dfbc7198-c47c-4b94-80ef-8dd84c696734;Personal Site;fb2ce5f5-9e77-4526-b888-9b397205c6ee;Design logo;2026-11-14;2026-11-14T17:33:48Z;2026-11-14T17:33:50Z;1;;;
log_1794677634691_0;74adfd00-6e21-44c3-92f4-abed3e69a84b;Acme Corp;541d88e9-679f-4d40-91ca-de120db8972d;Write API docs;2026-11-14;2026-11-14T17:33:54Z;2026-11-14T17:33:55Z;0;;0.00;PLN
log_1794677636098_0;dfbc7198-c47c-4b94-80ef-8dd84c696734;Personal Site;fb2ce5f5-9e77-4526-b888-9b397205c6ee;Design logo;2026-11-14;2026-11-14T17:33:56Z;2026-11-14T17:33:56Z;0;;;
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f csv -o - --csv-delimiter tab`
exit: 0
stdout (13 lines):
```
entryId	projectId	projectName	taskId	taskName	date	startUtc	endUtc	seconds	note	amount	currency
56cfe9d8-bdfa-4da3-8644-24c14350701c	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	fe792a2c-68ab-43c1-95f8-4b37cd96fd56	Build landing page	2026-11-10	2026-11-10T09:00:00Z	2026-11-10T09:30:00Z	1800		100.00	PLN
c75d0397-c9ae-433e-b31d-660e2e0bd61e	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	fe792a2c-68ab-43c1-95f8-4b37cd96fd56	Build landing page	2026-11-10	2026-11-10T09:00:00Z	2026-11-10T10:00:00Z	3600		200.00	PLN
1b77b2f3-91c7-4d7f-a93e-2ac288272309	dfbc7198-c47c-4b94-80ef-8dd84c696734	Personal Site	fb2ce5f5-9e77-4526-b888-9b397205c6ee	Design logo	2026-11-10	2026-11-10T22:00:00Z	2026-11-10T23:50:00Z	6600	late night UTC		
4bd41519-d71a-405f-82a7-0d0fd72a5b65	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	fe792a2c-68ab-43c1-95f8-4b37cd96fd56	Build landing page	2026-11-13	2026-11-13T09:00:00Z	2026-11-13T10:30:00Z	5400	retro session	300.00	PLN
f8487c4f-680c-47fc-9423-d0b824f7c472	dfbc7198-c47c-4b94-80ef-8dd84c696734	Personal Site	fb2ce5f5-9e77-4526-b888-9b397205c6ee	Design logo	2026-11-14	2026-11-14T16:04:24Z	2026-11-14T17:34:24Z	5400			
5a2531ba-23d2-47a9-8789-5a9b55682ce6	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	85aae435-769b-4c24-be77-4d2cd77bca7a	Write API tests	2026-11-14	2026-11-14T16:04:25Z	2026-11-14T17:34:25Z	5400		225.00	PLN
bfba2ec3-ecaa-40b7-9a7a-364a08a63c54	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	85aae435-769b-4c24-be77-4d2cd77bca7a	Write API tests	2026-11-14	2026-11-14T16:49:24Z	2026-11-14T17:34:24Z	2700	manual entry	112.50	PLN
log_1794677607857_0	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	fe792a2c-68ab-43c1-95f8-4b37cd96fd56	Build landing page	2026-11-14	2026-11-14T17:33:27Z	2026-11-14T17:33:31Z	3		0.17	PLN
log_1794677611754_0	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	541d88e9-679f-4d40-91ca-de120db8972d	Write API docs	2026-11-14	2026-11-14T17:33:31Z	2026-11-14T17:33:33Z	1		0.04	PLN
log_1794677628942_0	dfbc7198-c47c-4b94-80ef-8dd84c696734	Personal Site	fb2ce5f5-9e77-4526-b888-9b397205c6ee	Design logo	2026-11-14	2026-11-14T17:33:48Z	2026-11-14T17:33:50Z	1			
log_1794677634691_0	74adfd00-6e21-44c3-92f4-abed3e69a84b	Acme Corp	541d88e9-679f-4d40-91ca-de120db8972d	Write API docs	2026-11-14	2026-11-14T17:33:54Z	2026-11-14T17:33:55Z	0		0.00	PLN
log_1794677636098_0	dfbc7198-c47c-4b94-80ef-8dd84c696734	Personal Site	fb2ce5f5-9e77-4526-b888-9b397205c6ee	Design logo	2026-11-14	2026-11-14T17:33:56Z	2026-11-14T17:33:56Z	0			
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f csv -o - --csv-delimiter |`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Invalid CSV delimiter '|'. Use ',', ';' or 'tab'.
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db report --month -f json -o - -q`
exit: 0
stdout (441 lines):
```
{
  "schema": "oxy.report",
  "schemaVersion": 2,
  "variant": "full",
  "generatedAt": "2026-11-14T17:37:07Z",
  "generator": {
    "name": "oxy",
    "version": "1.14.5"
  },
  "range": {
    "from": "2026-10-31T23:00:00Z",
    "to": "2026-11-30T23:00:00Z",
    "timezone": "Europe/Warsaw",
    "preset": "month"
  },
  "filters": {
    "includePatches": true
  },
  "totals": {
    "seconds": 30905,
    "entryCount": 12,
    "billableSeconds": 18904,
    "nonBillableSeconds": 0,
    "unconfiguredSeconds": 12001,
    "billing": [
      {
        "currency": "PLN",
        "amountMinor": 93771,
        "billableSeconds": 18904,
        "nonBillableSeconds": 0,
        "unconfiguredSeconds": 0
      }
    ]
  },
  "projects": [
    {
      "id": "74adfd00-6e21-44c3-92f4-abed3e69a84b",
      "name": "Acme Corp",
      "directSeconds": 0,
      "seconds": 18904,
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f json -o - --json`
exit: 0
stdout (441 lines):
```
{
  "schema": "oxy.report",
  "schemaVersion": 2,
  "variant": "full",
  "generatedAt": "2026-11-14T17:37:07Z",
  "generator": {
    "name": "oxy",
    "version": "1.14.5"
  },
  "range": {
    "from": "2026-10-31T23:00:00Z",
    "to": "2026-11-30T23:00:00Z",
    "timezone": "Europe/Warsaw",
    "preset": "month"
  },
  "filters": {
    "includePatches": true
  },
  "totals": {
    "seconds": 30905,
    "entryCount": 12,
    "billableSeconds": 18904,
    "nonBillableSeconds": 0,
    "unconfiguredSeconds": 12001,
    "billing": [
      {
        "currency": "PLN",
        "amountMinor": 93771,
        "billableSeconds": 18904,
        "nonBillableSeconds": 0,
        "unconfiguredSeconds": 0
      }
    ]
  },
  "projects": [
    {
      "id": "74adfd00-6e21-44c3-92f4-abed3e69a84b",
      "name": "Acme Corp",
      "directSeconds": 0,
      "seconds": 18904,
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f csv -o out-bom.csv --bom --csv-delimiter ;`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-bom.csv' (csv)
```
stderr (0 lines):
```
```

### `oxy --db t.db report --month -f json --bom`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: --bom only applies to the 'csv' format, not 'json'.
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db report --month -f html -o -`
exit: 0
stdout (210 lines):
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>oXyFlow Work Report — This Month, Europe/Warsaw</title>
    <style>
        :root {
            --bg: #0f172a;
            --card: #1e293b;
            --border: #334155;
            --text: #f8fafc;
            --muted: #94a3b8;
            --accent: #38bdf8;
            --accent-task: #818cf8;
            --accent-subtask: #a78bfa;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 2rem;
            line-height: 1.5;
        }
        .container {
            max-width: 960px;
            margin: 0 auto;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 1.5rem;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
```
stderr (0 lines):
```
```

### `oxy --db t.db report -f xml --variant summary -o out-x.xml`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'out-x.xml' (xml)
```
stderr (0 lines):
```
```

### `oxy --db t.db report schema`
exit: 0
stdout (521 lines):
```
{
  "$id": "urn:oxyflow:schema:oxy.report:2",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "oxy.report",
  "description": "The single report model every export format projects from.\n\nInvariants consumers rely on:\n- The model holds raw values only. Formatted or display strings belong to the projection,\n  so one document renders identically in every locale and format.\n- Durations are whole seconds, money is integer minor units and shares are integer basis\n  points, which keeps sums exact and serialization byte-identical across runtimes.\n- `entries` is present only for `ReportVariant::Full`; for `Full` it is `[]` (not omitted)\n  when the range is empty.\n- An empty range yields zero totals and empty arrays, except `days` of a range with both\n  bounds, which lists its zero days.\n- Only projects and tasks with time in the range appear.\n- Ordering is deterministic. `projects` and root `tasks` are ordered by `seconds` descending,\n  then `id` ascending. `subtasks` are in depth-first pre-order with siblings ordered by\n  `seconds` descending, then `id` ascending. `billing` items are ordered by `currency`\n  ascending, `days` by `date` ascending and `entries` by `start` ascending, then `id` ascending.\n- `days` splits entries crossing local midnight in `range.timezone`; see `ReportDay`.\n- Field order is stable. New fields may only be appended; any other change to the shape\n  must bump `REPORT_SCHEMA_VERSION`.",
  "type": "object",
  "properties": {
    "days": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/ReportDay"
      }
    },
    "entries": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/ReportEntry"
      }
    },
    "filters": {
      "$ref": "#/$defs/ReportFilters"
    },
    "generatedAt": {
      "description": "RFC3339 UTC with a `Z` suffix and whole seconds.",
      "type": "string"
    },
    "generator": {
      "$ref": "#/$defs/ReportGenerator"
    },
    "projects": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/ReportProject"
      }
    },
    "range": {
      "$ref": "#/$defs/ResolvedRange"
    },
    "schema": {
      "type": "string",
```
stderr (0 lines):
```
```

### `oxy --db t.db report schema --format xml`
exit: 0
stdout (196 lines):
```
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">

  <!--
    XML projection of the oxy.report v2 document (ReportDocument).

    Conventions:
    - Identifiers, instants, counts and enumerations are attributes; free text (names, notes) is
      element content so whitespace and line breaks survive.
    - An optional document field is an optional attribute or element; it is omitted, never empty.
    - Durations are whole seconds, money is integer minor units and shares are basis points.
    - Element order follows the document order produced by the engine and is never re-sorted.
    - The summary variant carries no <days> and no <entries>; the full variant always carries
      both, empty when the range has no data.
  -->

  <xs:element name="report" type="ReportType"/>

  <xs:simpleType name="VariantType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="full"/>
      <xs:enumeration value="summary"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="RangePresetType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="today"/>
      <xs:enumeration value="yesterday"/>
      <xs:enumeration value="week"/>
      <xs:enumeration value="lastWeek"/>
      <xs:enumeration value="month"/>
      <xs:enumeration value="lastMonth"/>
      <xs:enumeration value="all"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="RateStatusType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="inherited"/>
```
stderr (0 lines):
```
```

### `oxy --db t.db report schema --target envelope`
exit: 0
stdout (59 lines):
```
{
  "$id": "urn:oxyflow:schema:oxy.envelope:1",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "oxy.envelope",
  "description": "Versioned wrapper around every successful `--json` / `--machine` payload.",
  "type": "object",
  "properties": {
    "data": true,
    "meta": {
      "$ref": "#/$defs/EnvelopeMeta"
    },
    "schema": {
      "type": "string"
    },
    "schemaVersion": {
      "type": "integer",
      "format": "uint32",
      "minimum": 0
    }
  },
  "required": [
    "schema",
    "schemaVersion",
    "data",
    "meta"
  ],
  "$defs": {
    "EnvelopeMeta": {
      "type": "object",
      "properties": {
        "generatedAt": {
          "type": "string"
        },
        "generator": {
          "$ref": "#/$defs/ReportGenerator"
        }
      },
      "required": [
        "generatedAt",
        "generator"
```
stderr (0 lines):
```
```

### `oxy --db t.db report schema --format xml --target envelope`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: The envelope schema is only available as JSON. Use --format json.
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db report schema --format json -o schema-report.json`
exit: 0
stdout (1 lines):
```
✅ Exported oxy.report schema v2 to 'schema-report.json'
```
stderr (0 lines):
```
```

### `oxy --db t.db report schema --format xml -o schema.xsd`
exit: 0
stdout (1 lines):
```
✅ Exported XML schema v2 to 'schema.xsd'
```
stderr (0 lines):
```
```

### `oxy --db t.db report -f table -o rep.txt`
exit: 0
stdout (1 lines):
```
✅ Exported report to 'rep.txt' (table)
```
stderr (0 lines):
```
```

### `oxy --db t.db report -f html`
exit: 0
stdout (210 lines):
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>oXyFlow Work Report — All Time, Europe/Warsaw</title>
    <style>
        :root {
            --bg: #0f172a;
            --card: #1e293b;
            --border: #334155;
            --text: #f8fafc;
            --muted: #94a3b8;
            --accent: #38bdf8;
            --accent-task: #818cf8;
            --accent-subtask: #a78bfa;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 2rem;
            line-height: 1.5;
        }
        .container {
            max-width: 960px;
            margin: 0 auto;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 1.5rem;
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
```
stderr (0 lines):
```
```

### `oxy frobnicate`
exit: 2
stdout (0 lines):
```
```
stderr (5 lines):
```
error: unrecognized subcommand 'frobnicate'

Usage: oxy [OPTIONS] [COMMAND]

For more information, try '--help'.
```

### `oxy --json frobnicate`
exit: 2
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"CLI_SYNTAX_UNKNOWN_COMMAND","category":"syntax","exit_code":2,"timestamp":"2026-11-14T17:37:28.562793+00:00","technical":"Unknown command: unrecognized subcommand 'frobnicate'"}
```

### `oxy --db t.db project list --bogus-flag`
exit: 2
stdout (0 lines):
```
```
stderr (5 lines):
```
error: unexpected argument '--bogus-flag' found

Usage: oxy project list [OPTIONS]

For more information, try '--help'.
```

### `oxy --json --db t.db project list --bogus-flag`
exit: 2
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"CLI_SYNTAX_INVALID_ARGS","category":"syntax","exit_code":2,"timestamp":"2026-11-14T17:37:29.956942+00:00","technical":"unexpected argument '--bogus-flag' found","details":{"field":"--bogus-flag"}}
```

### `oxy --db t.db report --from 2026-13-45`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Invalid range input: unrecognized date/time value: '2026-13-45'
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --json --db t.db report --from 2026-13-45`
exit: 2
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"CLI_SYNTAX_INVALID_ARGS","category":"syntax","exit_code":2,"timestamp":"2026-11-14T17:37:31.372503800+00:00","technical":"Invalid range input: unrecognized date/time value: '2026-13-45'"}
```

### `oxy --db t.db report --from 2026-11-20 --to 2026-11-01`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Invalid range input: from must be earlier than to
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db /nonexistent/dir/x.db project list`
exit: 3
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [STO_SQLITE_INIT]: Storage error: Initialization error: Database file 'C:/Program Files/Git/nonexistent/dir/x.db' does not exist. Check the --db path.
Remediation: Check file system permissions and disk capacity for the SQLite database.
```

### `oxy --json --db /nonexistent/dir/x.db project list`
exit: 3
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"STO_SQLITE_INIT","category":"storage","exit_code":3,"timestamp":"2026-11-14T17:37:33.369906500+00:00","technical":"Storage error: Initialization error: Database file 'C:/Program Files/Git/nonexistent/dir/x.db' does not exist. Check the --db path."}
```

### `oxy --db /nonexistent/dir/x.db --json status`
exit: 3
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"STO_SQLITE_INIT","category":"storage","exit_code":3,"timestamp":"2026-11-14T17:37:34.083342500+00:00","technical":"Storage error: Initialization error: Database file 'C:/Program Files/Git/nonexistent/dir/x.db' does not exist. Check the --db path."}
```

### `oxy --db nodb-here.db status`
exit: 3
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [STO_SQLITE_INIT]: Storage error: Initialization error: Database file 'nodb-here.db' does not exist. Check the --db path.
Remediation: Check file system permissions and disk capacity for the SQLite database.
```

### `oxy --json --db nodb-here.db status`
exit: 3
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"STO_SQLITE_INIT","category":"storage","exit_code":3,"timestamp":"2026-11-14T17:37:35.503840700+00:00","technical":"Storage error: Initialization error: Database file 'nodb-here.db' does not exist. Check the --db path."}
```

### `oxy --machine --db /nonexistent/dir/x.db stop`
exit: 3
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"STO_SQLITE_INIT","category":"storage","exit_code":3,"timestamp":"2026-11-14T17:37:36.203526700+00:00","technical":"Storage error: Initialization error: Database file 'C:/Program Files/Git/nonexistent/dir/x.db' does not exist. Check the --db path."}
```

### `oxy `
exit: 0
stdout (12 lines):
```
✅ ⚡ oXyFlow Quick Status Dashboard
──────────────────────────────────────────────────
⏱️  Active Tracking Session
Status: ⏸️  IDLE (No active timers)
Tip: Use 'oxy start <task>' or 'oxy t ls' to view tasks.
📈 Today's Progress
 • Total Logged: 00m 00s across 0 sessions
🕒 Recent Activity
No time recorded today yet. Use 'oxy start <task>' to begin.
──────────────────────────────────────────────────
💡 Tip: Use 'oxy sw <task>' to switch tasks | 'oxy report' for full breakdown

```
stderr (0 lines):
```
```

### `oxy --json`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.dashboard","schemaVersion":1,"data":{"activeSession":null,"recentTasks":[],"running":false,"sessionCount":0,"todayDate":"2026-11-14","todayTotalSeconds":0},"meta":{"generatedAt":"2026-11-14T17:37:37Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy project`
exit: 2
stdout (0 lines):
```
```
stderr (19 lines):
```
Manage projects (ls, add, ren, rm)

Usage: oxy project [OPTIONS] <COMMAND>

Commands:
  list     List projects with summary metrics
  add      Create a new project
  rename   Rename, update, or recolor an existing project
  archive  Archive a project
  help     Print this message or the help of the given subcommand(s)

Options:
  -m, --machine  Deterministic silent machine JSON output
  -j, --json     Output clean JSON to stdout
  -q, --quiet    Suppress non-essential output
      --exact    Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>  Explicit path to SQLite database file
      --tz <TZ>  IANA timezone for date ranges (default: app setting or system)
  -h, --help     Print help
```

### `oxy log remove 1234`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Time log '1234' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db config ls`
exit: 0
stdout (6 lines):
```
✅ ⚙️  Configuration Settings:
──────────────────────────────────────────────────
 • active_sinks = "["Csv"]"
 • auto_start = "false"
 • include_patches_in_reports = "false"

```
stderr (0 lines):
```
```

### `oxy --db t.db config get cli_machine_locale`
exit: 0
stdout (1 lines):
```
✅ en
```
stderr (0 lines):
```
```

### `oxy --db t.db config set cli_machine_locale pl`
exit: 0
stdout (1 lines):
```
✅ Set configuration 'cli_machine_locale' = "pl"
```
stderr (0 lines):
```
```

### `oxy --db t.db config get cli_machine_locale`
exit: 0
stdout (1 lines):
```
✅ pl
```
stderr (0 lines):
```
```

### `oxy --db t.db config ls`
exit: 0
stdout (7 lines):
```
✅ ⚙️  Configuration Settings:
──────────────────────────────────────────────────
 • active_sinks = "["Csv"]"
 • auto_start = "false"
 • cli_machine_locale = "pl"
 • include_patches_in_reports = "false"

```
stderr (0 lines):
```
```

### `oxy --db t.db config set cli_machine_locale xx`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Invalid machine locale 'xx'. Supported values are: pl, en, de, es, pt-br, fr, uk, ja, nl, it (system and custom are not allowed for machine output).
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db config set no_such_key 1`
exit: 0
stdout (1 lines):
```
✅ Set configuration 'no_such_key' = "1"
```
stderr (0 lines):
```
```

### `oxy --db t.db config get no_such_key`
exit: 0
stdout (1 lines):
```
✅ 1
```
stderr (0 lines):
```
```

### `oxy --db t.db --json config ls`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.config.list","schemaVersion":1,"data":{"items":[{"key":"active_sinks","value":"[\"Csv\"]"},{"key":"auto_start","value":"false"},{"key":"cli_machine_locale","value":"pl"},{"key":"include_patches_in_reports","value":"false"},{"key":"no_such_key","value":"1"}]},"meta":{"generatedAt":"2026-11-14T17:37:59Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db t ls`
exit: 0
stdout (8 lines):
```
✅ 📋 Tasks:
──────────────────────────────────────────────────
[ ] "Build landing page" [ID: fe792a2c-68ab-43c1-95f8-4b37cd96fd56] (Acme Corp)
   ↳ [ ] "Fix login bug" [ID: 346f5c41-31da-4bf5-9aa6-802963419c52]
[ ] "Write API docs" [ID: 541d88e9-679f-4d40-91ca-de120db8972d] (Acme Corp)
[ ] "Design logo" [ID: fb2ce5f5-9e77-4526-b888-9b397205c6ee] (Personal Site)
[ ] "Write API tests" [ID: 85aae435-769b-4c24-be77-4d2cd77bca7a] (Acme Corp)

```
stderr (0 lines):
```
```

### `oxy --db t.db sw Design logo`
exit: 0
stdout (1 lines):
```
▶️ Started tracking task: fb2ce5f5-9e77-4526-b888-9b397205c6ee
```
stderr (0 lines):
```
```

### `oxy --db t.db summary`
exit: 0
stdout (14 lines):
```
✅ 📅 Work Summary for Today (2026-11-14)
──────────────────────────────────────────────────
 • [Personal Site] Design logo ➔ 90m 00s
 • [Acme Corp] Write API tests ➔ 90m 00s
 • [Acme Corp] Write API tests ➔ 45m 00s
 • [Acme Corp] Build landing page ➔ 00m 03s
 • [Acme Corp] Write API docs ➔ 00m 01s
 • [Personal Site] Design logo ➔ 00m 01s
 • [Acme Corp] Write API docs ➔ 00m 00s
 • [Personal Site] Design logo ➔ 00m 00s
 • [Personal Site] Design logo ➔ 00m 00s
──────────────────────────────────────────────────
Total Time Today: 3h 45m (9 entries)

```
stderr (0 lines):
```
```

### `oxy --db t.db timer start Design logo`
exit: 2
stdout (0 lines):
```
```
stderr (7 lines):
```
error: unrecognized subcommand 'timer'

  tip: a similar subcommand exists: 't'

Usage: oxy [OPTIONS] [COMMAND]

For more information, try '--help'.
```

### `oxy --db t.db stop --if-running`
exit: 0
stdout (1 lines):
```
⏹️ Stopped all active projects timer tracking threads.
```
stderr (0 lines):
```
```

### `oxy --db t.db sink list`
exit: 0
stdout (1 lines):
```
✅ No external sinks configured. Use 'oxy sink set-csv' or 'oxy sink set-webhook'.
```
stderr (0 lines):
```
```

### `oxy --db t.db sink set-csv --help`
exit: 0
stdout (13 lines):
```
Configure local CSV audit trail sink

Usage: oxy sink set-csv [OPTIONS] --dir <DIR>

Options:
  -d, --dir <DIR>  Target directory for CSV files
  -m, --machine    Deterministic silent machine JSON output
  -j, --json       Output clean JSON to stdout
  -q, --quiet      Suppress non-essential output
      --exact      Resolve targets only by full ID, unique ID prefix of 8 or more characters, or exact name
      --db <DB>    Explicit path to SQLite database file
      --tz <TZ>    IANA timezone for date ranges (default: app setting or system)
  -h, --help       Print help
```
stderr (0 lines):
```
```

### `oxy --db t.db sink set-csv --dir %TEMP%/oxy-cli-review/session/sinkdir`
exit: 0
stdout (1 lines):
```
✅ Configured CSV audit sink directory: %TEMP%/oxy-cli-review/session/sinkdir
```
stderr (0 lines):
```
```

### `oxy --db t.db sink list`
exit: 0
stdout (4 lines):
```
✅ 📡 Configured Sinks:
──────────────────────────────────────────────────
 • [csv] csv ➔ %TEMP%/oxy-cli-review/session/sinkdir (Enabled)

```
stderr (0 lines):
```
```

### `oxy --db t.db sink test`
exit: 0
stdout (4 lines):
```
✅ 🧪 Testing Configured Sinks:
──────────────────────────────────────────────────
 ✅ [csv] csv: healthy (write permission verified)

```
stderr (0 lines):
```
```

### `oxy --db t.db --json sink list`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.sink.list","schemaVersion":1,"data":{"items":[{"createdAt":"2026-11-14T17:38:13.395785500+00:00","enabled":true,"hasToken":false,"name":"csv","sinkType":"csv","target":"%TEMP%/oxy-cli-review/session/sinkdir"}]},"meta":{"generatedAt":"2026-11-14T17:38:15Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db sink set-webhook --url http://localhost:9/hook -t tok`
exit: 0
stdout (1 lines):
```
✅ Configured webhook sink URL: http://localhost:9/hook
```
stderr (0 lines):
```
```

### `oxy --db t.db sink test`
exit: 0
stdout (5 lines):
```
✅ 🧪 Testing Configured Sinks:
──────────────────────────────────────────────────
 ✅ [csv] csv: healthy (write permission verified)
 ✅ [webhook] webhook: healthy (URL endpoint syntax verified)

```
stderr (0 lines):
```
```

### `oxy --db t.db mask list`
exit: 0
stdout (1 lines):
```
✅ No action masks configured. Use 'oxy mask set <name> <template>'.
```
stderr (0 lines):
```
```

### `oxy --db t.db mask set ps start $1`
exit: 0
stdout (1 lines):
```
✅ Registered action mask 'ps' ➔ "start $1"
```
stderr (0 lines):
```
```

### `oxy --db t.db mask set ps2 log add $1 $2`
exit: 0
stdout (1 lines):
```
✅ Registered action mask 'ps2' ➔ "log add $1 $2"
```
stderr (0 lines):
```
```

### `oxy --db t.db mask list`
exit: 0
stdout (5 lines):
```
✅ 🎭 Registered Action Masks:
──────────────────────────────────────────────────
 • ps ➔ "start $1"
 • ps2 ➔ "log add $1 $2"

```
stderr (0 lines):
```
```

### `oxy --db t.db ps Design logo`
exit: 0
stdout (1 lines):
```
▶️ Started tracking task: fb2ce5f5-9e77-4526-b888-9b397205c6ee
```
stderr (0 lines):
```
```

### `oxy --db t.db mask remove ps`
exit: 0
stdout (1 lines):
```
✅ Removed action mask: ps
```
stderr (0 lines):
```
```

### `oxy --db t.db mask remove ps`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [MSK_ALIAS_NOT_FOUND]: Action mask alias 'ps' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db doctor`
exit: 0
stdout (9 lines):
```
✅ 🩺 oXyFlow System & Database Diagnostics
──────────────────────────────────────────────────
 • Database: t.db (110592 bytes)
 • [OK] database_file: Accessible, size: 110592 bytes
 • [OK] sqlite_integrity: PRAGMA integrity_check passed
 • [OK] schema_tables: All core tables verified (12 total)
 • [OK] external_sinks: 2 configured sink(s) verified

All diagnostic checks passed successfully.
```
stderr (0 lines):
```
```

### `oxy --db t.db --json doctor`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.doctor","schemaVersion":1,"data":{"checks":[{"message":"Accessible, size: 110592 bytes","name":"database_file","status":"ok"},{"message":"PRAGMA integrity_check passed","name":"sqlite_integrity","status":"ok"},{"message":"All core tables verified (12 total)","name":"schema_tables","status":"ok"},{"message":"2 configured sink(s) verified","name":"external_sinks","status":"ok"}],"dbPath":"t.db","dbSizeBytes":110592,"overallStatus":"ok"},"meta":{"generatedAt":"2026-11-14T17:38:23Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db doctor --fix`
exit: 0
stdout (9 lines):
```
✅ 🩺 oXyFlow System & Database Diagnostics
──────────────────────────────────────────────────
 • Database: t.db (110592 bytes)
 • [OK] database_file: Accessible, size: 110592 bytes
 • [OK] sqlite_integrity: PRAGMA integrity_check passed
 • [OK] schema_tables: All core tables verified (12 total)
 • [OK] external_sinks: 2 configured sink(s) verified

All diagnostic checks passed successfully.
```
stderr (0 lines):
```
```

### `oxy --db t.db db backup t-backup.db`
exit: 0
stdout (1 lines):
```
✅ Database successfully backed up to 't-backup.db'
```
stderr (0 lines):
```
```

### `oxy --db t.db db backup t-backup.db`
exit: 0
stdout (1 lines):
```
✅ Database successfully backed up to 't-backup.db'
```
stderr (0 lines):
```
```

### `oxy --db t.db db restore t-backup.db`
exit: 0
stdout (1 lines):
```
✅ Database successfully restored from 't-backup.db'
```
stderr (0 lines):
```
```

### `oxy --db t.db db restore no-such-backup.db`
exit: 2
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [CLI_SYNTAX_INVALID_ARGS]: Backup source file 'no-such-backup.db' does not exist
Remediation: Run 'oxy --help' or 'oxy <command> --help' for syntax instructions.
```

### `oxy --db t.db --json db backup t-backup2.db`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.db.backup","schemaVersion":1,"data":{"destination":"t-backup2.db"},"meta":{"generatedAt":"2026-11-14T17:38:35Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db project rename Personal Site --rate 120 --currency EUR`
exit: 0
stdout (1 lines):
```
✅ Updated project: dfbc7198-c47c-4b94-80ef-8dd84c696734
```
stderr (0 lines):
```
```

### `oxy --db t.db project list`
exit: 0
stdout (5 lines):
```
✅ 📂 Projects:
──────────────────────────────────────────────────
 • "Acme Corp" [ID: 74adfd00-6e21-44c3-92f4-abed3e69a84b] (#FFFFFF) — 4 tasks
 • "Personal Site" [ID: dfbc7198-c47c-4b94-80ef-8dd84c696734] (indigo) — 1 tasks

```
stderr (0 lines):
```
```

### `oxy --db t.db task rate Design logo 80`
exit: 0
stdout (1 lines):
```
✅ Updated billing rate for task 'Design logo' (fb2ce5f5-9e77-4526-b888-9b397205c6ee) to 80.00.
```
stderr (0 lines):
```
```

### `oxy --db t.db task rate Design logo inherit`
exit: 0
stdout (1 lines):
```
✅ Updated billing rate for task 'Design logo' (fb2ce5f5-9e77-4526-b888-9b397205c6ee) to inherited.
```
stderr (0 lines):
```
```

### `oxy --db t.db task done Design logo`
exit: 0
stdout (1 lines):
```
✅ Marked task 'Design logo' [fb2ce5f5-9e77-4526-b888-9b397205c6ee] as completed.
```
stderr (0 lines):
```
```

### `oxy --db t.db task ls`
exit: 0
stdout (7 lines):
```
✅ 📋 Tasks:
──────────────────────────────────────────────────
[ ] "Build landing page" [ID: fe792a2c-68ab-43c1-95f8-4b37cd96fd56] (Acme Corp)
   ↳ [ ] "Fix login bug" [ID: 346f5c41-31da-4bf5-9aa6-802963419c52]
[ ] "Write API docs" [ID: 541d88e9-679f-4d40-91ca-de120db8972d] (Acme Corp)
[ ] "Write API tests" [ID: 85aae435-769b-4c24-be77-4d2cd77bca7a] (Acme Corp)

```
stderr (0 lines):
```
```

### `oxy --db t.db task rename Write API tests Write API tests (v2)`
exit: 0
stdout (1 lines):
```
✅ Renamed task: 85aae435-769b-4c24-be77-4d2cd77bca7a
```
stderr (0 lines):
```
```

### `oxy --db t.db task archive Fix login`
exit: 0
stdout (1 lines):
```
✅ Archived task: 346f5c41-31da-4bf5-9aa6-802963419c52
```
stderr (0 lines):
```
```

### `oxy --db t.db task list`
exit: 0
stdout (6 lines):
```
✅ 📋 Tasks:
──────────────────────────────────────────────────
[ ] "Build landing page" [ID: fe792a2c-68ab-43c1-95f8-4b37cd96fd56] (Acme Corp)
[ ] "Write API docs" [ID: 541d88e9-679f-4d40-91ca-de120db8972d] (Acme Corp)
[ ] "Write API tests (v2)" [ID: 85aae435-769b-4c24-be77-4d2cd77bca7a] (Acme Corp)

```
stderr (0 lines):
```
```

### `oxy --db t.db project archive Personal Site`
exit: 0
stdout (1 lines):
```
✅ Archived project: dfbc7198-c47c-4b94-80ef-8dd84c696734
```
stderr (0 lines):
```
```

### `oxy --db t.db project list`
exit: 0
stdout (4 lines):
```
✅ 📂 Projects:
──────────────────────────────────────────────────
 • "Acme Corp" [ID: 74adfd00-6e21-44c3-92f4-abed3e69a84b] (#FFFFFF) — 4 tasks

```
stderr (0 lines):
```
```

### `oxy --db t.db --json report --month`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.report","schemaVersion":2,"data":{"days":[{"date":"2026-11-01","seconds":0},{"date":"2026-11-02","seconds":0},{"date":"2026-11-03","seconds":0},{"date":"2026-11-04","seconds":0},{"date":"2026-11-05","seconds":0},{"date":"2026-11-06","seconds":0},{"date":"2026-11-07","seconds":0},{"date":"2026-11-08","seconds":0},{"date":"2026-11-09","seconds":0},{"date":"2026-11-10","seconds":9000},{"date":"2026-11-11","seconds":3000},{"date":"2026-11-12","seconds":0},{"date":"2026-11-13","seconds":5400},{"date":"2026-11-14","seconds":13538},{"date":"2026-11-15","seconds":0},{"date":"2026-11-16","seconds":0},{"date":"2026-11-17","seconds":0},{"date":"2026-11-18","seconds":0},{"date":"2026-11-19","seconds":0},{"date":"2026-11-20","seconds":0},{"date":"2026-11-21","seconds":0},{"date":"2026-11-22","seconds":0},{"date":"2026-11-23","seconds":0},{"date":"2026-11-24","seconds":0},{"date":"2026-11-25","seconds":0},{"date":"2026-11-26","seconds":0},{"date":"2026-11-27","seconds":0},{"date":"2026-11-28","seconds":0},{"date":"2026-11-29","seconds":0},{"date":"2026-11-30","seconds":0}],"entries":[{"amountMinor":10000,"clamped":false,"currency":"PLN","date":"2026-11-10","end":"2026-11-10T09:30:00Z","id":"56cfe9d8-bdfa-4da3-8644-24c14350701c","isPatch":false,"originalSeconds":1800,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":1800,"start":"2026-11-10T09:00:00Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"amountMinor":20000,"clamped":false,"currency":"PLN","date":"2026-11-10","end":"2026-11-10T10:00:00Z","id":"c75d0397-c9ae-433e-b31d-660e2e0bd61e","isPatch":false,"originalSeconds":3600,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":3600,"start":"2026-11-10T09:00:00Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"amountMinor":22000,"clamped":false,"currency":"EUR","date":"2026-11-10","end":"2026-11-10T23:50:00Z","id":"1b77b2f3-91c7-4d7f-a93e-2ac288272309","isPatch":false,"note":"late night UTC","originalSeconds":6600,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rateMinor":12000,"rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":6600,"start":"2026-11-10T22:00:00Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":30000,"clamped":false,"currency":"PLN","date":"2026-11-13","end":"2026-11-13T10:30:00Z","id":"4bd41519-d71a-405f-82a7-0d0fd72a5b65","isPatch":false,"note":"retro session","originalSeconds":5400,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":5400,"start":"2026-11-13T09:00:00Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"amountMinor":18000,"clamped":false,"currency":"EUR","date":"2026-11-14","end":"2026-11-14T17:34:24Z","id":"f8487c4f-680c-47fc-9423-d0b824f7c472","isPatch":false,"originalSeconds":5400,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rateMinor":12000,"rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":5400,"start":"2026-11-14T16:04:24Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":22500,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:34:25Z","id":"5a2531ba-23d2-47a9-8789-5a9b55682ce6","isPatch":false,"originalSeconds":5400,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","seconds":5400,"start":"2026-11-14T16:04:25Z","taskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","taskName":"Write API tests (v2)"},{"amountMinor":11250,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:34:24Z","id":"bfba2ec3-ecaa-40b7-9a7a-364a08a63c54","isPatch":false,"note":"manual entry","originalSeconds":2700,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","seconds":2700,"start":"2026-11-14T16:49:24Z","taskId":"85aae435-769b-4c24-be77-4d2cd77bca7a","taskName":"Write API tests (v2)"},{"amountMinor":17,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:31Z","id":"log_1794677607857_0","isPatch":false,"originalSeconds":3,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":20000,"rootTaskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","seconds":3,"start":"2026-11-14T17:33:27Z","taskId":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","taskName":"Build landing page"},{"amountMinor":4,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:33Z","id":"log_1794677611754_0","isPatch":false,"originalSeconds":1,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"541d88e9-679f-4d40-91ca-de120db8972d","seconds":1,"start":"2026-11-14T17:33:31Z","taskId":"541d88e9-679f-4d40-91ca-de120db8972d","taskName":"Write API docs"},{"amountMinor":3,"clamped":false,"currency":"EUR","date":"2026-11-14","end":"2026-11-14T17:33:50Z","id":"log_1794677628942_0","isPatch":false,"originalSeconds":1,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rateMinor":12000,"rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":1,"start":"2026-11-14T17:33:48Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":0,"clamped":false,"currency":"PLN","date":"2026-11-14","end":"2026-11-14T17:33:55Z","id":"log_1794677634691_0","isPatch":false,"originalSeconds":0,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","projectName":"Acme Corp","rateMinor":15000,"rootTaskId":"541d88e9-679f-4d40-91ca-de120db8972d","seconds":0,"start":"2026-11-14T17:33:54Z","taskId":"541d88e9-679f-4d40-91ca-de120db8972d","taskName":"Write API docs"},{"amountMinor":0,"clamped":false,"currency":"EUR","date":"2026-11-14","end":"2026-11-14T17:33:56Z","id":"log_1794677636098_0","isPatch":false,"originalSeconds":0,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rateMinor":12000,"rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":0,"start":"2026-11-14T17:33:56Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":7,"clamped":false,"currency":"EUR","date":"2026-11-14","end":"2026-11-14T17:38:02Z","id":"log_1794677880618_0","isPatch":false,"originalSeconds":2,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rateMinor":12000,"rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":2,"start":"2026-11-14T17:38:00Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"},{"amountMinor":103,"clamped":false,"currency":"EUR","date":"2026-11-14","id":"log_1794677900541_0","isPatch":false,"originalSeconds":31,"projectId":"dfbc7198-c47c-4b94-80ef-8dd84c696734","projectName":"Personal Site","rateMinor":12000,"rootTaskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","seconds":31,"start":"2026-11-14T17:38:20Z","taskId":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","taskName":"Design logo"}],"filters":{"includePatches":true},"generatedAt":"2026-11-14T17:38:52Z","generator":{"name":"oxy","version":"1.14.5"},"projects":[{"billing":[{"amountMinor":93771,"billableSeconds":18904,"currency":"PLN","nonBillableSeconds":0,"unconfiguredSeconds":0}],"directSeconds":0,"id":"74adfd00-6e21-44c3-92f4-abed3e69a84b","name":"Acme Corp","seconds":18904,"shareBasisPoints":6110,"tasks":[{"amountMinor":60017,"currency":"PLN","directSeconds":10803,"id":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","name":"Build landing page","rateMinor":20000,"rateStatus":"custom","seconds":10803,"shareBasisPoints":3492,"subtasks":[]},{"amountMinor":33750,"currency":"PLN","directSeconds":8100,"id":"85aae435-769b-4c24-be77-4d2cd77bca7a","name":"Write API tests (v2)","rateMinor":15000,"rateStatus":"inherited","seconds":8100,"shareBasisPoints":2618,"subtasks":[]},{"amountMinor":4,"currency":"PLN","directSeconds":1,"id":"541d88e9-679f-4d40-91ca-de120db8972d","name":"Write API docs","rateMinor":15000,"rateStatus":"inherited","seconds":1,"shareBasisPoints":0,"subtasks":[]}]},{"billing":[{"amountMinor":40113,"billableSeconds":12034,"currency":"EUR","nonBillableSeconds":0,"unconfiguredSeconds":0}],"directSeconds":0,"id":"dfbc7198-c47c-4b94-80ef-8dd84c696734","name":"Personal Site","seconds":12034,"shareBasisPoints":3890,"tasks":[{"amountMinor":40113,"currency":"EUR","directSeconds":12034,"id":"fb2ce5f5-9e77-4526-b888-9b397205c6ee","name":"Design logo","rateMinor":12000,"rateStatus":"inherited","seconds":12034,"shareBasisPoints":3890,"subtasks":[]}]}],"range":{"from":"2026-10-31T23:00:00Z","preset":"month","timezone":"Europe/Warsaw","to":"2026-11-30T23:00:00Z"},"schema":"oxy.report","schemaVersion":2,"totals":{"billableSeconds":30938,"billing":[{"amountMinor":40113,"billableSeconds":12034,"currency":"EUR","nonBillableSeconds":0,"unconfiguredSeconds":0},{"amountMinor":93771,"billableSeconds":18904,"currency":"PLN","nonBillableSeconds":0,"unconfiguredSeconds":0}],"entryCount":14,"nonBillableSeconds":0,"seconds":30938,"unconfiguredSeconds":0},"variant":"full"},"meta":{"generatedAt":"2026-11-14T17:38:52Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db --json task ls`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.task.list","schemaVersion":1,"data":{"items":[{"archived":false,"billingCurrency":null,"billingRateCents":20000,"completed":false,"createdAt":"2026-11-14T17:33:18.219861600+00:00","currency":null,"editHistory":null,"hourlyRate":"200.00","id":"fe792a2c-68ab-43c1-95f8-4b37cd96fd56","name":"Build landing page","originalCompleted":false,"originalName":null,"parentTaskId":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","status":"Todo"},{"archived":false,"billingCurrency":null,"billingRateCents":null,"completed":false,"createdAt":"2026-11-14T17:33:18.983242400+00:00","currency":null,"editHistory":null,"hourlyRate":null,"id":"541d88e9-679f-4d40-91ca-de120db8972d","name":"Write API docs","originalCompleted":false,"originalName":null,"parentTaskId":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","status":"Todo"},{"archived":false,"billingCurrency":null,"billingRateCents":null,"completed":false,"createdAt":"2026-11-14T17:34:04.980755500+00:00","currency":null,"editHistory":null,"hourlyRate":null,"id":"85aae435-769b-4c24-be77-4d2cd77bca7a","name":"Write API tests (v2)","originalCompleted":false,"originalName":null,"parentTaskId":null,"projectId":"74adfd00-6e21-44c3-92f4-abed3e69a84b","status":"Todo"}]},"meta":{"generatedAt":"2026-11-14T17:38:53Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db --json project list`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.project.list","schemaVersion":1,"data":{"items":[{"allowConcurrency":false,"archived":false,"billingCurrency":"PLN","billingRateCents":15000,"color":"#FFFFFF","createdAt":"2026-11-14T17:33:15.311255100+00:00","currency":"PLN","description":null,"editHistory":null,"hourlyRate":"150.00","icon":null,"id":"74adfd00-6e21-44c3-92f4-abed3e69a84b","name":"Acme Corp","originalColor":null,"originalName":null,"tags":null}]},"meta":{"generatedAt":"2026-11-14T17:38:53Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db project list --json`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.project.list","schemaVersion":1,"data":{"items":[{"allowConcurrency":false,"archived":false,"billingCurrency":"PLN","billingRateCents":15000,"color":"#FFFFFF","createdAt":"2026-11-14T17:33:15.311255100+00:00","currency":"PLN","description":null,"editHistory":null,"hourlyRate":"150.00","icon":null,"id":"74adfd00-6e21-44c3-92f4-abed3e69a84b","name":"Acme Corp","originalColor":null,"originalName":null,"tags":null}]},"meta":{"generatedAt":"2026-11-14T17:38:54Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db start Design logo`
exit: 1
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_BUSINESS_VIOLATION]: Engine error: Cannot start timer on completed task 'fb2ce5f5-9e77-4526-b888-9b397205c6ee'
Remediation: Inspect active timers using 'oxy status' or stop them with 'oxy stop'.
```

### `oxy --db t.db switch Write API docs`
exit: 0
stdout (1 lines):
```
▶️ Started tracking task: 541d88e9-679f-4d40-91ca-de120db8972d
```
stderr (0 lines):
```
```

### `oxy --db t.db --json switch Write API docs`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.switch","schemaVersion":1,"data":{"action":"switched","taskId":"541d88e9-679f-4d40-91ca-de120db8972d","timeLogId":"log_1794677947378_0"},"meta":{"generatedAt":"2026-11-14T17:39:07Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db switch nonexistent task`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Task 'nonexistent task' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db --json switch nonexistent task`
exit: 4
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"DOM_ENTITY_NOT_FOUND","category":"entity","exit_code":4,"timestamp":"2026-11-14T17:39:08.905105600+00:00","technical":"Task 'nonexistent task' not found."}
```

### `oxy --db t.db start Fix login`
exit: 0
stdout (2 lines):
```
▶️ Started tracking task: 346f5c41-31da-4bf5-9aa6-802963419c52
Stopped: 'Write API docs' [541d88e9-679f-4d40-91ca-de120db8972d]
```
stderr (0 lines):
```
```

### `oxy --db t.db project add Acme Corp`
exit: 1
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_BUSINESS_VIOLATION]: Project with name "Acme Corp" already exists
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db task add Orphan task -p Nope Project`
exit: 4
stdout (0 lines):
```
```
stderr (2 lines):
```
Error [DOM_ENTITY_NOT_FOUND]: Project 'Nope Project' not found.
Remediation: Verify the target entity using 'oxy task ls' or 'oxy project ls'.
```

### `oxy --db t.db task add Orphan task -p Acme`
exit: 0
stdout (1 lines):
```
✅ Created task with ID: 8959ed93-490d-4ee5-97aa-ee526a67ecc9
```
stderr (0 lines):
```
```

### `oxy --db t.db stop --all`
exit: 0
stdout (1 lines):
```
⏹️ Stopped all active projects timer tracking threads.
```
stderr (0 lines):
```
```

### `oxy --db t.db --machine status`
exit: 0
stdout (1 lines):
```
{"schema":"oxy.status","schemaVersion":1,"data":{"active":[],"count":0,"running":false},"meta":{"generatedAt":"2026-11-14T17:39:13Z","generator":{"name":"oxy","version":"1.14.5"}}}
```
stderr (0 lines):
```
```

### `oxy --db t.db today --tz Europe/Warsaw`
exit: 0
stdout (18 lines):
```
✅ 📅 Work Summary for Today (2026-11-14)
──────────────────────────────────────────────────
 • [Personal Site] Design logo ➔ 90m 00s
 • [Acme Corp] Write API tests (v2) ➔ 90m 00s
 • [Acme Corp] Write API tests (v2) ➔ 45m 00s
 • [Acme Corp] Build landing page ➔ 00m 03s
 • [Acme Corp] Write API docs ➔ 00m 01s
 • [Personal Site] Design logo ➔ 00m 01s
 • [Acme Corp] Write API docs ➔ 00m 00s
 • [Personal Site] Design logo ➔ 00m 00s
 • [Personal Site] Design logo ➔ 00m 02s
 • [Personal Site] Design logo ➔ 00m 46s
 • [Acme Corp] Write API docs ➔ 00m 00s
 • [Acme Corp] Write API docs ➔ 00m 02s
 • [Acme Corp] Fix login bug ➔ 00m 02s
──────────────────────────────────────────────────
Total Time Today: 3h 45m (13 entries)

```
stderr (0 lines):
```
```

### `oxy --db t.db today --tz UTC`
exit: 0
stdout (18 lines):
```
✅ 📅 Work Summary for Today (2026-11-14)
──────────────────────────────────────────────────
 • [Personal Site] Design logo ➔ 90m 00s
 • [Acme Corp] Write API tests (v2) ➔ 90m 00s
 • [Acme Corp] Write API tests (v2) ➔ 45m 00s
 • [Acme Corp] Build landing page ➔ 00m 03s
 • [Acme Corp] Write API docs ➔ 00m 01s
 • [Personal Site] Design logo ➔ 00m 01s
 • [Acme Corp] Write API docs ➔ 00m 00s
 • [Personal Site] Design logo ➔ 00m 00s
 • [Personal Site] Design logo ➔ 00m 02s
 • [Personal Site] Design logo ➔ 00m 46s
 • [Acme Corp] Write API docs ➔ 00m 00s
 • [Acme Corp] Write API docs ➔ 00m 02s
 • [Acme Corp] Fix login bug ➔ 00m 02s
──────────────────────────────────────────────────
Total Time Today: 3h 45m (13 entries)

```
stderr (0 lines):
```
```

### `oxy --db t.db --json report -p Acme --month -f summary`
exit: 2
stdout (0 lines):
```
```
stderr (1 lines):
```
{"code":"CLI_SYNTAX_INVALID_ARGS","category":"syntax","exit_code":2,"timestamp":"2026-11-14T17:39:15.343540400+00:00","technical":"invalid value 'summary' for '--format <FORMAT>'","details":{"field":"--format","value":"summary"}}
```

### `oxy --db t.db report -p Acme --today --variant summary`
exit: 0
stdout (10 lines):
```
✅ 📊 Time Tracking Hierarchy Report (Today, Europe/Warsaw)
──────────────────────────────────────────────────
📦 "Acme Corp" [02h 15m] (100.0%) [██████████]
├── 📋 "Write API tests (v2)" [02h 15m] (99.9%) [██████████]
├── 📋 "Build landing page" [00m 05s] (0.1%) [░░░░░░░░░░]
│   └── ↳ "Fix login bug" [00m 02s] (0.0%) [░░░░░░░░░░]
└── 📋 "Write API docs" [00m 03s] (0.0%) [░░░░░░░░░░]
──────────────────────────────────────────────────
Total Time: 02h 15m (3 active tasks)

```
stderr (0 lines):
```
```

## Session notes (tester disclosures)

- Binary used: `%CARGO_TARGET_DIR%/debug/oxy.exe` (built 18:32 from main b35731eb, not rebuilt). Repo was on branch `docs/cli-review-2026-11`; no repo files were touched.
- Every session command was run with `--db <session>/t.db`, except the four mistakes below, which hit the default database because `--db` was omitted:
  - bare `oxy` (dashboard, twice, once with `--json`) : read-only, output reflected the default DB ("No time recorded today"),
  - `oxy log remove 1234` : read-only, "Time log '1234' not found" (nothing deleted),
  - `oxy project` : help text only, no DB access.
- Harness mistake: when selecting an entry to delete via `--json log list -l 1`, the first entry is the oldest-start one (list is sorted by start time), so two timer-generated logs were deleted by mistake (`log_1794677645776_0` "Fix login bug" 3s and `log_1794677637655_0` "Build landing page" 8s). This affects only the test DB.
- Git Bash rewrote the path `/nonexistent/dir/x.db` to `C:/Program Files/Git/nonexistent/dir/x.db` before oxy saw it; that is a shell artifact, not an oxy defect.
- The `--machine stop` and `status` outputs were captured with the wrapper; stdout/stderr are shown per command above.
