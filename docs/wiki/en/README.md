# oXyFlow Documentation

> **Language**: **English** | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | [Espa\u00f1ol](/es/README.md) | [Fran\u00e7ais](/fr/README.md) | [Portugu\u00eas](/pt-br/README.md)

---

oXyFlow is a local-first work timer and task tracker available as a native desktop application (Tauri v2, Rust, SQLite) with a native CLI companion (`oxy`), as well as a standalone **Web Application & Progressive Web App (PWA)** hosted directly on GitHub Pages.

> 🚀 **Live Web App**: Launch oXyFlow instantly in any browser or install it to your device at **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)**.

---

## System Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│        (Tailwind CSS, Base UI, Semantic Tokens)        │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼ (Desktop Runtime)                 ▼ (Web / PWA Runtime)
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Tauri IPC (Commands)     │     │     Browser Persistence     │
│  - Native Rust Engine       │     │  - localStorage Plugin      │
│  - SQLite Database          │     │  - PWA Service Worker       │
│  - Real-Time Sinks          │     │  - Local-first in-browser   │
└──────────────┬──────────────┘     └─────────────────────────────┘
               │ CLI Bridge
┌──────────────▼──────────────┐
│   Native CLI Binary (`oxy`) │
└─────────────────────────────┘
```

- **Local Storage**: Desktop records persist in a local SQLite database (`oxytime.db`); Web/PWA records persist locally in browser storage. No telemetry, analytics, or mandatory account creation.
- **Layer Decoupling**: Separation between UI presentation, domain engine rules, and native storage drivers.
- **Flexible Runtimes**: Native desktop GUI with customizable density (Compact, Medium, Full), synchronized terminal CLI (`oxy`), and browser/PWA deployment.

---

## Documentation Structure

### User Guide

- **[Getting Started](getting-started.md)**: Installation, web application access, initial configuration, and creating projects and tasks.
- **[Timer & Tracking](timer.md)**: Operating the timer, switching active tasks, adjusting logs, and viewing totals.
- **[CLI Companion (`oxy`)](cli.md)**: Terminal syntax for starting, pausing, listing, and switching tasks directly from PowerShell or Bash.
- **[Interface & Themes](interface.md)**: Customizing layout density, core color themes, and accessibility settings.
- **[Frequently Asked Questions](faq.md)**: Details on database paths, backups, and offline integrity.

### Technical & Developer Reference

- **[Advanced CLI Scripting](advanced-cli.md)**: JSON output pipelines, scripting automation, and shell prompt integration.
- **[System Architecture](architecture.md)**: Rust engine lifecycle, SQLite schema migrations, and event dispatchers.
- **[Sinks & Automations](automation.md)**: Configuring real-time CSV audit trails and webhook payloads.
- **[Building from Source](developer-build.md)**: Prerequisites, Bun toolchain setup, and Cargo build commands.

---

## Official Packages & Deployments

| Platform | Deployment / Package Type | Target Architecture | Link / Instructions |
| :--- | :--- | :--- | :--- |
| **Web & PWA** | Web Application (Zero Install) | Modern Web Browsers | [Launch Web App](https://beoarcha.github.io/TimeLog/app/) |
| **Windows** | Setup Installer (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Windows** | Portable Executable (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **macOS** | Universal DMG (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel) | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux** | AppImage (`.AppImage`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (Debian / Ubuntu)** | DEB Package (`.deb`) | amd64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (RHEL / Fedora)** | RPM Package (`.rpm`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |

Pre-compiled binary releases and cryptographic checksums (`SHA256SUMS.txt`) are available on the [GitHub Releases page](https://github.com/beoArcha/TimeLog/releases/latest).
