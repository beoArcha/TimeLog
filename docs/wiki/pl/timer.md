# Podstawy Timera i Pomiar Czasu

> Język / Language: [English](/en/timer.md) | **Polski** | [Deutsch](/de/timer.md) | [Español](/es/timer.md) | [Français](/fr/timer.md) | [Português](/pt-br/timer.md)

---

oXyFlow zarządza sesjami pomiaru czasu przy użyciu natywnego silnika napisanego w Rust, który gwarantuje integralność danych temporalnych i eliminuje dryfowanie zegara.

---

## Zasady Działania Stopera

- **Pojedynczy Aktywny Wpis**: W danym momencie rejestrowane może być tylko jedno zadanie. Rozpoczęcie nowego zadania uzupełnia pole `endTime` bieżącego wpisu i utrwala transakcję w bazie danych przed otwarciem kolejnego wpisu.
- **Atomowe Przełączanie (`switch`)**: Zmiana aktywnego zadania z poziomu interfejsu lub polecenia `oxy switch <id>` zatrzymuje dotychczasowy pomiar i natychmiast uruchamia nowy w pojedynczej transakcji SQLite.
- **Precyzja Znaczników Czasu**: Wszystkie punkty początkowe i końcowe są zapisywane w formacie ISO 8601 UTC. Czas trwania jest obliczany deterministycznie z różnicy między znacznikami czasu.
- **Odporność na Dryf Interwałów**: Widżety interfejsu użytkownika obliczają upływający czas na żywo na podstawie zegara systemowego (`useLiveTaskElapsed`), a nie liczników typu `setInterval`, co eliminuje dryfowanie czasu po uśpieniu systemu operacyjnego.

---

## Modyfikacja i Korekta Wpisów Czasu

Możesz weryfikować i poprawiać zarejestrowane sesje z poziomu widoku **Wpisy czasu** lub panelu **Raporty**:

1. Kliknij na dowolny zarejestrowany wpis czasu, aby otworzyć edytor sesji.
2. Zaktualizuj znacznik czasu rozpoczęcia lub zakończenia.
3. Kliknij **Zapisz**. Silnik automatycznie przeliczy czas trwania sesji i zaktualizuje podsumowania projektów.

---

## Walidacja Nakładania się Wpisów

Aby zachować pełną zgodność audytową, silnik oXyFlow wymusza zakaz nakładania się wpisów czasu (`TemporalOverlapDetected`):

- Żadne dwa wpisy czasu w obrębie tego samego projektu nie mogą mieć pokrywających się zakresów czasowych.
- W przypadku próby zapisania wpisu kolidującego z istniejącą sesją, edytor zgłosi błąd walidacji i poprosi o skorygowanie przedziału czasowego.

---

## Raporty i Eksport Danych

Moduł raportów agreguje dane dzienne, tygodniowe oraz miesięczne:

- **Agregacja Projektowa**: Podsumowania czasu pracy z podziałem na projekty i zadania.
- **Formaty Eksportu**: Możliwość eksportu zestawień do formatów **HTML** (gotowy arkusz do druku), **CSV** (do programów Excel/LibreOffice) oraz **JSON** (do dalszego przetwarzania w skryptach).
