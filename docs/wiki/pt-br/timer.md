# Uso do Temporizador e Rastreamento de Tempo

> Idioma / Language: [English](/en/timer.md) | [Polski](/pl/timer.md) | [Deutsch](/de/timer.md) | [Español](/es/timer.md) | [Français](/fr/timer.md) | **Português (BR)**

---

oXyFlow gerencia suas sessões de tempo por meio de um motor nativo em Rust que assegura a integridade dos dados e elimina variações ou atrasos de contagem.

---

## Princípios de Funcionamento do Temporizador

- **Registro Ativo Único**: Apenas uma tarefa pode registrar tempo simultaneamente. Iniciar uma nova tarefa preenche o campo `endTime` do registro em andamento e consolida a transação antes de abrir a próxima sessão.
- **Alternância Atômica (`switch`)**: Trocar de tarefa pela interface ou pelo comando `oxy switch <id>` encerra o timer atual e ativa o novo em uma única transação no SQLite.
- **Marcações de Tempo UTC**: Todas as referências temporais são gravadas no formato ISO 8601 UTC. A duração total é obtida determinísticamente pela diferença entre início e término.
- **Cálculo em Tempo Real sem Desvios**: A interface computa o tempo decorrido diretamente no relógio do sistema operacional (`useLiveTaskElapsed`), evitando distorções comuns a contadores `setInterval` em JavaScript quando a máquina suspende.

---

## Modificação e Ajuste de Registros

Você pode inspecionar e corrigir registros anteriores na tabela **Registros de Tempo** ou no painel de **Relatórios**:

1. Clique em qualquer registro para abrir o editor de sessão.
2. Modifique os horários de início ou término.
3. Salve a alteração. O motor recalculará a duração total e atualizará os totais do projeto.

---

## Validação de Sobreposição Temporal

Para garantir conformidade rigorosa em auditorias de faturamento, o motor proíbe qualquer sobreposição temporal (`TemporalOverlapDetected`):

- Não é permitido que dois registros do mesmo projeto ocupem intervalos coincidentes.
- Em caso de conflito de datas, o editor rejeitará a operação e solicitará a correção do intervalo.

---

## Relatórios e Exportação de Dados

O módulo de relatórios consolida dados por dia, semana e mês:

- **Estrutura por Projeto**: Exibição agrupada por projetos, tarefas e subtarefas.
- **Formatos de Exportação**: Suporte direto para arquivos **HTML** (pronto para impressão), **CSV** (para planilhas) e **JSON** (para integrações e scripts).
