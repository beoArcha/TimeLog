# Arquitetura do Sistema e Engenharia

> Idioma / Language: [English](/en/architecture.md) | [Polski](/pl/architecture.md) | [Deutsch](/de/architecture.md) | [Español](/es/architecture.md) | [Français](/fr/architecture.md) | **Português (BR)**

---

O oXyFlow aplica os padrões da Clean Architecture com rigoroso isolamento de camadas, auditado por testes automáticos de arquitetura via análise de AST no frontend em TypeScript (`tests/architecture/`) e no backend em Rust (`src-tauri/tests/architecture/`).

---

## Topologia Arquitetural Geral

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Presentation UI                        │
│         (Tokens Tailwind CSS, hooks orquestradores declarativos)       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌────────────────────┐
│     EngineRouter      │                           │ PersistenceRouter  │
│  (IRouter<IEngine>)   │                           │(IRouter<IPersist>) │
└──────────┬────────────┘                           └─────────┬──────────┘
           │                                                  │
           ├──────────────────────────────┬───────────────────┤
           ▼                              ▼                   ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────┐
│       Tauri Desktop IPC     │  │       Plugin Runtime de Navegador     │
│ (Ponte IPC para motor Rust) │  │  (EnginePlugin + PersistencePlugin)   │
└──────────┬──────────────────┘  └───────────────────────────────────────┘
           ▼
┌─────────────────────────────┐
│   Motor de Referência Rust  │
│  - Ciclo de vida do timer   │
│  - Métricas e durações      │
│  - Invariantes temporais    │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ Camada Persistência SQLite  │
│  - Repositórios Rusqlite    │
│  - Modo WAL e transações    │
└─────────────────────────────┘
```

---

## Invariantes Arquiteturais Essenciais

### 1. Regra do Triplo Desacoplamento (Triple Decoupling)

1. **Desacoplado de Textos Traduzidos**: Componentes visuais nunca verificam mensagens traduzidas. Os testes e seletores utilizam exclusivamente `data-testid` ou papéis de acessibilidade ARIA.
2. **Desacoplado de Temas e CSS**: A estilização emprega tokens semânticos (`bg-card`, `text-foreground`). Os componentes não contêm condições como `resolvedTheme === 'dark'` nem cores hexadecimais explícitas.
3. **Desacoplado de Efeitos de Plataforma**: Componentes React compartilhados nunca acessam `window.__TAURI__` diretamente. Toda a comunicação ocorre por meio dos roteadores polimórficos (`EngineRouter`, `PersistenceRouter`).

### 2. Paridade de Motores entre Plataformas

A lógica de negócios central (transições de estado do temporizador, cálculo de durações na virada de dia e regras de validação) é mantida em duas implementações síncronas:

- **Motor de Referência em Rust** (`src-tauri/src/engine/`): Desempenho compilado máximo para o ambiente desktop.
- **Plugin de Motor no Navegador** (`src/plugins/engine/`): TypeScript puro para assegurar comportamento idêntico em prévias e testes.

Uma bateria compartilhada de testes de paridade (`CrossRuntimeParity.test.ts`) executa matrizes idênticas contra ambos os motores.

### 3. Regra de no Máximo 2 Sentenças If Aninhadas (Rule of 3 Ifs)

Em todo o projeto (TypeScript e Rust), o nível máximo permitido de aninhamento de instruções `if` é 2. Blocos de condição aninhados 3 ou mais vezes causam a quebra imediata dos testes de arquitetura (`max-nested-ifs.arch.test.ts` e `max_nested_ifs_test.rs`).

### 4. Isolamento do CLI Headless

O binário de terminal (`src-tauri/src/cli/`) comunica-se diretamente com os contratos `Engine` e `Persistence`. É expressamente proibido importar tipos de interface gráfica do Tauri (`AppState`, `tauri::AppHandle`, controladores de janelas ou ícones de bandeja).
