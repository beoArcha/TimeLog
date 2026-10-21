# ⏱️ Dokumentacja Techniczna oXyFlow

> 🌐 **Język / Language**: [English](/en/README.md) | **Polski** | [Deutsch](/de/README.md) | [Español](/es/README.md) | [Français](/fr/README.md) | [Português (Brasil)](/pt-br/README.md)

---

**oXyFlow** to desktopowy licznik czasu pracy i zadań, zbudowany w oparciu o Tauri v2, silnik Rust oraz lokalną bazę danych SQLite. Zapewnia architekturę w 100% offline z natywnym plikiem wykonywalnym CLI (`oxy`) do automatyzacji terminalowej i integracji ze środowiskiem deweloperskim.

---

## 🏛️ Główne Założenia Architektury

```text
┌────────────────────────────────────────────────────────┐
│                   Interfejs React 19                   │
│        (Tailwind CSS, Base UI, Tokeny Semantyczne)     │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Komendy)
┌───────────────────────────▼────────────────────────────┐
│                    Natywny Silnik Rust                 │
│  - Cykl życia stopera i niezmienniki nakładania        │
│  - Warstwa trwałości SQLite (MicroORM)                 │
│  - Dyspozytor sinków (CSV, Webhooki HTTP)              │
└───────────────────────────┬────────────────────────────┘
                            │ Mostek CLI
┌───────────────────────────▼────────────────────────────┐
│               Plik Wykonywalny CLI (`oxy`)             │
└────────────────────────────────────────────────────────┘
```

- **Lokalna Baza Danych**: Wszystkie dane zapisywane są w lokalnym pliku SQLite (`timelog.db`). Brak telemetrii, analityki czy wymuszonego logowania do chmury.
- **Potrójne Odseparowanie (Triple Decoupling)**: Całkowita izolacja warstwy wizualnej od reguł biznesowych silnika i sterowników bazodanowych.
- **Wydajność**: Zużycie pamięci RAM poniżej 40 MB, natychmiastowe uruchamianie, zerowe obciążenie procesora w tle.
- **Podwójny Interfejs**: Aplikacja okienkowa z 3 gęstościami układu (Kompaktowy, Średni, Pełny) oraz zsynchronizowany terminal (`oxy`).

---

## 📚 Struktura Dokumentacji

### Podręcznik Użytkownika

- **[Pierwsze Kroki](pierwsze-kroki.md)**: Instalacja, konfiguracja początkowa oraz tworzenie pierwszego projektu i zadania.
- **[Podstawy Timera](podstawy-timera.md)**: Obsługa stopera, przełączanie zadań, edycja wpisów i podsumowania dnia.
- **[Podstawowe CLI (`oxy`)](podstawowe-cli.md)**: Składnia poleceń w PowerShellu i terminalu.
- **[Interfejs i Motywy](interfejs-i-motywy.md)**: Układy okna, 12 semantycznych motywów kolorystycznych i ułatwienia dostępu.
- **[Często Zadawane Pytania (FAQ)](faq.md)**: Ścieżki bazy danych, kopie zapasowe i bezpieczeństwo offline.

### Dokumentacja Techniczna & Deweloperska

- **[Zaawansowane CLI](zaawansowane-cli.md)**: Przetwarzanie potoków JSON i skrypty automatyzujące.
- **[Architektura Systemu](architektura.md)**: Cykl życia silnika w Rust, migracje SQLite i dyspozytory zdarzeń.
- **[Sinki i Automatyzacja](automatyzacja.md)**: Konfiguracja bieżącego zapisu CSV i webhooków HTTP.
- **[Budowanie ze Źródeł](kompilacja-ze-zrodel.md)**: Wymagania, konfiguracja Bun i kompilacja Cargo.

---

## 📥 Oficjalne Pakiety Instalacyjne

| System Operacyjny | Typ Paczki | Architektura |
| :--- | :--- | :--- |
| **Windows** | Instalator (`.exe`) | x86_64 |
| **Windows** | Wersja przenośna portable (`.exe`) | x86_64 |
| **macOS** | Obraz dysku Universal (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | Paczka DEB (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | Paczka RPM (`.rpm`) | x86_64 |

Pliki binarne oraz sumy kontrolne (`SHA256SUMS.txt`) są dostępne na [stronie wydań GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
