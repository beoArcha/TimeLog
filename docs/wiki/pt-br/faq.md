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

No modo navegador, os dados são armazenados no `localStorage` do HTML5 sob chaves específicas.

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

- **Backups automáticos**: O oXyFlow oferece rotinas em **Configurações → Banco de Dados & Backup**.
- **Backup manual**: Copie o arquivo `oxytime.db` com o aplicativo fechado ou utilize comandos SQLite:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

---

## 6. Como funciona a sincronização entre a tela do app e o terminal (`oxy`)?

O binário CLI (`oxy`) acessa exatamente o mesmo arquivo local SQLite (`oxytime.db`). Ao executar uma operação no terminal, a interface gráfica reflete a alteração no pulso seguinte do timer ou ao alternar o foco para a janela.
