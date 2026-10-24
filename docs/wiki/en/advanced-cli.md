# Advanced CLI Scripting

> Language / Język: **English** | [Polski](/pl/advanced-cli.md) | [Deutsch](/de/advanced-cli.md) | [Español](/es/advanced-cli.md) | [Français](/fr/advanced-cli.md) | [Português](/pt-br/advanced-cli.md)

---

The native headless CLI executable (`oxy`) supports headless shell automation, machine-readable JSON pipelines, and integration with terminal prompts (PowerShell, Starship, Bash, Zsh).

---

## Machine-Readable JSON Pipelines

Passing the global `--json` (or `-j`) flag instructs `oxy` to suppress decorative ANSI formatting and emit structured JSON to `stdout`:

### Querying Active Timer Status

```bash
# Query status with unformatted JSON
oxy status --json

# Example response:
# {"active_tasks":["task-42"],"count":1,"running":true}

# Check if a timer is currently running using jq
oxy status --json | jq '.running'

# Extract the active task identifier
oxy status --json | jq -r '.active_tasks[0] // empty'
```

### Querying Daily Summary Logs

```bash
# Query today's logs as structured JSON
oxy today --json

# Example response:
# {
#   "date": "2026-10-21",
#   "total_seconds": 14400,
#   "entries": [
#     {
#       "id": "log-1",
#       "task_id": "task-42",
#       "start_time": "2026-10-21T09:00:00Z",
#       "end_time": "2026-10-21T13:00:00Z",
#       "duration_seconds": 14400
#     }
#   ]
# }

# Calculate total hours worked today
oxy today --json | jq '.total_seconds / 3600'
```

### Automated Error Handling

In automated scripts and CI/CD pipelines, use `--machine` to receive clean, single-line JSON errors on `stderr` and check deterministic POSIX exit codes:

```bash
# Capture machine-readable error output on stderr
if ! oxy start "Nonexistent Task" --machine 2> error.json; then
    exit_code=$?
    error_code=$(jq -r '.code // "UNKNOWN"' error.json)
    echo "Command failed (exit code $exit_code) with error: $error_code"
fi
```

---

## Terminal Prompt Integration

You can display the active timer status directly in your terminal prompt or prompt engine:

### PowerShell (`$PROFILE`)

```powershell
function Get-OxyStatusPrompt {
    try {
        $status = oxy status --json 2>$null | ConvertFrom-Json
        if ($status.running -and $status.count -gt 0) {
            return " [oxy: $($status.active_tasks[0])]"
        }
    } catch {
        # Suppress errors if oxy is not installed or the database is locked
    }
    return ""
}
```

### Bash / Zsh (`.bashrc` / `.zshrc`)

```bash
oxy_prompt() {
    local status
    status=$(oxy status --json 2>/dev/null)
    if [ $? -eq 0 ]; then
        local is_running
        is_running=$(echo "$status" | jq -r '.running // false')
        if [ "$is_running" = "true" ]; then
            local active_task
            active_task=$(echo "$status" | jq -r '.active_tasks[0]')
            echo " [oxy: ${active_task}]"
        fi
    fi
}
```

---

## Git Hook Automation

You can attach time tracking to local Git workflows using client-side hooks:

### Automatic Commits Tracking (`.git/hooks/pre-commit` and `post-commit`)

```bash
# .git/hooks/pre-commit
#!/usr/bin/env sh
oxy start "Git Commits" --quiet 2>/dev/null || true

# .git/hooks/post-commit
#!/usr/bin/env sh
oxy stop --quiet 2>/dev/null || true
```

---

## Automated Backups with Shell Schedulers

Because `oxy` operates directly on SQLite without requiring the UI window, you can schedule automated exports via `cron` or Windows Task Scheduler:

```bash
# Nightly CSV export at 23:59 via cron
59 23 * * * /usr/local/bin/oxy report export -f csv -o /backups/timesheet-$(date +\%Y\%m\%d).csv
```
