# Pierwsze Kroki

> Język / Language: [English](/en/getting-started.md) | **Polski** | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

Ten poradnik przeprowadzi Cię przez instalację oXyFlow, konfigurację środowiska i rejestrację pierwszego wpisu czasu pracy.

---

## Instalacja

Pobierz odpowiednią paczkę instalacyjną ze [strony wydań GitHub](https://github.com/beoArcha/TimeLog/releases/latest):

- **Windows**: Uruchom instalator `OxyFlow-Setup-x64.exe` lub pobierz wersję bezinstalacyjną `OxyFlow-Standalone-x64.exe`.
- **macOS**: Otwórz obraz dysku `OxyFlow-Universal.dmg` i przeciągnij `OxyFlow.app` do katalogu `/Applications`.
- **Linux**: Nadaj uprawnienia wykonywania dla pliku `OxyFlow-x86_64.AppImage` (`chmod +x OxyFlow-x86_64.AppImage`) lub zainstaluj paczkę `.deb` / `.rpm`:

  ```bash
  sudo dpkg -i oxyflow_amd64.deb
  # lub na dystrybucjach Fedora/RHEL:
  sudo rpm -i oxyflow.x86_64.rpm
  ```

---

## Konfiguracja CLI (Opcjonalnie)

Instalatory desktopowe instalują również plik wykonywalny CLI o nazwie `oxy`. Aby korzystać z `oxy` bezpośrednio w terminalu (PowerShell, Bash, Zsh), upewnij się, że katalog instalacyjny znajduje się w Twojej zmiennej środowiskowej `PATH`:

- **Windows**: `%LOCALAPPDATA%\Programs\oXyFlow\`
- **Linux / macOS**: `/usr/local/bin/` lub `~/.local/bin/`

Zweryfikuj dostępność w terminalu:

```bash
oxy --version
```

---

## Tworzenie Projektu i Zadania

1. Uruchom aplikację **oXyFlow**.
2. Kliknij przycisk **"+ Nowy Projekt"** na pasku bocznym.
3. Wprowadź nazwę projektu (np. `Projekt Klienta A`) i wybierz kolor etykiety. Kliknij **Zapisz**.
4. W sekcji nowo utworzonego projektu kliknij **"+ Dodaj zadanie"**. Wpisz tytuł (np. `Implementacja API`) i naciśnij **Enter**.

---

## Pomiar Czasu

- Kliknij przycisk **Start (▶)** obok zadania, aby natychmiast rozpocząć pomiar czasu.
- Górny pasek statusu podświetla aktywne zadanie i prezentuje upływający czas na żywo.
- Kliknij **Stop (■)**, aby zakończyć bieżącą sesję pomiaru.
- Kliknięcie przycisku Start przy innym zadaniu natychmiast zatrzymuje bieżące i uruchamia nowe w pojedynczej transakcji atomowej (mechanizm `switch`).

---

## Dalsze Kroki

- **[Podstawy Timera](timer.md)**: Zasady edycji wpisów, reguły nakładania i rozliczanie dnia.
- **[Podstawowe CLI (`oxy`)](cli.md)**: Obsługa z wiersza poleceń terminala.
- **[Interfejs i Motywy](interface.md)**: Personalizacja wariantów układu okna i motywów.
