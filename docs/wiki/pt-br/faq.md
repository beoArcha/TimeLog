# Perguntas Frequentes (FAQ)

> Idioma / Language: [English](/en/faq.md) | [Polski](/pl/faq.md) | [Deutsch](/de/faq.md) | [Español](/es/faq.md) | [Français](/fr/faq.md) | **Português (BR)**

---

## 1. Onde ficam salvos os meus registros de tempo?

Todas as informações de tempo, projetos, tarefas e configurações são salvas em um arquivo SQLite local denominado `oxytime.db`.

| Plataforma | Caminho no Disco |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.oxytime.oxyflow\oxytime.db` |
| **Linux** | `~/.local/share/com.oxytime.oxyflow/oxytime.db` |
| **macOS** | `~/Library/Application Support/com.oxytime.oxyflow/oxytime.db` |

No modo navegador (PWA), os dados são gravados no `localStorage` do HTML5 em vez de um arquivo SQLite físico (consulte a pergunta 7 para mais detalhes).

---

## 2. O oXyFlow precisa de conexão com a Internet?

**Não.** O oXyFlow adota uma arquitetura estritamente offline-first. Não há serviços de telemetria, dependências de nuvem ou autenticações externas. Todas as métricas e consultas são executadas localmente pelo motor Rust.

---

## 3. Por que o Windows Defender SmartScreen exibe um alerta na primeira execução?

O SmartScreen do Windows exibe um aviso preventivo para softwares recém-lançados que não contam com um certificado digital comercial EV (de alto custo). O oXyFlow é um projeto de código aberto distribuído sob a Mozilla Public License 2.0 (MPL-2.0).

Para prosseguir:

1. Clique em **Mais informações** na caixa de diálogo do SmartScreen.
2. Clique no botão **Executar assim mesmo**.
3. Você pode checar a autenticidade do binário comparando o hash com o arquivo `SHA256SUMS.txt` publicado nas releases do GitHub.

---

## 4. O que acontece se eu esquecer o temporizador ligado no final do expediente?

A sessão continuará registrando até ser pausada, interrompida ou alternada manualmente:

- Você pode corrigir os horários de início e término na tabela **Registros de Tempo** ou na tela de **Relatórios**.
- O motor de validação bloqueia sobreposições de horários dentro do mesmo projeto (`TemporalOverlapDetected`) para manter a conformidade dos dados.

---

## 5. Como faço para criar e restaurar backups do banco de dados?

- **Backup Universal em JSON**: Em **Configurações → Backup** (no cartão **Backup de Estado e Banco de Dados**):
  - **Exportar**: Clique em **Exportar Backup JSON** (`data-testid="export-backup-btn"`) para gerar um snapshot estruturado (`OxyFlow_Backup_YYYY-MM-DD.json`) contendo todos os projetos, tarefas, registros de tempo e preferências.
  - **Restaurar / Importar**: Clique em **Restaurar / Importar Backup JSON** (`data-testid="import-backup-btn"`) e selecione um arquivo `.json` previamente salvo. O sistema valida o esquema (`validateBackupPayload`) antes de restaurar o estado.
  - **Portabilidade entre Plataformas**: O formato JSON é universal. Você pode exportar uma cópia da PWA web e importá-la no aplicativo desktop (ou o caminho inverso).
- **Backup Físico do SQLite (Apenas Desktop)**: No desktop, você pode copiar o arquivo `oxytime.db` diretamente com o aplicativo fechado ou utilizar utilitários SQLite:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

Na PWA no navegador, o isolamento do sandbox impede o acesso direto ao sistema de arquivos; o backup universal em JSON é o mecanismo principal de cópia e migração de dados.

---

## 6. Como funciona a sincronização entre a tela do app e o terminal (`oxy`)?

O binário CLI (`oxy`) acessa exatamente o mesmo arquivo local SQLite (`oxytime.db`). Ao executar uma operação no terminal, a interface gráfica reflete a alteração no pulso seguinte do timer ou ao alternar o foco para a janela.

---

## 7. Como funciona o armazenamento de dados na versão PWA web em comparação com o desktop?

O oXyFlow utiliza mecanismos de persistência específicos para cada ambiente de execução:

- **Desktop (Tauri v2)**: Os dados são gravados em um arquivo SQLite local com conformidade ACID (`oxytime.db`) no sistema de arquivos, viabilizando cópias manuais e sincronização imediata com o utilitário CLI.
- **Navegador (PWA)**: Os dados residem no `localStorage` do navegador (`LocalStorage Engine`), com isolamento por origem. Como o navegador executa em sandbox sem acesso ao disco, nenhum arquivo `.sqlite` físico é criado ou exportado.
- **Aviso sobre Limpeza de Cache**: Ações de limpeza do navegador ("Limpar dados de navegação", exclusão de cookies e armazenamento local) ou o uso de abas anônimas apagam de forma irreversível os registros de tempo.
- **Recomendação Prática**: Ao utilizar o oXyFlow no navegador, crie cópias JSON frequentes em **Configurações → Backup → Exportar Backup JSON** para manter seus dados seguros no disco local.

