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

Para rotinas automatizadas e manipulação com `jq`, veja **[Scripting CLI Avançado](advanced-cli.md)**.
