# 🔌 Sinki i Automatyzacja

> 🌐 **Język / Language**: [English](/en/automation.md) | **Polski**

---

oXyFlow posiada podsystem **Sinków (Sinks Subsystem)**, wysyłający zdarzenia w czasie rzeczywistym przy każdym zatrzymaniu wpisu czasu.

---

## 1. Obsługiwane Typy Sinków

- **Sink CSV**: Dopisuje wiersz ze szczegółami sesji do wskazanego pliku CSV po zatrzymaniu stopera.
- **Sink Webhook**: Wysyła żądanie HTTP `POST` z obiektem JSON pod wskazany URL (np. n8n, Zapier, własny serwer API).

---

## 2. Konfiguracja z Poziomu CLI

```bash
# Ustawienie ścieżki pliku dla sinka CSV
oxy sink set csv --path "$HOME/Dokumenty/timelogs.csv"

# Konfiguracja adresu docelowego webhooka
oxy sink set webhook --url "https://api.example.com/v1/timelogs"

# Wysłanie testowego pakietu weryfikacyjnego
oxy sink test webhook
```

---

## 3. Format Obiektu Webhooka

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Projekt Klienta",
    "task_title": "Optymalizacja bazy danych",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```
