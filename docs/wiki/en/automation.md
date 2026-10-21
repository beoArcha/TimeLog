# Sinks and Automation

> Language / Język: **English** | [Polski](/pl/automation.md) | [Deutsch](/de/automation.md) | [Español](/es/automation.md) | [Français](/fr/automation.md) | [Português](/pt-br/automation.md)

---

oXyFlow includes a persistent **Sinks Subsystem** that records and dispatches time tracking events in real time whenever timer entries are recorded or stopped.

---

## Supported Sink Destinations

1. **Local CSV Audit Sink**: Automatically appends structured session entries to CSV files in a specified directory.
2. **Outbound Webhook Sink**: Dispatches an HTTP `POST` JSON payload with optional Bearer token authorization to external automation services (e.g. n8n, Zapier, custom REST APIs).

---

## Configuration via CLI

The `oxy sink` command group configures and verifies destinations directly in the local SQLite storage:

```bash
# List all configured sinks and their active status
oxy sink ls

# Configure a local directory for CSV audit trails
oxy sink set-csv --dir "$HOME/Documents/timelogs"

# Configure an HTTP/HTTPS webhook endpoint with an optional authorization token
oxy sink set-webhook --url "https://api.example.com/v1/timelogs" --token "secret-token-xyz"

# Dispatch a synthetic ping test to all configured sinks to verify connectivity
oxy sink test
```

---

## Machine Output for Sink Operations

Appending `--json` or `--machine` outputs structured JSON confirmations:

```bash
# Test sinks in machine mode
oxy sink test --json

# List sinks in JSON format
oxy sink ls --json
```

---

## Webhook Payload Schema

When a timer session is finalized or tested, the webhook sink transmits the following JSON payload structure:

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Client Portal",
    "task_title": "Database Optimization",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```

If the remote webhook endpoint is temporarily unreachable, failed deliveries are buffered in the internal SQLite retry queue (`webhook_queue`) and retried with exponential backoff.
