# CLI Básico (oxy)

> Idioma / Language: [English](/en/cli.md) | [Polski](/pl/cli.md) | [Deutsch](/de/cli.md) | [Español](/es/cli.md) | [Français](/fr/cli.md) | **Português (BR)**

---

oXyFlow inclui um utilitário de terminal nativo chamado `oxy`, que se conecta diretamente ao banco de dados local SQLite (`oxytime.db`). Funciona de maneira autônoma, sem necessidade da janela gráfica aberta, ideal para automações, rotinas de shell e esteiras de CI/CD.

---

## Flags Globais

O binário `oxy` aceita flags globais para ajustar a saída e o nível de detalhes:

| Flag | Forma Curta | Descrição |
| :--- | :--- | :--- |
| `--json` | `-j` | Emite dados brutos em JSON estruturado na saída padrão (`stdout`). |
| `--machine` | `-m` | Emite JSON conciso em linha única, sem menus iterativos. |
| `--quiet` | `-q` | Oculta notificações informativas e cabeçalhos de tabela. |

---

## Ciclo de Vida do Temporizador

```bash
# Consultar o status atual do temporizador ativo
oxy status

# Iniciar o temporizador em uma tarefa (por ID, prefixo ou nome)
oxy start "Implementação da API"

# Parar a sessão em andamento
oxy stop

# Alternar atomicamente para outra tarefa em uma única etapa
oxy switch "Correção na Interface"

# Exibir o resumo do tempo trabalhado hoje
oxy today
```

---

## Gerenciamento de Projetos e Tarefas

```bash
# Listar todos os projetos ativos
oxy project ls

# Criar um novo projeto com cor de identificação opcional
oxy project add "Portal do Cliente" -c "#3b82f6"

# Listar tarefas de todos os projetos
oxy task ls

# Listar tarefas filtradas por projeto
oxy task ls -p "Portal do Cliente"

# Adicionar uma nova tarefa em um projeto existente
oxy task add "Modelar fluxo OAuth" -p "Portal do Cliente"

# Marcar uma tarefa como concluída
oxy task done "Modelar fluxo OAuth"

# Arquivar uma tarefa
oxy task rm "Modelar fluxo OAuth"
```

---

## Geração de Relatórios e Exportação

```bash
# Exibir uma árvore Unicode hierárquica das tarefas de hoje
oxy report --tree --today

# Exibir o relatório consolidado da semana
oxy report --tree --week

# Exportar registros de tempo para HTML, CSV ou JSON
oxy report export -f html -o ./relatorio.html
oxy report export -f csv -o ./relatorio.csv
oxy report export -f json -o ./relatorio.json
```

---

## Códigos de Saída

Todos os comandos de `oxy` retornam códigos de saída POSIX determinísticos:

| Código | Significado | Descrição |
| :--- | :--- | :--- |
| `0` | Sucesso | Comando finalizado com êxito. |
| `1` | Erro genérico | Violação de regra de negócio ou invariante. |
| `2` | Erro de sintaxe | Comando inválido, argumento ausente ou flag incorreta. |
| `3` | Erro de banco | Falha de E/S ou acesso à base SQLite. |
| `4` | Erro de entidade | Entidade não encontrada ou correspondência ambígua. |
| `5` | Erro de motor | Conflito no ciclo de vida do temporizador. |

---

## Envelope de Erros e Modo Máquina

Quando um comando falha, o `oxy` grava informações técnicas estruturadas na saída `stderr`.

Em pipelines automatizados com `--machine` (ou `--json`), prompts interativos e blocos de sugestão para humanos são suprimidos. O erro é emitido como um envelope JSON determinístico em linha única:

```json
{"code":"DOM_ENTITY_NOT_FOUND","message":"Task '104' was not found","operation":"start","subsystem":"domain"}
```

No modo interativo do terminal (TTY), o envelope inclui um objeto `user` adicional com contexto no idioma selecionado, instruções de remediação e sugestões do tipo "Você quis dizer...":

```json
{
  "code": "DOM_ENTITY_NOT_FOUND",
  "message": "Task '104' was not found",
  "operation": "start",
  "subsystem": "domain",
  "user": {
    "locale": "pt-br",
    "message": "A tarefa '104' não existe no projeto ativo.",
    "suggestion": "Você quis dizer a tarefa '105' (Implementação OAuth)?",
    "remediation": "Execute 'oxy task ls' para ver as tarefas disponíveis."
  }
}
```

### Códigos de Erro Semânticos

| Código de Erro | Código de Saída | Descrição |
| :--- | :---: | :--- |
| `CLI_SYNTAX_UNKNOWN_COMMAND` | `2` | Comando ou subcomando desconhecido ou não implementado. |
| `CLI_SYNTAX_INVALID_ARGS` | `2` | Argumentos ausentes ou inválidos (ex.: caminhos em branco). |
| `DOM_ENTITY_NOT_FOUND` | `4` | Projeto, tarefa, registro de tempo ou alias não encontrado. |
| `ENG_OPERATION_FAILED` | `1` | Violação de regra de negócio (ex.: validação de nome vazio). |
| `ENG_TIMER_ACTIVE` | `5` | Tentativa de iniciar cronômetro quando outro está ativo sem flag force. |
| `ENG_TIMER_INACTIVE` | `5` | Tentativa de parar cronômetro sem nenhuma sessão ativa em andamento. |
| `SNK_EXTERNAL_IO` | `1` | Falha de destino externo (caminho inacessível ou teste de sink reprovado). |
| `STO_SQLITE_CONSTRAINT` | `3` | Violação de restrição do SQLite (chave única ou estrangeira). |
| `STO_STORAGE_ERROR` | `3` | Erro de baixo nível de acesso ao banco de dados ou E/S. |

---

Para rotinas automatizadas e manipulação com `jq`, veja **[Scripting CLI Avançado](advanced-cli.md)**.
