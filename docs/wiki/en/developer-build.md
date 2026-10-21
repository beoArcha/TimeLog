# 🛠️ Building from Source

> 🌐 **Language / Język**: **English** | [Polski](/pl/kompilacja-ze-zrodel.md)

---

Instructions for compiling, testing, and developing oXyFlow locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

- **Bun**: Modern JavaScript runtime and toolchain (version $\ge$ 1.1).
- **Rust & Cargo**: Stable toolchain (version $\ge$ 1.80) with `clippy` and `rustfmt`.
- **System Dependencies (Linux only)**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## 2. Local Development

```bash
# Clone the repository
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Install frontend dependencies
bun install

# Run the browser preview (mocked in-memory persistence)
bun run dev

# Run native desktop app with hot-reloading
bun run tauri:dev
```

---

## 3. Running Automated Test Suites

```bash
# Frontend Vitest suite (AAA unit, BDT integration, and architecture tests)
bun run test

# Rust test suites
bun run test:rust

# Architecture rules enforcement
bun run test:arch:rust

# Complete pre-flight verification
bun run check
```
