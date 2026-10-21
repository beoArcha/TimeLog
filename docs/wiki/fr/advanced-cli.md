# Scripts CLI Avancés

> Langue / Language: [English](/en/advanced-cli.md) | [Polski](/pl/advanced-cli.md) | [Deutsch](/de/advanced-cli.md) | [Español](/es/advanced-cli.md) | **Français** | [Português](/pt-br/advanced-cli.md)

---

L'exécutable de terminal `oxy` prend en charge l'automatisation sans interface graphique, la génération de flux JSON exploitables par des outils tiers et l'intégration aux invites de commande (PowerShell, Starship, Bash, Zsh).

---

## Flux JSON pour l'Automatisation

Grâce au drapeau global `--json` (ou `-j`), `oxy` supprime les couleurs ANSI et délivre des structures JSON sur `stdout` :

### Interroger le Minuteur Actif

```bash
# Vérifier l'état du minuteur au format JSON
oxy status --json

# Exemple de réponse :
# {"active_tasks":["task-42"],"count":1,"running":true}

# Vérifier si un minuteur est en cours avec jq
oxy status --json | jq '.running'

# Extraire l'identifiant de la tâche active
oxy status --json | jq -r '.active_tasks[0] // empty'
```

### Consulter les Entrées du Jour

```bash
# Récupérer les enregistrements du jour en JSON
oxy today --json

# Exemple de réponse :
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

# Calculer le nombre total d'heures travaillées aujourd'hui
oxy today --json | jq '.total_seconds / 3600'
```

---

## Intégration à l'Invite du Terminal

Affichez l'état du minuteur en direct dans votre invite de commande :

### PowerShell (`$PROFILE`)

```powershell
function Get-OxyStatusPrompt {
    try {
        $status = oxy status --json 2>$null | ConvertFrom-Json
        if ($status.running -and $status.count -gt 0) {
            return " [oxy: $($status.active_tasks[0])]"
        }
    } catch {
        # Ignorer les erreurs si oxy n'est pas installé ou si la base est occupée
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

## Automatisation avec les Hooks Git

Synchronisez le minuteur avec vos commits locaux :

```bash
# .git/hooks/pre-commit
#!/usr/bin/env sh
oxy start "Git Commits" --quiet 2>/dev/null || true

# .git/hooks/post-commit
#!/usr/bin/env sh
oxy stop --quiet 2>/dev/null || true
```

---

## Sauvegardes Automatisées

`oxy` communiquant directement avec SQLite sans ouvrir de fenêtre, vous pouvez planifier des sauvegardes via `cron` ou le planificateur de tâches Windows :

```bash
# Export CSV automatique chaque soir à 23h59 via cron
59 23 * * * /usr/local/bin/oxy report export -f csv -o /backups/timesheet-$(date +\%Y\%m\%d).csv
```
