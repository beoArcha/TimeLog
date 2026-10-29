# Pierwsze Kroki

> Język / Language: [English](/en/getting-started.md) | **Polski** | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

Ten poradnik przeprowadzi Cię przez uruchomienie oXyFlow w przeglądarce (Web/PWA) lub instalację aplikacji desktopowej, konfigurację środowiska i rejestrację pierwszego wpisu czasu pracy.

---

## Aplikacja Webowa i PWA (Bez Instalacji)

Możesz korzystać z oXyFlow od razu, bez konieczności pobierania plików instalacyjnych:

1. Wejdź na stronę **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)** w dowolnej nowoczesnej przeglądarce (Chrome, Edge, Firefox, Safari).
2. Cały stoper, projekty i zadania działają i zapisują się w 100% lokalnie w magazynie Twojej przeglądarki.
3. **Instalacja PWA**: W przeglądarkach obsługujących PWA kliknij przycisk **Zainstaluj aplikację** na pasku adresu lub w menu przeglądarki, aby zainstalować oXyFlow jako samodzielną aplikację działającą również w trybie offline na pulpicie lub ekranie głównym telefonu.

---

## Instalacja Desktopowa

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

1. Uruchom aplikację **oXyFlow** (wersję desktopową lub webową).
2. Kliknij przycisk **"+ Nowy Projekt"** na pasku bocznym.
3. Wprowadź nazwę projektu (np. `Projekt Klienta A`) i wybierz kolor etykiety. Kliknij **Zapisz**.
4. W sekcji nowo utworzonego projektu kliknij **"+ Dodaj zadanie"**. Wpisz tytuł (np. `Implementacja API`) i naciśnij **Enter**.

---

## Rejestracja Czasu

- Kliknij przycisk **Start (▶)** przy zadaniu, aby rozpocząć odliczanie.
- Pasek statusu podświetli aktywne zadanie wraz z bieżącym czasem trwania.
- Kliknij **Pauza (⏸)** lub **Stop (■)**, aby zakończyć sesję.
- Rozpoczęcie innego zadania automatycznie zatrzymuje poprzednie w jednej atomowej transakcji.

---

## Dalsze Kroki

- **[Podstawy Timera](timer.md)**: Ręczna korekta wpisów, reguły nakładania i historia.
- **[CLI Companion (`oxy`)](cli.md)**: Sterowanie stoperem z poziomu powłoki PowerShell / Bash.
- **[Interfejs i Motywy](interface.md)**: Dostosowanie gęstości układu oraz motywów kolorystycznych.
