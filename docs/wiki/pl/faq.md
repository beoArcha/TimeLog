# Często Zadawane Pytania (FAQ)

> Język / Language: [English](/en/faq.md) | **Polski** | [Deutsch](/de/faq.md) | [Español](/es/faq.md) | [Français](/fr/faq.md) | [Português](/pt-br/faq.md)

---

## 1. Gdzie zapisywane są moje dane i wpisy czasu?

Wszystkie wpisy czasu, projekty, zadania i konfiguracja zapisywane są w lokalnym pliku SQLite o nazwie `oxytime.db`.

| System Operacyjny | Ścieżka do Bazy Danych |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.oxytime.oxyflow\oxytime.db` |
| **Linux** | `~/.local/share/com.oxytime.oxyflow/oxytime.db` |
| **macOS** | `~/Library/Application Support/com.oxytime.oxyflow/oxytime.db` |

W trybie przeglądarkowym dane są zapisywane w pamięci `localStorage` przeglądarki pod dedykowanymi kluczami.

---

## 2. Czy oXyFlow wymaga połączenia z internetem?

**Nie.** oXyFlow działa w 100% lokalnie (offline-first). Brak zależności chmurowych, zewnętrznych systemów logowania czy telemetrii w tle. Obliczenia czasu, zapytania bazodanowe i generowanie raportów wykonuje wbudowany silnik Rust.

---

## 3. Dlaczego Windows SmartScreen wyświetla ostrzeżenie przy instalacji?

System Windows Defender SmartScreen wyświetla ostrzeżenie dla świeżo pobranych plików instalacyjnych, które nie posiadają drogiego komercyjnego certyfikatu korporacyjnego (EV). oXyFlow to darmowy projekt open-source na licencji Mozilla Public License 2.0 (MPL-2.0).

Aby uruchomić aplikację:

1. Kliknij **Więcej informacji** w oknie SmartScreen.
2. Kliknij przycisk **Uruchom mimo to**.
3. Autentyczność pliku możesz sprawdzić porównując sumę ze skrótem w pliku `SHA256SUMS.txt` publikowanym przy każdym wydaniu na GitHubie.

---

## 4. Co się stanie, jeśli zapomnę wyłączyć stoper po zakończeniu pracy?

Aktywny wpis czasu mierzy czas do momentu ręcznego zatrzymania, zapauzowania lub zmiany zadania:

- Możesz ręcznie skorygować czas rozpoczęcia lub zakończenia dowolnego wpisu w tabeli **Wpisy czasu** lub w widoku **Raporty**.
- Nakładające się wpisy czasu w obrębie jednego projektu są blokowane przez silnik walidacji (`TemporalOverlapDetected`) w celu zachowania spójności audytowej.
- Wpisy wybiegające w przyszłość można przesunąć wstecz, aby odzwierciedlały faktyczne godziny pracy.

---

## 5. Jak wykonać i przywrócić kopię zapasową bazy danych?

- **Automatyczne kopie**: oXyFlow oferuje mechanizm kopii zapasowych w zakładce **Ustawienia → Baza danych i kopie**.
- **Kopia ręczna**: Możesz skopiować plik `oxytime.db` z katalogu danych przy wyłączonej aplikacji lub użyć polecenia SQLite:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

---

## 6. W jaki sposób synchronizowany jest stan między oknem GUI a CLI (`oxy`)?

Plik wykonywalny CLI (`oxy`) odczytuje i modyfikuje dokładnie ten sam lokalny plik bazy danych (`oxytime.db`). Każda operacja z poziomu terminala jest widoczna w aplikacji okienkowej przy najbliższym takcie stopera lub przełączeniu okna.
