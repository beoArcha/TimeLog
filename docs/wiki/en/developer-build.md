# Building from Source

> Language / Język: **English** | [Polski](/pl/developer-build.md) | [Deutsch](/de/developer-build.md) | [Español](/es/developer-build.md) | [Français](/fr/developer-build.md) | [Português](/pt-br/developer-build.md)

---

Instructions for compiling, testing, and developing oXyFlow locally across Windows, macOS, and Linux.

---

## Prerequisites

- **Bun**: Modern JavaScript runtime and toolchain (version $\ge$ 1.1). Never use npm, npx, yarn, or pnpm.
- **Rust and Cargo**: Stable toolchain (version $\ge$ 1.80) with `clippy` and `rustfmt`.
- **System Dependencies (Linux only)**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## Local Development Workflow

```bash
# Clone the repository
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Install frontend dependencies
bun install

# Run the browser runtime (uses browser plugin with LocalStorage)
bun run dev

# Run native desktop app with hot-reloading (Tauri + Rust engine)
bun run tauri:dev
```

---

## Verification and Testing Commands

Run the automated test tiers before committing changes:

| Purpose | Command |
| :--- | :--- |
| All Vitest tests (unit, integration, architecture) | `bun run test` |
| Run a specific test file | `bun x vitest run tests/unit/path/to/file.test.ts` |
| TypeScript type check and ESLint | `bun run typecheck` and `bun run lint` |
| Rust unit, integration, and parity tests | `bun run test:rust` |
| Rust Clippy and formatting checks | `bun run lint:rust` and `bun run fmt:rust:check` |
| Rust architecture tests | `bun run test:arch:rust` |
| End-to-End tests (Playwright) | `bun run test:e2e` |
| Regenerate TypeScript bindings from Rust types | `cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings_when_testing` |
