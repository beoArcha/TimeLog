# Dokumentacja Techniczna oXyFlow

> Język / Language: [English](/en/README.md) | **Polski** | [Deutsch](/de/README.md) | [Español](/es/README.md) | [Français](/fr/README.md) | [Português](/pt-br/README.md)

---

oXyFlow to desktopowy licznik czasu pracy i zadań, zbudowany w oparciu o Tauri v2, silnik Rust oraz lokalną bazę danych SQLite. Zapewnia architekturę w 100% offline z natywnym plikiem wykonywalnym CLI (`oxy`) do automatyzacji terminalowej i integracji ze środowiskiem powłoki.

---

## Główne Założenia Architektury

```text
┌────────────────────────────────────────────────────────┐
│                   Interfejs React 19                   │
│        (Tailwind CSS, Base UI, Tokeny Semantyczne)     │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Komendy)
┌───────────────────────────▼────────────────────────────┐
│                    Natywny Silnik Rust                 │
│  - Cykl życia stopera i niezmienniki nakładania        │
│  - Warstwa trwałości SQLite (repozytoria)              │
│  - Dyspozytor sinków (CSV, Webhooki HTTP)              │
└───────────────────────────┬────────────────────────────┘
                            │ Mostek CLI
┌───────────────────────────▼────────────────────────────┐
│               Plik Wykonywalny CLI (`oxy`)             │
└────────────────────────────────────────────────────────┘
```

- **Lokalna Baza Danych**: Wszystkie dane zapisywane są w lokalnym pliku SQLite (`oxytime.db`). Brak telemetrii, analityki czy wymuszonego logowania do chmury.
- **Potrójne Odseparowanie (Triple Decoupling)**: Całkowita izolacja warstwy wizualnej od reguł biznesowych silnika i sterowników bazodanowych.
- **Podwójny Interfejs**: Aplikacja okienkowa z trzema gęstościami układu (Kompaktowy, Średni, Pełny) oraz zsynchronizowany terminal (`oxy`).

---

## Struktura Dokumentacji

### Podręcznik Użytkownika

- **[Pierwsze Kroki](getting-started.md)**: Instalacja, konfiguracja początkowa oraz tworzenie pierwszego projektu i zadania.
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

## Oficjalne Pakiety Instalacyjne

| System Operacyjny | Typ Paczki | Architektura |
| :--- | :--- | :--- |
| **Windows** | Instalator (`.exe`) | x86_64 |
| **Windows** | Wersja przenośna portable (`.exe`) | x86_64 |
| **macOS** | Obraz dysku Universal (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | Paczka DEB (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | Paczka RPM (`.rpm`) | x86_64 |

Pliki binarne oraz sumy kontrolne (`SHA256SUMS.txt`) są dostępne na [stronie wydań GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
