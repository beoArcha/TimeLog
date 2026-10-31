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

W trybie przeglądarkowym (PWA) dane są zapisywane w pamięci `localStorage` przeglądarki zamiast fizycznego pliku SQLite (szczegóły w pytaniu 7).

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

- **Uniwersalna Kopia JSON**: W zakładce **Ustawienia → Kopia zapasowa** (karta **Baza danych i kopie zapasowe**):
  - **Eksport**: Kliknij **Eksportuj kopię JSON** (`data-testid="export-backup-btn"`), aby pobrać niezaszyfrowany, czytelny plik `.json` (`OxyFlow_Backup_YYYY-MM-DD.json`) zawierający wszystkie projekty, zadania, wpisy czasu i konfigurację.
  - **Import / Przywracanie**: Kliknij **Przywróć / Importuj kopię JSON** (`data-testid="import-backup-btn"`) i wskaż wcześniej wyeksportowany plik `.json`. Silnik weryfikuje strukturę danych (`validateBackupPayload`) przed przywróceniem stanu bazy.
  - **Przenośność Między Środowiskami**: Format JSON jest w pełni uniwersalny. Kopię wyeksportowaną z przeglądarki PWA można zaimportować do aplikacji desktopowej i odwrotnie.
- **Fizyczna Kopia SQLite (Tylko Desktop)**: W wersji desktopowej można skopiować plik `oxytime.db` bezpośrednio przy wyłączonej aplikacji lub użyć polecenia SQLite:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

W przeglądarce PWA brak bezpośredniego dostępu do systemu plików uniemożliwia eksport bazy `.sqlite` – format JSON stanowi uniwersalny standard kopii zapasowych.

---

## 6. W jaki sposób synchronizowany jest stan między oknem GUI a CLI (`oxy`)?

Plik wykonywalny CLI (`oxy`) odczytuje i modyfikuje dokładnie ten sam lokalny plik bazy danych (`oxytime.db`). Każda operacja z poziomu terminala jest widoczna w aplikacji okienkowej przy najbliższym takcie stopera lub przełączeniu okna.

---

## 7. Czym różni się zapis danych w wersji przeglądarkowej PWA od wersji desktopowej?

oXyFlow stosuje odrębne silniki zapisu dostosowane do środowiska uruchomieniowego:

- **Desktop (Tauri v2)**: Dane zapisywane są w pliku lokalnej bazy danych SQLite (`oxytime.db`) w systemie plików z pełną zgodnością ACID. Użytkownik ma bezpośredni dostęp do pliku bazy i synchronizacji z narzędziem CLI.
- **Przeglądarka (PWA)**: Dane przechowywane są w pamięci `localStorage` przeglądarki (`LocalStorage Engine`) odizolowanej dla danej domeny. Piaskownica przeglądarki uniemożliwia bezpośredni dostęp do dysku, dlatego w trybie web nie powstaje żaden fizyczny plik `.sqlite`.
- **Ostrzeżenie o Pamięci Przeglądarki**: Czyszczenie danych przeglądarki („Wyczyść dane przeglądania”, usuwanie ciasteczek i magazynu witryny) oraz korzystanie z trybu incognito powoduje trwałe usunięcie wpisów czasu.
- **Zalecana Praktyka**: Korzystając z oXyFlow w przeglądarce, wykonuj regularne kopie zapasowe JSON w menu **Ustawienia → Kopia zapasowa → Eksportuj kopię JSON**.

