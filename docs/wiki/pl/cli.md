# Podstawowe CLI (oxy)

> Język / Language: [English](/en/cli.md) | **Polski** | [Deutsch](/de/cli.md) | [Español](/es/cli.md) | [Français](/fr/cli.md) | [Português](/pt-br/cli.md)

---

oXyFlow zawiera natywny program wiersza poleceń `oxy`, który komunikuje się bezpośrednio z lokalną bazą danych SQLite (`oxytime.db`). CLI działa niezależnie od interfejsu graficznego i może być uruchamiane w środowiskach bezgłowych, skryptach powłoki oraz potokach CI/CD.

---

## Flagi Globalne

Program `oxy` przyjmuje globalne flagi kontrolujące formatowanie i poziom szczegółowości komunikatów:

| Flaga | Skrót | Opis |
| :--- | :--- | :--- |
| `--json` | `-j` | Emituje sformatowany JSON na standardowe wyjście (`stdout`). |
| `--machine` | `-m` | Emituje jednoliniowy, zwięzły format JSON bez interaktywnych promptów. |
| `--quiet` | `-q` | Wycisza komunikaty informacyjne i nagłówki tabel. |

---

## Podstawowy Cykl Życia Stopera

```bash
# Wyświetl stan aktywnego stopera
oxy status

# Uruchom pomiar czasu na zadaniu (według ID, prefiksu lub nazwy)
oxy start "Implementacja API"

# Zatrzymaj aktywną sesję pomiaru
oxy stop

# Atomowo przełącz stoper na inne zadanie w pojedynczym kroku
oxy switch "Poprawka Frontendu"

# Wyświetl podsumowanie czasu zarejestrowanego dzisiaj
oxy today
```

---

## Zarządzanie Projektami i Zadaniami

CLI porządkuje pracę w hierarchiczną strukturę projektów i zadań:

```bash
# Wyświetl listę wszystkich aktywnych projektów
oxy project ls

# Utwórz nowy projekt z opcjonalnym kolorem etykiety
oxy project add "Portal Klienta" -c "#3b82f6"

# Wyświetl listę zadań we wszystkich projektach
oxy task ls

# Wyświetl listę zadań powiązanych z konkretnym projektem
oxy task ls -p "Portal Klienta"

# Dodaj nowe zadanie do projektu
oxy task add "Projektowanie przepływu OAuth" -p "Portal Klienta"

# Oznacz zadanie jako ukończone
oxy task done "Projektowanie przepływu OAuth"

# Zarchiwizuj zadanie
oxy task rm "Projektowanie przepływu OAuth"
```

---

## Generowanie Raportów i Eksport Danych

```bash
# Wyświetl hierarchiczne drzewo Unicode projektów i zadań z dzisiejszego dnia
oxy report --tree --today

# Wyświetl raport dla bieżącego tygodnia
oxy report --tree --week

# Wyeksportuj zarejestrowany czas do pliku HTML, CSV lub JSON
oxy report export -f html -o ./zestawienie.html
oxy report export -f csv -o ./zestawienie.csv
oxy report export -f json -o ./zestawienie.json
```

---

## Kody Wyjścia Procesu

Wszystkie polecenia CLI zwracają deterministyczne kody wyjścia zgodne ze standardem POSIX:

| Kod Wyjścia | Znaczenie | Opis |
| :--- | :--- | :--- |
| `0` | Sukces | Polecenie wykonane pomyślnie. |
| `1` | Błąd ogólny | Naruszenie reguły biznesowej lub błąd niezmiennika. |
| `2` | Błąd składni | Nieprawidłowe polecenie, brakujący argument lub nieobsługiwana flaga. |
| `3` | Błąd bazy danych | Błąd dostępu do pliku SQLite lub operacji I/O. |
| `4` | Błąd encji | Encja nie została odnaleziona lub zapytanie jest wieloznaczne. |
| `5` | Błąd silnika | Konflikt cyklu życia stopera (np. próba zatrzymania nieaktywnego licznika). |

---

## Koperta Błędów i Tryb Maszynowy

W przypadku niepowodzenia polecenia, `oxy` wypisuje ustrukturyzowane informacje techniczne na strumień `stderr`.

W potokach automatyzacji z flagą `--machine` (lub `--json`), interaktywne zapytania oraz sekcje podpowiedzi dla użytkownika są wyłączone. Błąd jest emitowany jako deterministyczna, jednolinijkowa koperta JSON:

```json
{"code":"DOM_ENTITY_NOT_FOUND","message":"Task '104' was not found","operation":"start","subsystem":"domain"}
```

W interaktywnym trybie terminala (TTY), koperta zawiera dodatkowy obiekt `user` z informacjami w wybranym języku, instrukcjami naprawczymi oraz sugestiami „Czy chodziło o...”:

```json
{
  "code": "DOM_ENTITY_NOT_FOUND",
  "message": "Task '104' was not found",
  "operation": "start",
  "subsystem": "domain",
  "user": {
    "locale": "pl",
    "message": "Zadanie o numerze '104' nie istnieje w aktywnym projekcie.",
    "suggestion": "Czy chodziło Ci o zadanie '105' (Implementacja OAuth)?",
    "remediation": "Użyj 'oxy task ls', aby wyświetlić dostępne zadania."
  }
}
```

### Semantyczne Kody Błędów

| Kod Błędu | Kod Wyjścia | Opis |
| :--- | :---: | :--- |
| `CLI_SYNTAX_UNKNOWN_COMMAND` | `2` | Nieznane lub niezaimplementowane polecenie lub podpolecenie. |
| `CLI_SYNTAX_INVALID_ARGS` | `2` | Brakujące lub niepoprawne argumenty (np. pusta ścieżka). |
| `DOM_ENTITY_NOT_FOUND` | `4` | Wskazany projekt, zadanie, wpis czasu lub alias nie istnieje. |
| `ENG_OPERATION_FAILED` | `1` | Naruszenie reguły biznesowej (np. pusta nazwa encji). |
| `ENG_TIMER_ACTIVE` | `5` | Próba uruchomienia stopera, gdy inny jest już aktywny bez flagi wymuszenia. |
| `ENG_TIMER_INACTIVE` | `5` | Próba zatrzymania stopera przy braku aktywnej sesji. |
| `SNK_EXTERNAL_IO` | `1` | Błąd zewnętrznego ujścia (niedostępna ścieżka lub niepomyślny test). |
| `STO_SQLITE_CONSTRAINT` | `3` | Naruszenie ograniczeń SQLite (unikalność lub klucz obcy). |
| `STO_STORAGE_ERROR` | `3` | Niskopoziomowy błąd dostępu do bazy danych lub operacji I/O. |

---

Szczegółowe instrukcje dotyczące automatyzacji w skryptach powłoki i potokach CI/CD znajdziesz w sekcji **[Zaawansowane CLI](advanced-cli.md)**.
