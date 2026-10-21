# Sinks und Automatisierung

> Sprache / Language: [English](/en/automation.md) | [Polski](/pl/automation.md) | **Deutsch** | [Español](/es/automation.md) | [Français](/fr/automation.md) | [Português](/pt-br/automation.md)

---

oXyFlow enthält ein persistentes **Sinks-Subsystem**, das Zeiterfassungsereignisse beim Beenden einer Sitzung in Echtzeit erfasst und weiterleitet.

---

## Unterstützte Sink-Ziele

1. **Lokaler CSV-Audit-Trail**: Schreibt strukturierte Zeileneinträge automatisch in CSV-Dateien in einem definierten Verzeichnis.
2. **Ausgehender Webhook**: Sendet bei Sitzungsende einen HTTP-`POST`-Request mit JSON-Nutzlast und optionalem Bearer-Token an Automatisierungsdienste (z. B. n8n, Zapier, eigene REST-APIs).

---

## Konfiguration über das CLI

Die Befehlsgruppe `oxy sink` verwaltet und testet Ziele direkt in der SQLite-Datenbank:

```bash
# Alle konfigurierten Sinks und deren Status auflisten
oxy sink ls

# Lokales Verzeichnis für CSV-Audit-Dateien konfigurieren
oxy sink set-csv --dir "$HOME/Documents/timelogs"

# HTTP/HTTPS-Webhook-Endpunkt mit optionalem Autorisierungstoken konfigurieren
oxy sink set-webhook --url "https://api.example.com/v1/timelogs" --token "geheim-token-xyz"

# Synthetischen Verbindungstest an alle konfigurierten Sinks senden
oxy sink test
```

---

## Maschinenausgabe für Sink-Operationen

Das Hinzufügen von `--json` oder `--machine` liefert strukturierte Bestätigungen:

```bash
# Sinks im Maschinenmodus testen
oxy sink test --json

# Sinks als JSON auflisten
oxy sink ls --json
```

---

## Webhook-Payload-Schema

Bei Abschluss einer Sitzung oder beim Testen überträgt der Webhook folgende JSON-Struktur:

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Kunden-Portal",
    "task_title": "Datenbankoptimierung",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```

Ist der Webhook-Endpunkt vorübergehend nicht erreichbar, werden fehlgeschlagene Übertragungen in der SQLite-Warteschlange (`webhook_queue`) zwischengespeichert und mit exponentiellem Backoff wiederholt.
