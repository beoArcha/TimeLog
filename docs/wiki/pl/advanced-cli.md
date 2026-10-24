# Zaawansowane CLI i Skrypty

> Język / Language: [English](/en/advanced-cli.md) | **Polski** | [Deutsch](/de/advanced-cli.md) | [Español](/es/advanced-cli.md) | [Français](/fr/advanced-cli.md) | [Português](/pt-br/advanced-cli.md)

---

Natywny program terminalowy `oxy` umożliwia bezgłową automatyzację procesów, generowanie maszynowych danych JSON oraz bezpośrednią integrację z promptem powłoki (PowerShell, Starship, Bash, Zsh).

---

## Maszynowe Potoki Danych JSON

Przekazanie globalnej flagi `--json` (lub `-j`) instruuje program `oxy`, aby wyłączył kolorowanie ANSI i zwrócił surowy JSON na standardowe wyjście:

### Odpytywanie o Stan Aktywnego Stopera

```bash
# Pobierz aktywny stan stopera w formacie JSON
oxy status --json

# Przykładowa odpowiedź:
# {"active_tasks":["task-42"],"count":1,"running":true}

# Sprawdź, czy stoper działa przy użyciu jq
oxy status --json | jq '.running'

# Pobierz identyfikator aktywnego zadania
oxy status --json | jq -r '.active_tasks[0] // empty'
```

### Pobieranie Podsumowania Dzisiejszych Wpisów

```bash
# Pobierz dzisiejsze wpisy czasu jako JSON
oxy today --json

# Przykładowa odpowiedź:
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

# Oblicz łączną liczbę przepracowanych godzin dzisiaj
oxy today --json | jq '.total_seconds / 3600'
```

### Automatyczna Obsługa Błędów

W skryptach automatyzacji i potokach CI/CD flaga `--machine` pozwala odbierać czyste, jednolinijkowe błędy JSON na strumieniu `stderr` oraz weryfikować deterministyczne kody wyjścia:

```bash
# Przechwyć maszynowy błąd na stderr
if ! oxy start "Nieistniejące Zadanie" --machine 2> error.json; then
    exit_code=$?
    error_code=$(jq -r '.code // "UNKNOWN"' error.json)
    echo "Polecenie nie powiodło się (kod $exit_code) z błędem: $error_code"
fi
```

---

## Integracja z Promptem Terminala

Możesz wyświetlać stan aktywnego stopera bezpośrednio w wierszu poleceń PowerShell lub Bash:

### PowerShell (`$PROFILE`)

```powershell
function Get-OxyStatusPrompt {
    try {
        $status = oxy status --json 2>$null | ConvertFrom-Json
        if ($status.running -and $status.count -gt 0) {
            return " [oxy: $($status.active_tasks[0])]"
        }
    } catch {
        # Wycisz błędy, jeśli oxy nie jest zainstalowane lub baza jest zablokowana
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

## Automatyzacja z Git Hooks

Możesz powiązać pomiar czasu z lokalnymi operacjami gita w skryptach pre-commit i post-commit:

```bash
# .git/hooks/pre-commit
#!/usr/bin/env sh
oxy start "Git Commits" --quiet 2>/dev/null || true

# .git/hooks/post-commit
#!/usr/bin/env sh
oxy stop --quiet 2>/dev/null || true
```

---

## Zautomatyzowane Kopie z Harmonogramem Zadań

Ponieważ `oxy` operuje bezpośrednio na bazie SQLite bez potrzeby uruchamiania okna aplikacji, możesz zaplanować automatyczne kopie bazy danych oraz cykliczny eksport raportów przez `cron` lub Harmonogram zadań Windows:

```bash
# Nocna kopia zapasowa bazy danych SQLite o 02:00 w cronie
0 2 * * * /usr/local/bin/oxy db backup /backups/oxytime-$(date +\%Y\%m\%d).db

# Nocny eksport CSV o 23:59 w cronie
59 23 * * * /usr/local/bin/oxy report export -f csv -o /backups/timesheet-$(date +\%Y\%m\%d).csv
```

---

## Testy Stanu Systemu w Potokach CI/CD

W środowiskach ciągłej integracji lub skryptach weryfikacji przedwdrożeniowej, `oxy doctor --json` pozwala zbadać integralność bazy i konfigurację odbiorników:

```bash
# Weryfikacja integralności SQLite i dostępności tabel w potoku CI
if ! oxy doctor --json | jq -e '.overall_status == "ok"' > /dev/null; then
    echo "Błąd integralności bazy danych lub odbiornika w oXyFlow" >&2
    exit 1
fi
```

---

## Przekierowanie Bazy Danych w Automatyzacji

Zautomatyzowane zestawy testów lub procesy agentowe mogą bezpiecznie kierować `oxy` do dedykowanych baz danych bez modyfikowania danych użytkownika:

```bash
# Jawna flaga globalna wiersza poleceń
oxy --db ./test-fixtures/isolated.db status --json

# Zmienna środowiskowa
export OXY_DB_PATH="/tmp/ci-run/oxytime.db"
oxy project ls --json
```
