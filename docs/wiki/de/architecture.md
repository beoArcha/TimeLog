# Systemarchitektur und Engineering

> Sprache / Language: [English](/en/architecture.md) | [Polski](/pl/architecture.md) | **Deutsch** | [Español](/es/architecture.md) | [Français](/fr/architecture.md) | [Português](/pt-br/architecture.md)

---

oXyFlow implementiert eine Clean Architecture mit strikter Schichtentrennung, die durch automatisierte AST-Architekturtests im TypeScript-Frontend (`tests/architecture/`) und im Rust-Backend (`src-tauri/tests/architecture/`) erzwungen wird.

---

## Architektur-Topologie

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Presentation UI                        │
│         (Tailwind-CSS-Tokens, deklarative Orchestrator-Hooks)          │
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
│     Tauri Desktop IPC       │  │        Browser-Plugin-Laufzeit        │
│  (IPC-Brücke zur Rust-Engine)│  │  (EnginePlugin + PersistencePlugin)   │
└──────────┬──────────────────┘  └───────────────────────────────────────┘
           ▼
┌─────────────────────────────┐
│    Rust Referenz-Engine     │
│  - Timer-Lebenszyklus       │
│  - Metriken & Dauerberechnung│
│  - Temporale Invarianten    │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ SQLite Persistenz-Schicht   │
│  - Rusqlite Repositories    │
│  - WAL-Modus & Transaktionen│
└─────────────────────────────┘
```

---

## Architektonische Invarianten

### 1. Die Dreifache Entkopplung (Triple Decoupling)

1. **Entkopplung von der Lokalisierung**: UI-Komponenten prüfen niemals übersetzte Texte. Tests und Selektoren basieren ausschließlich auf `data-testid` oder semantischen ARIA-Rollen.
2. **Entkopplung von Theme und CSS**: Das Styling verwendet semantische Tokens (`bg-card`, `text-foreground`). Komponenten dürfen keine Bedingungen wie `resolvedTheme === 'dark'` oder feste Hex-Farben enthalten.
3. **Entkopplung von Laufzeit-Nebeneffekten**: Geteilte React-Komponenten prüfen niemals `window.__TAURI__` direkt. Sämtliche Befehle laufen über polymorphe Router (`EngineRouter`, `PersistenceRouter`).

### 2. Laufzeit-Parität der Engine

Die zentrale Geschäftslogik existiert in zwei synchronen Implementierungen:

- **Rust Referenz-Engine** (`src-tauri/src/engine/`): Maximale Performance für Desktop-Systeme.
- **Browser Engine-Plugin** (`src/plugins/engine/`): Reines TypeScript zur Sicherstellung identischen Verhaltens in Web-Vorschau und Tests.

Eine gemeinsame Paritäts-Testsuite (`CrossRuntimeParity.test.ts`) führt identische Testmatrizen gegen beide Engines aus.

### 3. Regel der maximal 2 verschachtelten Ifs (Rule of 3 Ifs)

Im gesamten Quellcode (TypeScript und Rust) beträgt die maximal erlaubte Schachtelungstiefe von `if`-Anweisungen 2. Drei oder mehr geschachtelte `if`-Blöcke führen zum automatischen Fehlschlagen der Architekturtests (`max-nested-ifs.arch.test.ts` und `max_nested_ifs_test.rs`).

### 4. Headless-CLI-Isolation

Das native CLI-Binary (`src-tauri/src/cli/`) kommuniziert ausschließlich direkt mit den Schnittstellen `Engine` und `Persistence`. Es darf unter keinen Umständen Tauri-GUI-Typen (`AppState`, `tauri::AppHandle`, Fenster- oder Tray-Controller) importieren.
