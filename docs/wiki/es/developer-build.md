# Compilación desde el Código Fuente

> Idioma / Language: [English](/en/developer-build.md) | [Polski](/pl/developer-build.md) | [Deutsch](/de/developer-build.md) | **Español** | [Français](/fr/developer-build.md) | [Português](/pt-br/developer-build.md)

---

Instrucciones para compilar, ejecutar pruebas y desarrollar oXyFlow localmente en Windows, macOS y Linux.

---

## Requisitos Previos

- **Bun**: Entorno de ejecución JavaScript moderno (versión $\ge$ 1.1). Queda estrictamente prohibido usar npm, npx, yarn o pnpm en el repositorio.
- **Rust y Cargo**: Toolchain estable (versión $\ge$ 1.80) con `clippy` y `rustfmt`.
- **Dependencias del sistema (solo Linux)**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Instalar dependencias del frontend
bun install

# Iniciar entorno de navegador (utiliza plugin con LocalStorage)
bun run dev

# Iniciar la aplicación de escritorio nativa con recarga en vivo (Tauri + motor Rust)
bun run tauri:dev
```

---

## Comandos de Verificación y Pruebas

Ejecute las suites de pruebas pertinentes antes de enviar cambios:

| Propósito | Comando |
| :--- | :--- |
| Todas las pruebas Vitest (unitarias, integración y arquitectura) | `bun run test` |
| Ejecutar un archivo de prueba específico | `bun x vitest run tests/unit/path/to/file.test.ts` |
| Verificación de tipos TypeScript y ESLint | `bun run typecheck` y `bun run lint` |
| Pruebas unitarias, integración y paridad en Rust | `bun run test:rust` |
| Comprobación de Clippy y formato en Rust | `bun run lint:rust` y `bun run fmt:rust:check` |
| Pruebas de arquitectura e invariantes en Rust | `bun run test:arch:rust` |
| Pruebas End-to-End (Playwright) | `bun run test:e2e` |
| Regenerar enlaces de TypeScript desde tipos en Rust | `cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings_when_testing` |
