# Kompilierung aus Quellcode

> Sprache / Language: [English](/en/developer-build.md) | [Polski](/pl/developer-build.md) | **Deutsch** | [Español](/es/developer-build.md) | [Français](/fr/developer-build.md) | [Português](/pt-br/developer-build.md)

---

Anleitung zur lokalen Kompilierung, Testausführung und Entwicklung von oXyFlow unter Windows, macOS und Linux.

---

## Voraussetzungen

- **Bun**: Moderne JavaScript-Laufzeitumgebung (Version $\ge$ 1.1). Die Verwendung von npm, npx, yarn oder pnpm ist im Projekt untersagt.
- **Rust & Cargo**: Stabile Toolchain (Version $\ge$ 1.80) mit `clippy` und `rustfmt`.
- **System-Abhängigkeiten (nur Linux)**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Frontend-Abhängigkeiten installieren
bun install

# Browser-Laufzeitumgebung starten (nutzt Browser-Plugin mit LocalStorage)
bun run dev

# Native Desktop-App mit Hot-Reload starten (Tauri + Rust-Engine)
bun run tauri:dev
```

---

## Verifizierungs- und Testbefehle

Führen Sie vor dem Übertragen von Änderungen die entsprechenden Test-Suites aus:

| Ziel | Befehl |
| :--- | :--- |
| Alle Vitest-Tests (Unit-, Integrations- und Architekturtests) | `bun run test` |
| Einzelne Testdatei ausführen | `bun x vitest run tests/unit/path/to/file.test.ts` |
| TypeScript-Typprüfung und ESLint | `bun run typecheck` und `bun run lint` |
| Rust Unit-, Integrations- und Paritätstests | `bun run test:rust` |
| Rust Clippy- und Formatierungsprüfung | `bun run lint:rust` und `bun run fmt:rust:check` |
| Rust Architektur- und Invariantentests | `bun run test:arch:rust` |
| End-to-End-Tests (Playwright) | `bun run test:e2e` |
| TypeScript-Bindings aus Rust-Typen neu generieren | `cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings_when_testing` |
