# 📟 Advanced CLI Scripting

> 🌐 **Language / Język**: **English** | [Polski](/pl/zaawansowane-cli.md)

---

The native headless CLI executable (`oxy`) supports automation workflows, machine-readable JSON pipelines, and integration with terminal prompts (Starship, Oh My Zsh, PowerShell).

---

## 1. Machine-Readable Outputs

All commands that display summaries or tables support an `--export` or `--format` flag to emit raw JSON payloads for piping into `jq` or external tools:

```bash
# Query active timer status as JSON
oxy status --format json | jq '.active_task.title'

# Dump today's logs as structured JSON
oxy today --format json | jq '.logs[] | {task: .task_title, duration: .duration_seconds}'
```

---

## 2. Shell Prompt Integration

You can display the active timer and elapsed duration directly in your terminal prompt:

### PowerShell ($PROFILE)

```powershell
function Get-OxyStatus {
    $status = oxy status --format json 2>$null | ConvertFrom-Json
    if ($status.is_running) {
        return " [$($status.task_title): $($status.elapsed_formatted)]"
    }
    return ""
}
```

### Bash / Zsh

```bash
oxy_prompt() {
    local status
    status=$(oxy status --format json 2>/dev/null)
    if [ $? -eq 0 ] && [ "$(echo "$status" | jq -r .is_running)" = "true" ]; then
        echo " ⏱️ $(echo "$status" | jq -r .task_title)"
    fi
}
```

---

## 3. Automation Scripts

Starting or stopping a task based on git hooks or terminal triggers:

```bash
# Automatically track git commit duration
git_hook_pre_commit() {
    oxy start "Git Commits"
}

git_hook_post_commit() {
    oxy stop
}
```
