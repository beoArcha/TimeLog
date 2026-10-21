# 🛠️ Budowanie ze Źródeł

> 🌐 **Język / Language**: [English](/en/developer-build.md) | **Polski**

---

Instrukcja kompilacji, uruchamiania testów i lokalnego rozwoju oXyFlow.

---

## 1. Wymagania Wstępne

- **Bun**: Nowoczesne środowisko uruchomieniowe JavaScript (wersja $\ge$ 1.1).
- **Rust & Cargo**: Stabilny łańcuch narzędzi (wersja $\ge$ 1.80) z `clippy` i `rustfmt`.
- **Biblioteki systemowe (tylko Linux)**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## 2. Uruchomienie Środowiska Developerskiego

```bash
# Klonowanie repozytorium
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Instalacja zależności frontendu
bun install

# Uruchomienie wersji przeglądarkowej (pamięć in-memory)
bun run dev

# Uruchomienie aplikacji okienkowej z hot-reloadem
bun run tauri:dev
```

---

## 3. Uruchamianie Testów Automatycznych

```bash
# Testy jednostkowe, integracyjne i architektoniczne Vitest
bun run test

# Testy backendu Rust
bun run test:rust

# Sprawdzenie reguł architektury
bun run test:arch:rust

# Pełna weryfikacja pre-flight
bun run check
```
