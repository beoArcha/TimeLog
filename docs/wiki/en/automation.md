# 🔌 Sinks & Automations

> 🌐 **Language / Język**: **English** | [Polski](/pl/automatyzacja.md)

---

oXyFlow includes a persistent **Sinks Subsystem** that dispatches events in real time whenever timer entries are created, updated, or finalized.

---

## 1. Supported Sink Destinations

- **CSV Sink**: Appends structured rows immediately to a specified file upon every session stop.
- **Webhook Sink**: Dispatches an HTTP `POST` JSON payload to an endpoint (e.g. n8n, Zapier, custom backend API) whenever an active timer stops.

---

## 2. Configuration via CLI

```bash
# Configure CSV sink target
oxy sink set csv --path "$HOME/Documents/timelogs.csv"

# Configure HTTP Webhook sink target
oxy sink set webhook --url "https://api.example.com/v1/timelogs"

# Dispatch test payload to verify sink connectivity
oxy sink test webhook
```

---

## 3. Webhook Payload Schema

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Client Redesign",
    "task_title": "Database Optimization",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```
