# Sinki i Automatyzacja

> Język / Language: [English](/en/automation.md) | **Polski** | [Deutsch](/de/automation.md) | [Español](/es/automation.md) | [Français](/fr/automation.md) | [Português](/pt-br/automation.md)

---

oXyFlow zawiera trwały podsystem **Sinków (Sinks Subsystem)**, rejestrujący i wysyłający zdarzenia pomiaru czasu w czasie rzeczywistym przy każdym zakończeniu sesji roboczej.

---

## Obsługiwane Typy Sinków

1. **Lokalny Audyt CSV**: Automatycznie dopisuje ustrukturyzowane wiersze sesji do plików CSV w wybranym katalogu.
2. **Wychodzący Webhook HTTP**: Wysyła ładunek JSON żądaniem `POST` z opcjonalną autoryzacją nagłówkiem Bearer do zewnętrznych systemów automatyzacji (np. n8n, Zapier, własne API REST).

---

## Konfiguracja z Poziomu CLI

Grupa poleceń `oxy sink` konfiguruje i weryfikuje cele bezpośrednio w lokalnej bazie SQLite:

```bash
# Wyświetl listę wszystkich skonfigurowanych sinków oraz ich status
oxy sink ls

# Skonfiguruj lokalny katalog dla audytu CSV
oxy sink set-csv --dir "$HOME/Dokumenty/timelogs"

# Skonfiguruj punkt końcowy webhooka HTTP/HTTPS z opcjonalnym tokenem autoryzacyjnym
oxy sink set-webhook --url "https://api.example.com/v1/timelogs" --token "tajny-token-xyz"

# Wyślij syntetyczny test łączności do wszystkich skonfigurowanych sinków
oxy sink test
```

---

## Wyjście Maszynowe dla Operacji na Sinkach

Dodanie flagi `--json` lub `--machine` zwraca ustrukturyzowane potwierdzenia JSON:

```bash
# Przetestuj sinki w trybie maszynowym
oxy sink test --json

# Wypisz listę sinków w formacie JSON
oxy sink ls --json
```

---

## Format Obiektu Webhooka

W momencie zakończenia lub testowania sesji stoper generuje następujący ładunek JSON:

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Portal Klienta",
    "task_title": "Optymalizacja bazy danych",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```

Jeśli zdalny serwer webhooka jest chwilowo niedostępny, niedostarczone zdarzenia są buforowane w wewnętrznej kolejce ponowień SQLite (`webhook_queue`) i wysyłane ponownie z wykładniczym czasem oczekiwania.
