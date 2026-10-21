# 📟 Zaawansowane CLI

> 🌐 **Język / Language**: [English](/en/advanced-cli.md) | **Polski**

---

Natywny program terminalowy `oxy` umożliwia automatyzację procesów, generowanie maszynowych danych JSON oraz integrację z wierszem poleceń (PowerShell, Starship, Bash).

---

## 1. Wyjście Maszynowe (Format JSON)

Wszystkie polecenia prezentujące zestawienia wspierają parametr `--format json` do łączenia z narzędziem `jq`:

```bash
# Pobierz aktywny stan stopera w formacie JSON
oxy status --format json | jq '.active_task.title'

# Pobierz dzisiejsze wpisy czasu jako JSON
oxy today --format json | jq '.logs[] | {zadanie: .task_title, sekundy: .duration_seconds}'
```

---

## 2. Integracja z Promptem Terminala

Możesz wyświetlać aktywny stoper bezpośrednio w linii poleceń PowerShell lub Bash:

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
