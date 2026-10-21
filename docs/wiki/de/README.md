# Technische Dokumentation oXyFlow

> Sprache / Language: [English](/en/README.md) | [Polski](/pl/README.md) | **Deutsch** | [Español](/es/README.md) | [Français](/fr/README.md) | [Português](/pt-br/README.md)

---

oXyFlow ist eine Desktop-Anwendung zur Arbeitszeiterfassung und Aufgabenverwaltung, entwickelt mit Tauri v2, Rust und einer lokalen SQLite-Datenbank. Die Anwendung arbeitet vollständig offline und bietet ein synchronisiertes Terminal-CLI (`oxy`) für die Shell-Automatisierung.

---

## Architektur-Übersicht

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│        (Tailwind CSS, Base UI, Semantische Token)      │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Befehle)
┌───────────────────────────▼────────────────────────────┐
│                    Rust Referenz-Engine                │
│  - Timer-Lebenszyklus & Überlappungsinvarianten        │
│  - SQLite-Repositories & Migrationen                   │
│  - Echtzeit-Sinks (CSV, HTTP-Webhooks)                 │
└───────────────────────────┬────────────────────────────┘
                            │ CLI-Brücke
┌───────────────────────────▼────────────────────────────┐
│                Natives CLI-Binary (`oxy`)              │
└────────────────────────────────────────────────────────┘
```

- **Lokale Datenbank**: Sämtliche Einträge werden in einer lokalen SQLite-Datei (`oxytime.db`) gespeichert. Keine Cloud-Zwangsanbindung oder Telemetrie.
- **Dreifache Entkopplung (Triple Decoupling)**: Vollständige Trennung von Benutzeroberfläche, Engine-Regeln und Datenhaltung.
- **Duale Schnittstellen**: Desktop-Anwendung mit drei Layout-Dichten (Kompakt, Mittel, Voll) und synchronisiertes Terminal-CLI (`oxy`).

---

## Dokumentationsstruktur

### Benutzerhandbuch

- **[Erste Schritte](getting-started.md)**: Installation, Einrichtung und Erstellung des ersten Projekts und Tasks.
- **[Timer-Grundlagen](timer.md)**: Timer-Bedienung, atomares Aufgabenwechseln, Eintragsanpassung und Validierung.
- **[Basis-CLI (`oxy`)](cli.md)**: Terminalbefehle zum Starten, Stoppen, Auflisten und Verwalten von Tasks.
- **[Benutzeroberfläche & Designs](interface.md)**: Layout-Varianten, integrierte semantische Themes und Skalierung.
- **[Häufige Fragen (FAQ)](faq.md)**: Speicherpfade der Datenbank, Backups und Offline-Betrieb.

### Technische Dokumentation & Entwickler-Referenz

- **[Erweiterte CLI-Skripte](advanced-cli.md)**: JSON-Pipelines, Shell-Prompt-Integration und Cron-Automatisierung.
- **[Systemarchitektur](architecture.md)**: Rust-Engine-Lebenszyklus, AST-Architekturtests und SQLite-Schicht.
- **[Sinks & Automatisierung](automation.md)**: Konfiguration von CSV-Audit-Trails und HTTP-Webhooks.
- **[Kompilierung aus Quellcode](developer-build.md)**: Voraussetzungen, Bun-Toolchain und Cargo-Build-Befehle.

---

## Offizielle Pakete

| Betriebssystem | Pakettyp | Zielarchitektur |
| :--- | :--- | :--- |
| **Windows** | Setup-Installer (`.exe`) | x86_64 |
| **Windows** | Portable Executable (`.exe`) | x86_64 |
| **macOS** | Universal DMG (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | DEB-Paket (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | RPM-Paket (`.rpm`) | x86_64 |

Binärdateien und kryptografische Prüfsummen (`SHA256SUMS.txt`) stehen auf der [GitHub Releases-Seite](https://github.com/beoArcha/TimeLog/releases/latest) bereit.
