# Automatización y Sinks

> Idioma / Language: [English](/en/automation.md) | [Polski](/pl/automation.md) | [Deutsch](/de/automation.md) | **Español** | [Français](/fr/automation.md) | [Português](/pt-br/automation.md)

---

oXyFlow incluye un subsistema persistente de **Sinks**, que registra y despacha eventos de tiempo en tiempo real cada vez que se finaliza una sesión de trabajo.

---

## Tipos de Sinks Compatibles

1. **Auditoría Local en CSV**: Agrega automáticamente registros estructurados en archivos CSV dentro del directorio configurado.
2. **Webhook HTTP Saliente**: Envía una petición `POST` con un objeto JSON y token de autorización Bearer opcional a plataformas de automatización (como n8n, Zapier o APIs REST propias).

---

## Configuración Mediante el CLI

El grupo de comandos `oxy sink` gestiona y comprueba los destinos directamente en la base SQLite:

```bash
# Listar todos los sinks configurados y su estado
oxy sink ls

# Configurar un directorio local para registros CSV
oxy sink set-csv --dir "$HOME/Documents/timelogs"

# Configurar un endpoint de webhook HTTP/HTTPS con token opcional
oxy sink set-webhook --url "https://api.example.com/v1/timelogs" --token "token-secreto-xyz"

# Enviar una prueba sintética de conectividad a todos los sinks activos
oxy sink test
```

---

## Salida en Modo Máquina para Operaciones de Sinks

Al añadir `--json` o `--machine`, se obtienen confirmaciones estructuradas en JSON:

```bash
# Probar sinks en modo máquina
oxy sink test --json

# Listar sinks en formato JSON
oxy sink ls --json
```

---

## Esquema del Objeto Webhook

Al concluir una sesión o realizar un test, el webhook envía la siguiente estructura JSON:

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Portal de Clientes",
    "task_title": "Optimización de base de datos",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```

Si el servidor de destino no responde de forma temporal, los envíos fallidos se almacenan en la cola interna de reintentos de SQLite (`webhook_queue`) y se reintentan con un retroceso exponencial.
