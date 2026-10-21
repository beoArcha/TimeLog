# 🛠️ Developer & Source Build Guide

> *Audience: Developers contributing code, maintaining distribution packages, or creating custom local builds.*

---

## 1. Toolchain Requirements

- **Node / JS Engine**: **Bun** $\ge 1.0.0$ (exclusive JavaScript package manager and runner; do not use npm/yarn/pnpm).
- **Rust Toolchain**: Stable channel (`rustc`, `cargo`) $\ge 1.78$.
- **Linux Build Dependencies**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf lld
  ```

---

## 2. Setting Up the Development Workspace

```bash
# 1. Clone repository
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# 2. Install dependencies (frozen lockfile)
bun install --frozen-lockfile

# 3. Run browser development server (instant hot reload)
bun run dev

# 4. Run desktop development app (Tauri v2 + WebView2 / WebKitGTK)
bun run tauri:dev
```

---

## 3. Running the Quality Suite

Before committing or submitting a PR, ensure all quality gates pass:

```powershell
# 1. Unified TypeScript typecheck, ESLint, Clippy, and Rustfmt
bun run check

# 2. Complete Vitest test suite (unit, integration, architecture)
bun run test

# 3. Rust test suite (unit, integration, architecture, native E2E)
cargo test --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml --test e2e_tests

# 4. Strict clippy check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

---

## 4. Local Release Build Scripts

Automated scripts are provided in `scripts/`:

### On Windows (PowerShell 5.1 & 7.x)

```powershell
# Dry run verification of environment and pre-flight checks
powershell -ExecutionPolicy Bypass -File .\scripts\build-release.ps1 -DryRun

# Build NSIS release installer with automatic pre-flight checks
powershell -ExecutionPolicy Bypass -File .\scripts\build-release.ps1 -Bundle nsis
```

### On Linux & macOS (Bash)

```bash
chmod +x ./scripts/build-release.sh

# Dry run verification
./scripts/build-release.sh --dry-run

# Full release build (AppImage on Linux, DMG on macOS)
./scripts/build-release.sh
```

Generated artifacts are located in `src-tauri/target/release/bundle/`.
