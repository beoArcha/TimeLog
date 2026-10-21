# Documentação Técnica oXyFlow

> Idioma / Language: [English](/en/README.md) | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | [Español](/es/README.md) | [Français](/fr/README.md) | **Português (BR)**

---

oXyFlow é um aplicativo desktop para controle de tempo de trabalho e rastreamento de tarefas, desenvolvido com Tauri v2, Rust e um banco de dados local SQLite. Funciona de modo 100% offline e inclui uma interface de linha de comando sincronizada (`oxy`) para automação via terminal e scripts.

---

## Visão Geral da Arquitetura do Sistema

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│         (Tailwind CSS, Base UI, Tokens Semânticos)     │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Comandos)
┌───────────────────────────▼────────────────────────────┐
│                    Motor de Referência Rust            │
│  - Ciclo de vida do timer & regras de sobreposição     │
│  - Repositórios SQLite & migrações de esquema          │
│  - Sinks em tempo real (CSV & webhooks HTTP)           │
└───────────────────────────┬────────────────────────────┘
                            │ Ponte CLI
┌───────────────────────────▼────────────────────────────┐
│                  Binário Nativo CLI (`oxy`)            │
└────────────────────────────────────────────────────────┘
```

- **Armazenamento Local**: Todos os registros são salvos em um banco de dados local SQLite (`oxytime.db`). Sem dependências de nuvem, telemetria ou login obrigatório.
- **Triplo Desacoplamento (Triple Decoupling)**: Separação estrita entre a interface de usuário, as regras do motor de domínio e os drivers de armazenamento.
- **Interfaces Duplas**: Aplicativo desktop com três densidades visuais (Compacto, Médio, Completo) e CLI de terminal sincronizado (`oxy`).

---

## Estrutura da Documentação

### Guia do Usuário

- **[Primeiros Passos](getting-started.md)**: Instalação, configuração inicial e criação de projetos e tarefas.
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

## Pacotes Oficiais

| Sistema Operacional | Tipo de Pacote | Arquitetura |
| :--- | :--- | :--- |
| **Windows** | Instalador Setup (`.exe`) | x86_64 |
| **Windows** | Executável Portátil (`.exe`) | x86_64 |
| **macOS** | Disco Universal (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | Pacote DEB (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | Pacote RPM (`.rpm`) | x86_64 |

Os arquivos binários e as somas de verificação criptográficas (`SHA256SUMS.txt`) estão disponíveis na [página de versões do GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
