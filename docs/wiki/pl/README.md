# Dokumentacja Techniczna oXyFlow

> Język / Language: [English](/en/README.md) | **Polski** | [Deutsch](/de/README.md) | [Español](/es/README.md) | [Français](/fr/README.md) | [Português](/pt-br/README.md)

---

oXyFlow to lokalny stoper i rejestrator zadań, dostępny jako natywna aplikacja desktopowa (Tauri v2, silnik Rust, lokalna baza SQLite) wraz z narzędziem CLI (`oxy`), a także jako **aplikacja webowa i Progressive Web App (PWA)** uruchamiana bezpośrednio z GitHub Pages.

> 🚀 **Wersja Web / PWA**: Uruchom oXyFlow bezpośrednio w przeglądarce lub zainstaluj na urządzeniu pod adresem **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)**.

---

## Główne Założenia Architektury

```text
┌────────────────────────────────────────────────────────┐
│                   Interfejs React 19                   │
│        (Tailwind CSS, Base UI, Tokeny Semantyczne)     │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼ (Środowisko Desktop)              ▼ (Środowisko Web / PWA)
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Tauri IPC (Komendy)      │     │    Persystencja Browser     │
│  - Natywny silnik Rust      │     │  - Plugin localStorage     │
│  - Baza danych SQLite       │     │  - Service Worker PWA       │
│  - Sinki czasu rzeczywistego│     │  - Działanie 100% offline   │
└──────────────┬──────────────┘     └─────────────────────────────┘
               │ Mostek CLI
┌──────────────▼──────────────┐
│  Plik Wykonywalny CLI (`oxy`)│
└─────────────────────────────┘
```

- **Lokalna Baza Danych**: Na desktopie dane zapisywane są w SQLite (`oxytime.db`), a w przeglądarce w odizolowanym magazynie `localStorage`. Brak telemetrii, analityki czy wymuszonego logowania do chmury.
- **Potrójne Odseparowanie (Triple Decoupling)**: Całkowita izolacja warstwy wizualnej od reguł biznesowych silnika i sterowników bazodanowych.
- **Wieloplatformowość**: Aplikacja okienkowa (Kompaktowy, Średni, Pełny), terminal (`oxy`) oraz instalowalna PWA dostępna w sieci.

---

## Struktura Dokumentacji

### Podręcznik Użytkownika

- **[Pierwsze Kroki](getting-started.md)**: Dostęp przez przeglądarkę, instalacja desktopowa, konfiguracja i pierwsze zadanie.
- **[Podstawy Timera](timer.md)**: Obsługa stopera, przełączanie zadań, edycja wpisów i podsumowania dnia.
- **[Podstawowe CLI (`oxy`)](cli.md)**: Składnia poleceń w PowerShellu i terminalu do sterowania stoperem i zarządzania encjami.
- **[Interfejs i Motywy](interface.md)**: Warianty układu okna, wbudowane motywy semantyczne oraz skalowanie interfejsu.
- **[Często Zadawane Pytania (FAQ)](faq.md)**: Ścieżki bazy danych, kopie zapasowe i bezpieczeństwo offline.

### Dokumentacja Techniczna & Deweloperska

- **[Zaawansowane CLI](advanced-cli.md)**: Przetwarzanie potoków JSON i skrypty automatyzujące.
- **[Architektura Systemu](architecture.md)**: Cykl życia silnika w Rust, migracje SQLite i dyspozytory zdarzeń.
- **[Sinki i Automatyzacja](automation.md)**: Konfiguracja bieżącego zapisu CSV i webhooków HTTP.
- **[Budowanie ze Źródeł](developer-build.md)**: Wymagania, konfiguracja Bun i kompilacja Cargo.

---

## Pakiety i Środowiska Uruchomieniowe

| Platforma | Typ Dystrybucji | Architektura | Odnośnik |
| :--- | :--- | :--- | :--- |
| **Web & PWA** | Aplikacja przeglądarkowa (bez instalacji) | Nowoczesne przeglądarki | [Otwórz oXyFlow Web](https://beoarcha.github.io/TimeLog/app/) |
| **Windows** | Instalator (`.exe`) | x86_64 | [Wydania GitHub](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Windows** | Wersja przenośna portable (`.exe`) | x86_64 | [Wydania GitHub](https://github.com/beoArcha/TimeLog/releases/latest) |
| **macOS** | Obraz dysku Universal (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel) | [Wydania GitHub](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux** | AppImage (`.AppImage`) | x86_64 | [Wydania GitHub](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (Debian / Ubuntu)** | Paczka DEB (`.deb`) | amd64 | [Wydania GitHub](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (RHEL / Fedora)** | Paczka RPM (`.rpm`) | x86_64 | [Wydania GitHub](https://github.com/beoArcha/TimeLog/releases/latest) |

Pliki binarne oraz sumy kontrolne (`SHA256SUMS.txt`) są dostępne na [stronie wydań GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
