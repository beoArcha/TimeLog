# Scripting CLI Avanzado

> Idioma / Language: [English](/en/advanced-cli.md) | [Polski](/pl/advanced-cli.md) | [Deutsch](/de/advanced-cli.md) | **Español** | [Français](/fr/advanced-cli.md) | [Português](/pt-br/advanced-cli.md)

---

El ejecutable nativo de terminal `oxy` permite la automatización sin entorno gráfico, la generación de flujos de datos JSON legibles por máquina y la integración con prompts de terminal (PowerShell, Starship, Bash, Zsh).

---

## Flujos de Datos JSON para Automatización

Al pasar la flag global `--json` (o `-j`), `oxy` suprime el formato ANSI y emite JSON estructurado directamente a `stdout`:

### Consultar el Estado del Temporizador Activo

```bash
# Consultar estado en formato JSON
oxy status --json

# Respuesta de ejemplo:
# {"active_tasks":["task-42"],"count":1,"running":true}

# Comprobar si el temporizador está corriendo usando jq
oxy status --json | jq '.running'

# Extraer el identificador de la tarea activa
oxy status --json | jq -r '.active_tasks[0] // empty'
```

### Consultar el Resumen Diario de Registros

```bash
# Consultar los registros de hoy como JSON
oxy today --json

# Respuesta de ejemplo:
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

# Calcular el total de horas trabajadas hoy
oxy today --json | jq '.total_seconds / 3600'
```

### Manejo Automatizado de Errores

En scripts automatizados y canalizaciones CI/CD, use `--machine` para recibir errores JSON limpios de una sola línea en `stderr` y verificar códigos de salida POSIX deterministas:

```bash
# Capturar error legible por máquina en stderr
if ! oxy start "Tarea Inexistente" --machine 2> error.json; then
    exit_code=$?
    error_code=$(jq -r '.code // "UNKNOWN"' error.json)
    echo "El comando falló (código $exit_code) con error: $error_code"
fi
```

---

## Integración con el Prompt del Terminal

Puede mostrar el estado del temporizador activo directamente en su prompt:

### PowerShell (`$PROFILE`)

```powershell
function Get-OxyStatusPrompt {
    try {
        $status = oxy status --json 2>$null | ConvertFrom-Json
        if ($status.running -and $status.count -gt 0) {
            return " [oxy: $($status.active_tasks[0])]"
        }
    } catch {
        # Suprimir errores si oxy no está instalado o la base está bloqueada
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

## Automatización con Hooks de Git

Puede sincronizar el registro de tiempo con sus operaciones locales de git:

```bash
# .git/hooks/pre-commit
#!/usr/bin/env sh
oxy start "Git Commits" --quiet 2>/dev/null || true

# .git/hooks/post-commit
#!/usr/bin/env sh
oxy stop --quiet 2>/dev/null || true
```

---

## Copias de Seguridad Automatizadas con Planificadores

Dado que `oxy` opera directamente sobre la base SQLite sin abrir la GUI, puede programar copias de seguridad continuas de la base de datos y exportaciones periódicas mediante `cron` o el Programador de Tareas de Windows:

```bash
# Copia de seguridad en línea de la base de datos SQLite a las 02:00 vía cron
0 2 * * * /usr/local/bin/oxy db backup /backups/oxytime-$(date +\%Y\%m\%d).db

# Exportación nocturna CSV a las 23:59 vía cron
59 23 * * * /usr/local/bin/oxy report export -f csv -o /backups/timesheet-$(date +\%Y\%m\%d).csv
```

---

## Pruebas de Estado del Sistema en Flujos de CI/CD

En entornos de integración continua o secuencias de comandos de verificación previa al despliegue, `oxy doctor --json` evalúa el estado del sistema y la integridad del esquema:

```bash
# Verificar la integridad de SQLite y la disponibilidad de tablas en un flujo de CI
if ! oxy doctor --json | jq -e '.overall_status == "ok"' > /dev/null; then
    echo "Fallo en la comprobación de la base de datos de oXyFlow" >&2
    exit 1
fi
```

---

## Enrutamiento de Base de Datos en Automatización

Las suites de pruebas automatizadas o flujos de trabajo de agentes pueden redirigir `oxy` a bases de datos dedicadas sin modificar los datos del usuario:

```bash
# Usando la bandera global de línea de comandos
oxy --db ./test-fixtures/isolated.db status --json

# Usando variable de entorno
export OXY_DB_PATH="/tmp/ci-run/oxytime.db"
oxy project ls --json
```
