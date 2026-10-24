# Scripting CLI Avançado

> Idioma / Language: [English](/en/advanced-cli.md) | [Polski](/pl/advanced-cli.md) | [Deutsch](/de/advanced-cli.md) | [Español](/es/advanced-cli.md) | [Français](/fr/advanced-cli.md) | **Português (BR)**

---

O utilitário de terminal nativo `oxy` viabiliza fluxos de automação sem interface visual, geração de pipelines de dados em JSON estruturado e integração com prompts de terminal (PowerShell, Starship, Bash, Zsh).

---

## Pipelines de Dados JSON

Com a flag global `--json` (ou `-j`), o `oxy` desativa formatações visuais ANSI e gera JSON legível por máquina na saída padrão:

### Consultar o Estado do Temporizador Ativo

```bash
# Consultar o status em formato JSON
oxy status --json

# Exemplo de resposta:
# {"active_tasks":["task-42"],"count":1,"running":true}

# Verificar se o timer está em execução com o jq
oxy status --json | jq '.running'

# Extrair o identificador da tarefa ativa
oxy status --json | jq -r '.active_tasks[0] // empty'
```

### Consultar Registros de Hoje

```bash
# Obter os lançamentos de hoje em JSON
oxy today --json

# Exemplo de resposta:
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

# Calcular o total de horas trabalhadas hoje
oxy today --json | jq '.total_seconds / 3600'
```

### Tratamento Automatizado de Erros

Em scripts automatizados e pipelines de CI/CD, use `--machine` para receber erros em formato JSON limpo e em linha única na saída `stderr` e verificar códigos de saída POSIX determinísticos:

```bash
# Capturar erro estruturado na saída stderr
if ! oxy start "Tarefa Inexistente" --machine 2> error.json; then
    exit_code=$?
    error_code=$(jq -r '.code // "UNKNOWN"' error.json)
    echo "Comando falhou (código $exit_code) com o erro: $error_code"
fi
```

---

## Integração com o Prompt do Terminal

Você pode exibir o status do timer diretamente no seu prompt de comando:

### PowerShell (`$PROFILE`)

```powershell
function Get-OxyStatusPrompt {
    try {
        $status = oxy status --json 2>$null | ConvertFrom-Json
        if ($status.running -and $status.count -gt 0) {
            return " [oxy: $($status.active_tasks[0])]"
        }
    } catch {
        # Oculta erros caso o oxy não esteja no PATH ou a base esteja bloqueada
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

## Automação com Git Hooks

Vincule o controle de tempo aos seus commits locais:

```bash
# .git/hooks/pre-commit
#!/usr/bin/env sh
oxy start "Git Commits" --quiet 2>/dev/null || true

# .git/hooks/post-commit
#!/usr/bin/env sh
oxy stop --quiet 2>/dev/null || true
```

---

## Backups Agendados via Terminal

Como o `oxy` opera diretamente no arquivo SQLite sem precisar abrir janelas, é possível agendar exportações pelo `cron` ou pelo Agendador de Tarefas do Windows:

```bash
# Exportação CSV noturna às 23:59 via cron
59 23 * * * /usr/local/bin/oxy report export -f csv -o /backups/timesheet-$(date +\%Y\%m\%d).csv
```
