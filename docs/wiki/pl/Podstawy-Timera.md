# ⏱️ Podstawy Timera

> 🌐 **Język / Language**: [English](/en/timer.md) | **Polski** | [Deutsch](/de/Timer-Grundlagen.md) | [Español](/es/Uso-del-Temporizador.md) | [Français](/fr/Minuteur-de-Base.md) | [Português](/pt-br/Uso-do-Temporizador.md)

---

## Zasady Działania Stopera

- **Pojedynczy Aktywny Wpis**: W danym momencie rejestrowane może być tylko jedno zadanie. Rozpoczęcie nowego zadania uzupełnia pole `endTime` bieżącego wpisu i utrwala transakcję przed uruchomieniem kolejnego.
- **Precyzja Czasu**: Wszystkie znaczniki czasu są zapisywane w formacie ISO 8601 UTC z dokładnością do sekundy.
- **Rzeczywisty Upływ Czasu**: Wartości czasu w interfejsie są obliczane bezpośrednio w relacji do zegara systemowego (`useLiveTaskElapsed`), bez kumulowania błędów interwałów w JavaScript.

---

## Zarządzanie Wpisami i Walidacja

- **Przeglądanie Historii**: Tabela **Wpisy czasu** umożliwia filtrowanie po zakresie dat, projekcie oraz statusie.
- **Korekta Wpisów**: Edycja czasów rozpoczęcia i zakończenia podlega walidacji zapobiegającej nakładaniu się sesji w ramach projektu (`ERR_ENGINE_OVERLAP`).
- **Raporty i Eksport**: Moduł raportów agreguje czasy dzienne i tygodniowe oraz umożliwia bezpośredni eksport do plików HTML, CSV i JSON.
