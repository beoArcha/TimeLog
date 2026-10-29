# Documentação Técnica oXyFlow

> Idioma / Language: [English](/en/README.md) | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | [Español](/es/README.md) | [Français](/fr/README.md) | **Português (BR)**

---

oXyFlow é um aplicativo local de controle de tempo e rastreamento de tarefas, disponível como aplicação nativa para desktop (Tauri v2, Rust, SQLite) acompanhada pelo utilitário CLI (`oxy`), bem como uma **aplicação Web e Progressive Web App (PWA)** hospedada diretamente no GitHub Pages.

> 🚀 **Aplicativo Web ao Vivo**: Inicie o oXyFlow imediatamente no seu navegador ou instale com capacidade offline em **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)**.

---

## Visão Geral da Arquitetura do Sistema

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│         (Tailwind CSS, Base UI, Tokens Semânticos)     │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼ (Ambiente Desktop)                ▼ (Ambiente Web / PWA)
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Tauri IPC (Comandos)     │     │    Armazenamento Navegador  │
│  - Motor nativo em Rust     │     │  - Plugin localStorage      │
│  - Banco de dados SQLite    │     │  - Service Worker PWA       │
│  - Sinks em tempo real      │     │  - Funcionamento 100% offline│
└──────────────┬──────────────┘     └─────────────────────────────┘
               │ Ponte CLI
┌──────────────▼──────────────┐
│  Binário Nativo CLI (`oxy`) │
└─────────────────────────────┘
```

- **Armazenamento Local**: No desktop, os dados ficam no SQLite local (`oxytime.db`), e na versão Web/PWA no `localStorage` privado do navegador. Sem telemetria nem contas obrigatórias.
- **Triplo Desacoplamento (Triple Decoupling)**: Separação estrita entre a interface de usuário, as regras do motor de domínio e os drivers de armazenamento.
- **Multiplataforma**: Aplicativo desktop (Compacto, Médio, Completo), terminal sincronizado (`oxy`) e versão Web/PWA instantânea.

---

## Estrutura da Documentação

### Guia do Usuário

- **[Primeiros Passos](getting-started.md)**: Acesso Web, instalação no desktop, configuração inicial e criação de projetos e tarefas.
- **[Uso do Temporizador](timer.md)**: Controle do timer, alternância atômica de tarefas, edição de registros e regras temporais.
- **[CLI Básico (`oxy`)](cli.md)**: Sintaxe de comandos no PowerShell, Bash ou Zsh.
- **[Interface e Temas](interface.md)**: Variantes de layout, temas semânticos integrados e escalas visuais.
- **[Perguntas Frequentes (FAQ)](faq.md)**: Caminhos de banco de dados, backups e integridade offline.

### Documentação Técnica e Referência do Desenvolvedor

- **[Scripting CLI Avançado](advanced-cli.md)**: Pipelines JSON, integração com prompts de terminal e automação.
- **[Arquitetura do Sistema](architecture.md)**: Ciclo de vida do motor Rust, testes AST e camada SQLite.
- **[Automação e Sinks](automation.md)**: Configuração de auditoria CSV em tempo real e webhooks HTTP.
- **[Compilação a partir do Código-Fonte](developer-build.md)**: Pré-requisitos, toolchain Bun e comandos Cargo.

---

## Pacotes Oficiais e Implantações

| Plataforma | Tipo de Pacote / Implantação | Arquitetura | Link / Instruções |
| :--- | :--- | :--- | :--- |
| **Web & PWA** | Aplicação Web (Sem instalação) | Navegadores Modernos | [Abrir Aplicação Web](https://beoarcha.github.io/TimeLog/app/) |
| **Windows** | Instalador Setup (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Windows** | Executável Portátil (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **macOS** | Disco Universal (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux** | AppImage (`.AppImage`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (Debian / Ubuntu)** | Pacote DEB (`.deb`) | amd64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (RHEL / Fedora)** | Pacote RPM (`.rpm`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |

Os arquivos binários e as somas de verificação criptográficas (`SHA256SUMS.txt`) estão disponíveis na [página de versões do GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
