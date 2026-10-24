# Erweiterte CLI-Skripte

> Sprache / Language: [English](/en/advanced-cli.md) | [Polski](/pl/advanced-cli.md) | **Deutsch** | [Español](/es/advanced-cli.md) | [Français](/fr/advanced-cli.md) | [Português](/pt-br/advanced-cli.md)

---

Das native Terminal-Tool `oxy` unterstützt die Headless-Automatisierung, maschinenlesbare JSON-Datenströme und die direkte Integration in Shell-Prompts (PowerShell, Starship, Bash, Zsh).

---

## Maschinenlesbare JSON-Pipelines

Über das globale Flag `--json` (oder `-j`) schaltet `oxy` ANSI-Formatierungen ab und gibt strukturiertes JSON auf `stdout` aus:

### Timer-Status abfragen

```bash
# Aktuellen Status als JSON abfragen
oxy status --json

# Beispiel-Antwort:
# {"active_tasks":["task-42"],"count":1,"running":true}

# Prüfen, ob ein Timer aktiv ist mit jq
oxy status --json | jq '.running'

# Task-ID des aktiven Tasks extrahieren
oxy status --json | jq -r '.active_tasks[0] // empty'
```

### Heutige Einträge abfragen

```bash
# Heutige Zeiteinträge als JSON abfragen
oxy today --json

# Beispiel-Antwort:
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

# Gesamte Arbeitsstunden für heute berechnen
oxy today --json | jq '.total_seconds / 3600'
```

### Automatische Fehlerbehandlung

In Automatisierungsskripten und CI/CD-Pipelines ermöglicht `--machine` den Empfang sauberer, einzeiliger JSON-Fehler auf `stderr` und die Überprüfung deterministischer POSIX-Exit-Codes:

```bash
# Maschinenlesbaren Fehler auf stderr erfassen
if ! oxy start "Nicht Vorhandene Aufgabe" --machine 2> error.json; then
    exit_code=$?
    error_code=$(jq -r '.code // "UNKNOWN"' error.json)
    echo "Befehl fehlgeschlagen (Exit-Code $exit_code) mit Fehler: $error_code"
fi
```

---

## Terminal-Prompt-Integration

Sie können den Status des aktiven Timers direkt in Ihrer Eingabeaufforderung anzeigen:

### PowerShell (`$PROFILE`)

```powershell
function Get-OxyStatusPrompt {
    try {
        $status = oxy status --json 2>$null | ConvertFrom-Json
        if ($status.running -and $status.count -gt 0) {
            return " [oxy: $($status.active_tasks[0])]"
        }
    } catch {
        # Fehler unterdrücken, falls oxy nicht installiert oder Datenbank gesperrt ist
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

## Git-Hook-Automatisierung

Sie können die Zeiterfassung an Git-Operationen koppeln:

```bash
# .git/hooks/pre-commit
#!/usr/bin/env sh
oxy start "Git Commits" --quiet 2>/dev/null || true

# .git/hooks/post-commit
#!/usr/bin/env sh
oxy stop --quiet 2>/dev/null || true
```

---

## Automatisierte Backups mit Schedulern

Da `oxy` ohne GUI direkt auf SQLite operiert, können automatisierte Datenbanksicherungen sowie zyklische Exporte über `cron` oder die Windows-Aufgabenplanung eingerichtet werden:

```bash
# Tägliches Online-Backup der SQLite-Datenbank um 02:00 Uhr via cron
0 2 * * * /usr/local/bin/oxy db backup /backups/oxytime-$(date +\%Y\%m\%d).db

# Täglicher CSV-Export um 23:59 Uhr via cron
59 23 * * * /usr/local/bin/oxy report export -f csv -o /backups/timesheet-$(date +\%Y\%m\%d).csv
```

---

## Integritätsprüfungen in CI-Pipelines

In Continuous-Integration-Pipelines oder vor automatisierten Deployments prüft `oxy doctor --json` die System- und Schemaintegrität:

```bash
# SQLite-Integrität und Tabellenverfügbarkeit in Pipelines verifizieren
if ! oxy doctor --json | jq -e '.overall_status == "ok"' > /dev/null; then
    echo "Fehler bei der Überprüfung der oXyFlow-Datenbank" >&2
    exit 1
fi
```

---

## Datenbankumleitung in Automatisierungen

Automatisierte Testsuiten oder Agent-Workflows können `oxy` gezielt auf dedizierte Testdatenbanken umleiten, ohne Benutzerdaten zu berühren:

```bash
# Über die globale Befehlszeilenflagge
oxy --db ./test-fixtures/isolated.db status --json

# Über die Umgebungsvariable
export OXY_DB_PATH="/tmp/ci-run/oxytime.db"
oxy project ls --json
```
