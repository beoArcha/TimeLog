# 🏛️ Architektura Systemu

> 🌐 **Język / Language**: [English](/en/architecture.md) | **Polski**

---

oXyFlow realizuje wzorzec **Czystej Architektury (Clean Architecture)** z rygorystyczną izolacją warstw weryfikowaną automatycznymi testami architektonicznymi w TypeScript (`tests/architecture/`) oraz Rust (`src-tauri/tests/architecture/`).

---

## 1. Diagram Architektury

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
│  - Walidacja i niezmienniki │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ Warstwa Trwałości SQLite    │
│  - Rusqlite MicroORM        │
│  - Pamięć podręczna         │
└─────────────────────────────┘
```

---

## 2. Kluczowe Zasady Projektowe

### 2.1 Reguła Potrójnego Odseparowania (Triple Decoupling)

1. **Odseparowanie od Lokalizacji**: Komponenty nigdy nie sprawdzają przetłumaczonych tekstów. Testy i zapytania bazują na `data-testid` i rolach ARIA.
2. **Odseparowanie od Motywu i CSS**: Kolory są definiowane za pomocą semantycznych tokenów (`bg-card`, `text-foreground`). Brak warunków logicznych typu `theme === 'dark'`.
3. **Odseparowanie od Efektów Środowiskowych**: Komponenty nie sprawdzają bezpośrednio flagi `window.__TAURI__`. Cała komunikacja przechodzi przez polimorficzne routery (`EngineRouter`, `PersistenceRouter`).

### 2.2 Parytet Silników

Logika biznesowa istnieje w dwóch bliźniaczych implementacjach:
- **Silnik w Rust** (`src-tauri/src/engine/`): Maksymalna wydajność w aplikacji desktopowej.
- **Wtyczka w TypeScript** (`src/plugins/engine/`): Identyczne zachowanie w przeglądarce i testach.
Parytet ten jest stale kontrolowany wspólnym zestawem testów (`CrossRuntimeParity.test.ts`).
