# CLI Companion (oxy)

> Language / Język: **English** | [Polski](/pl/cli.md) | [Deutsch](/de/cli.md) | [Español](/es/cli.md) | [Français](/fr/cli.md) | [Português](/pt-br/cli.md)

---

oXyFlow includes a native terminal executable named `oxy` that interfaces directly with the local SQLite database (`oxytime.db`). The CLI operates independently of the graphical window and can run in headless terminal environments, automated build pipelines, or CI/CD runners.

---

## Global Flags

The `oxy` binary accepts global flags that control output formatting and verbosity:

| Flag | Short | Description |
| :--- | :--- | :--- |
| `--json` | `-j` | Emits unformatted, machine-parseable JSON to `stdout`. |
| `--machine` | `-m` | Emits deterministic single-line JSON, suppressing interactive prompts. |
| `--quiet` | `-q` | Suppresses non-essential notices and table headers. |

---

## Core Timer Lifecycle

```bash
# Display the active timer status
oxy status

# Start tracking time on a task (resolved by exact ID, prefix, or name)
oxy start "API Implementation"

# Stop the active timer session
oxy stop

# Atomically switch the active timer to another task in a single step
oxy switch "Frontend Bugfix"

# Display a summary of time recorded today
oxy today
```

---

## Managing Projects and Tasks

The CLI organizes work into hierarchical projects and tasks:

```bash
# List all active projects
oxy project ls

# Create a new project with an optional color code
oxy project add "Client Portal" -c "#3b82f6"

# List tasks across all projects
oxy task ls

# List tasks filtered by project name or ID
oxy task ls -p "Client Portal"

# Create a new task under a project
oxy task add "Design OAuth Flow" -p "Client Portal"

# Mark a task as completed
oxy task done "Design OAuth Flow"

# Archive a task
oxy task rm "Design OAuth Flow"
```

---

## Generating Reports and Exporting Data

```bash
# Render a hierarchical Unicode tree of projects and tasks for today
oxy report --tree --today

# Render a report for the current week
oxy report --tree --week

# Export tracked time data to HTML, CSV, or JSON
oxy report export -f html -o ./timesheet.html
oxy report export -f csv -o ./timesheet.csv
oxy report export -f json -o ./timesheet.json
```

---

## Exit Codes

All CLI commands return deterministic POSIX exit codes:

| Exit Code | Meaning | Description |
| :--- | :--- | :--- |
| `0` | Success | Command executed successfully. |
| `1` | Generic failure | Business rule violation or invariant failure. |
| `2` | Syntax error | Invalid command, missing argument, or unsupported flag. |
| `3` | Storage error | SQLite database access failure or disk I/O error. |
| `4` | Entity error | Entity not found, ambiguous match, or unresolved ID. |
| `5` | Engine error | Timer lifecycle conflict (e.g. stopping an inactive timer). |

For advanced shell automation, CI/CD scripting, and JSON data pipelines, see **[Advanced CLI Scripting](advanced-cli.md)**.
