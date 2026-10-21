# 💻 CLI Companion (`oxy`)

> 🌐 **Language / Język**: **English** | [Polski](/pl/podstawowe-cli.md) | [Deutsch](/de/Basis-CLI.md) | [Español](/es/CLI-Basico.md) | [Français](/fr/CLI-de-Base.md) | [Português](/pt-br/CLI-Basico.md)

---

oXyFlow includes a native terminal executable named `oxy` that interfaces directly with the local SQLite database.

---

## Core Command Syntax

```bash
# Check running timer status
oxy status

# Start a timer on a task (resolves by name or ID)
oxy start "API Implementation"

# Stop or pause the active timer
oxy stop

# List recent projects and tasks
oxy list
oxy list --tasks

# Generate a daily summary
oxy today
```

---

## Exit Codes

The CLI strictly respects domain exit codes:

| Exit Code | Meaning |
| :--- | :--- |
| `0` | Success |
| `1` | Generic failure / Business rule violation |
| `2` | Invalid CLI syntax or arguments |
| `3` | Storage / SQLite database error |
| `4` | Entity not found / Ambiguous match |
| `5` | Engine / Timer lifecycle conflict |

For advanced shell scripting and JSON pipelines, see **[Advanced CLI Scripting](advanced-cli.md)**.
