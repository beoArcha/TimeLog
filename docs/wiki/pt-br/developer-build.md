# Compilação a partir do Código-Fonte

> Idioma / Language: [English](/en/developer-build.md) | [Polski](/pl/developer-build.md) | [Deutsch](/de/developer-build.md) | [Español](/es/developer-build.md) | [Français](/fr/developer-build.md) | **Português (BR)**

---

Instruções para compilar, executar testes e desenvolver o oXyFlow localmente no Windows, macOS e Linux.

---

## Pré-Requisitos

- **Bun**: Runtime JavaScript moderno (versão $\ge$ 1.1). É estritamente proibido o uso de npm, npx, yarn ou pnpm no repositório.
- **Rust e Cargo**: Toolchain estável (versão $\ge$ 1.80) com os componentes `clippy` e `rustfmt`.
- **Dependências do sistema (somente Linux)**:

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## Desenvolvimento Local

```bash
# Clonar o repositório
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Instalar dependências do frontend
bun install

# Iniciar o ambiente de navegador (utiliza plugin com LocalStorage)
bun run dev

# Iniciar a aplicação desktop nativa com hot-reload (Tauri + motor Rust)
bun run tauri:dev
```

---

## Comandos de Verificação e Testes

Execute as suítes de teste antes de enviar suas alterações:

| Finalidade | Comando |
| :--- | :--- |
| Todos os testes Vitest (unitários, integração e arquitetura) | `bun run test` |
| Executar um arquivo de teste isolado | `bun x vitest run tests/unit/path/to/file.test.ts` |
| Verificação de tipos TypeScript e ESLint | `bun run typecheck` e `bun run lint` |
| Testes unitários, de integração e paridade no Rust | `bun run test:rust` |
| Verificação com Clippy e checagem de formatação no Rust | `bun run lint:rust` e `bun run fmt:rust:check` |
| Testes de arquitetura e invariantes no Rust | `bun run test:arch:rust` |
| Testes End-to-End (Playwright) | `bun run test:e2e` |
| Regenerar bindings TypeScript a partir dos tipos Rust | `cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings_when_testing` |
