# Technische Dokumentation oXyFlow

> Sprache / Language: [English](/en/README.md) | [Polski](/pl/README.md) | **Deutsch** | [Español](/es/README.md) | [Français](/fr/README.md) | [Português](/pt-br/README.md)

---

oXyFlow ist eine lokale Arbeitszeiterfassungs- und Aufgabenverwaltungsanwendung, verfügbar als native Desktop-Anwendung (Tauri v2, Rust, SQLite) mit integriertem CLI-Begleiter (`oxy`), sowie als eigenständige **Webanwendung und Progressive Web App (PWA)**, die direkt über GitHub Pages bereitgestellt wird.

> 🚀 **Live-Web-App**: Starten Sie oXyFlow direkt im Browser oder installieren Sie die App offlinefähig unter **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)**.

---

## Architektur-Übersicht

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│        (Tailwind CSS, Base UI, Semantische Token)      │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼ (Desktop-Laufzeit)                ▼ (Web- / PWA-Laufzeit)
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Tauri IPC (Befehle)      │     │      Browser-Speicher       │
│  - Native Rust-Engine       │     │  - localStorage Plugin      │
│  - SQLite-Datenbank         │     │  - PWA Service Worker       │
│  - Echtzeit-Sinks           │     │  - 100% Offline-Betrieb     │
└──────────────┬──────────────┘     └─────────────────────────────┘
               │ CLI-Brücke
┌──────────────▼──────────────┐
│   Natives CLI-Binary (`oxy`)│
└─────────────────────────────┘
```

- **Lokale Datenbank**: Desktop-Einträge verbleiben in der lokalen SQLite-Datei (`oxytime.db`), Web/PWA-Einträge im privaten `localStorage` des Browsers. Keine Telemetrie oder Kontozwang.
- **Dreifache Entkopplung (Triple Decoupling)**: Vollständige Trennung von Benutzeroberfläche, Engine-Regeln und Datenhaltung.
- **Flexible Laufzeitumgebungen**: Desktop-App (Kompakt, Mittel, Voll), synchronisiertes Terminal-CLI (`oxy`) und sofortige Web/PWA-Verfügbarkeit.

---

## Dokumentationsstruktur

### Benutzerhandbuch

- **[Erste Schritte](getting-started.md)**: Web-Zugriff, Desktop-Installation, Einrichtung und Erstellung des ersten Projekts und Tasks.
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

## Offizielle Pakete & Bereitstellung

| Plattform | Bereitstellung / Pakettyp | Zielarchitektur | Link / Anleitung |
| :--- | :--- | :--- | :--- |
| **Web & PWA** | Webanwendung (ohne Installation) | Moderne Webbrowser | [Web-App öffnen](https://beoarcha.github.io/TimeLog/app/) |
| **Windows** | Setup-Installer (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Windows** | Portable Executable (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **macOS** | Universal DMG (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux** | AppImage (`.AppImage`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (Debian / Ubuntu)** | DEB-Paket (`.deb`) | amd64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (RHEL / Fedora)** | RPM-Paket (`.rpm`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |

Binärdateien und kryptografische Prüfsummen (`SHA256SUMS.txt`) stehen auf der [GitHub Releases-Seite](https://github.com/beoArcha/TimeLog/releases/latest) bereit.
