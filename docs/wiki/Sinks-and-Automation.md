# 🔌 Sinks & Event Automation Subsystem

> *Audience: Integrators, systems administrators, and power users creating automated data ingestion pipelines and third-party webhooks.*

The **Sinks Subsystem** in oXyFlow decouples event emission from core timer tracking. When timer sessions transition (start, stop, switch, complete), the engine dispatches normalized lifecycle events to configured event sinks without blocking the UI or delaying database writes.

---

## 1. Supported Sink Types

| Sink Type | Target | Description |
| :--- | :--- | :--- |
| **`csv`** | Local Directory | Appends standardized, audit-ready CSV records in real-time |
| **`webhook`** | HTTP/HTTPS Endpoint | Dispatches POST JSON payloads with exponential backoff and queue retry |

---

## 2. Real-Time CSV Sink

The CSV sink logs every lifecycle event to a local folder. Ideal for external reporting tools, continuous backup mirrors, or ingestion into Python/Pandas data pipelines.

### 2.1 Configuring via CLI

```bash
# Enable CSV sink targeting a specific directory
oxy sink set csv /home/user/timelogs/csv-stream

# View current sink status
oxy sink ls
```

### Generated CSV Schema

Each emitted row adheres to the RFC 4180 standard:

```csv
timestamp,event_type,project_id,project_name,task_id,task_name,duration_seconds,note
2026-10-21T08:00:00Z,timer_start,p1,Client Web,t1,Homepage,0,
2026-10-21T09:30:00Z,timer_stop,p1,Client Web,t1,Homepage,5400,"Completed mockup"
```

---

## 3. Webhook Event Sink

The Webhook sink transmits HTTP `POST` requests to an external URL whenever time is tracked.

### 3.1Configuring via CLI

```bash
# Register a custom webhook endpoint
oxy sink set webhook https://api.mycompany.com/v1/timelogs

# Test endpoint health
oxy sink test
```

### JSON Webhook Payload Format

```json
{
  "event": "time_log.created",
  "timestamp": "2026-10-21T09:30:00Z",
  "source": "oxy-flow.desktop",
  "version": "1.8.0",
  "payload": {
    "logId": "019460a8-b51c-7f52-823a-f111e3b62450",
    "projectId": "p1",
    "projectName": "Client Website",
    "taskId": "t1",
    "taskName": "Homepage Redesign",
    "startTime": "2026-10-21T08:00:00Z",
    "endTime": "2026-10-21T09:30:00Z",
    "durationSeconds": 5400,
    "note": "Completed mockup"
  }
}
```

### Reliability & Offline Queue

If the receiving HTTP server is temporarily unreachable (e.g. network disconnection, 5xx server errors), events are persisted in the local SQLite `webhook_queue` table and automatically retried when connectivity is restored.
