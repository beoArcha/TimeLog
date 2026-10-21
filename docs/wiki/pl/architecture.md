# Architektura Systemu i Inżynieria

> Język / Language: [English](/en/architecture.md) | **Polski** | [Deutsch](/de/architecture.md) | [Español](/es/architecture.md) | [Français](/fr/architecture.md) | [Português](/pt-br/architecture.md)

---

oXyFlow realizuje wzorzec Czystej Architektury (Clean Architecture) ze ścisłą izolacją warstw, weryfikowaną automatycznymi testami architektonicznymi skanującymi drzewa AST w TypeScript (`tests/architecture/`) oraz Rust (`src-tauri/tests/architecture/`).

---

## Topologia Architektury Wysokiego Poziomu

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Interfejs React 19                              │
│         (Tokeny Tailwind CSS, deklaratywne hooki orkiestrujące)        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌────────────────────┐
│     EngineRouter      │                           │ PersistenceRouter  │
│  (IRouter<IEngine>)   │                           │(IRouter<IPersist>) │
└──────────┬────────────┘                           └─────────┬──────────┘
           │                                                  │
           ├──────────────────────────────┬───────────────────┤
           ▼                              ▼                   ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────┐
│       Mostek Tauri IPC      │  │        Wtyczka Przeglądarkowa         │
│  (Mostek IPC do silnika)    │  │  (EnginePlugin + PersistencePlugin)   │
└──────────┬──────────────────┘  └───────────────────────────────────────┘
           ▼
┌─────────────────────────────┐
│    Referencyjny Silnik Rust │
│  - Cykl życia stopera       │
│  - Obliczenia metryk        │
│  - Niezmienniki temporalne  │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ Warstwa Trwałości SQLite    │
│  - Repozytoria Rusqlite     │
│  - Tryb WAL i transakcje    │
└─────────────────────────────┘
```

---

## Kluczowe Niezmienniki Architektoniczne

### 1. Reguła Potrójnego Odseparowania (Triple Decoupling)

1. **Odseparowanie od Lokalizacji**: Komponenty nigdy nie sprawdzają przetłumaczonych tekstów w logice ani testach. Weryfikacja UI opiera się na atrybutach `data-testid` oraz rolach dostępności ARIA.
2. **Odseparowanie od Motywu i CSS**: Stylowanie wykorzystuje semantyczne tokeny (`bg-card`, `text-foreground`). Komponenty nie mogą zawierać warunków typu `resolvedTheme === 'dark'` ani sztywnych kolorów HEX.
3. **Odseparowanie od Efektów Środowiskowych**: Komponenty Reacta nigdy nie sprawdzają bezpośrednio `window.__TAURI__` ani nie wywołują bezpośrednich poleceń IPC. Cała komunikacja odbywa się za pośrednictwem polimorficznych routerów (`EngineRouter`, `PersistenceRouter`).

### 2. Parytet Silników Między Środowiskami

Kluczowa logika biznesowa (przejścia stanów stopera, kalkulacja upływu czasu na granicach dat, reguły walidacji) istnieje w dwóch równorzędnych implementacjach:

- **Referencyjny Silnik w Rust** (`src-tauri/src/engine/`): Maksymalna wydajność w środowisku desktopowym.
- **Wtyczka Silnika w Przeglądarce** (`src/plugins/engine/`): Czysty TypeScript zapewniający 100% zgodności zachowań w trybie podglądu webowego.

Wspólny pakiet testów parytetu (`CrossRuntimeParity.test.ts`) wykonuje identyczne macierze testowe na obu implementacjach, eliminując dryf behawioralny.

### 3. Reguła Maksymalnie 2 Zagnieżdżonych Instrukcji If (Rule of 3 Ifs)

Zarówno w kodzie TypeScript, jak i w modułach Rust maksymalna dopuszczalna głębokość zagnieżdżenia instrukcji `if` wynosi 2. Trzy lub więcej zagnieżdżonych instrukcji warunkowych skutkuje automatycznym przerwaniem budowy przez testy architektoniczne (`max-nested-ifs.arch.test.ts` i `max_nested_ifs_test.rs`).

### 4. Izolacja Bezgłowego CLI

Natywny plik wykonywalny CLI (`src-tauri/src/cli/`) komunikuje się bezpośrednio z kontraktami `Engine` i `Persistence`. Obowiązuje go bezwzględny zakaz importowania jakichkolwiek typów okienkowych Tauri (`AppState`, `tauri::AppHandle`, kontrolerów okien czy komponentów zasobnika systemowego).
