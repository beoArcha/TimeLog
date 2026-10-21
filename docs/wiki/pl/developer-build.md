# Budowanie ze Źródeł

> Język / Language: [English](/en/developer-build.md) | **Polski** | [Deutsch](/de/developer-build.md) | [Español](/es/developer-build.md) | [Français](/fr/developer-build.md) | [Português](/pt-br/developer-build.md)

---

Instrukcje dotyczące kompilacji, uruchamiania testów i lokalnego rozwoju oXyFlow w środowiskach Windows, macOS i Linux.

---

## Wymagania Wstępne

- **Bun**: Nowoczesne środowisko uruchomieniowe JavaScript (wersja $\ge$ 1.1). W projekcie obowiązuje zakaz używania npm, npx, yarn lub pnpm.
- **Rust i Cargo**: Stabilny łańcuch narzędzi (wersja $\ge$ 1.80) z komponentami `clippy` i `rustfmt`.
- **Zależności systemowe (tylko Linux)**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## Lokalne Środowisko Deweloperskie

```bash
# Sklonuj repozytorium
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Zainstaluj zależności frontendu
bun install

# Uruchom środowisko przeglądarkowe (używa wtyczki browser z LocalStorage)
bun run dev

# Uruchom natywną aplikację desktopową z hot-reloadem (Tauri + silnik Rust)
bun run tauri:dev
```

---

## Polecenia Weryfikacji i Testowania

Przed zatwierdzeniem zmian uruchom odpowiednie pakiety testów automatycznych:

| Cel | Polecenie |
| :--- | :--- |
| Wszystkie testy Vitest (jednostkowe, integracyjne, architektury) | `bun run test` |
| Uruchomienie pojedynczego pliku testu | `bun x vitest run tests/unit/path/to/file.test.ts` |
| Sprawdzenie typów TypeScript i ESLint | `bun run typecheck` oraz `bun run lint` |
| Testy jednostkowe, integracyjne i parytetu Rust | `bun run test:rust` |
| Weryfikacja Clippy i formatowania kodu w Rust | `bun run lint:rust` oraz `bun run fmt:rust:check` |
| Testy architektury i niezmienników Rust | `bun run test:arch:rust` |
| Testy End-to-End (Playwright) | `bun run test:e2e` |
| Regeneracja powiązań TypeScript z typów Rust | `cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings_when_testing` |
