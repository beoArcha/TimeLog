# Automação e Sinks

> Idioma / Language: [English](/en/automation.md) | [Polski](/pl/automation.md) | [Deutsch](/de/automation.md) | [Español](/es/automation.md) | [Français](/fr/automation.md) | **Português (BR)**

---

O oXyFlow incorpora um subsistema persistente de **Sinks**, responsável por registrar e despachar eventos em tempo real toda vez que uma sessão de trabalho é finalizada.

---

## Tipos de Sinks Suportados

1. **Auditoria Local em CSV**: Adiciona linhas estruturadas de forma contínua em arquivos CSV no diretório configurado.
2. **Webhook HTTP de Saída**: Dispara requisições `POST` com JSON estruturado e token Bearer opcional para serviços de automação (como n8n, Zapier ou APIs REST proprietárias).

---

## Configuração pelo CLI

O grupo de comandos `oxy sink` define e valida destinos diretamente no banco SQLite:

```bash
# Listar todos os sinks configurados e seus respectivos status
oxy sink ls

# Configurar diretório local para arquivos de auditoria em CSV
oxy sink set-csv --dir "$HOME/Documents/timelogs"

# Configurar URL de webhook HTTP/HTTPS com token opcional
oxy sink set-webhook --url "https://api.example.com/v1/timelogs" --token "meu-token-secreto"

# Disparar um teste sintético de conectividade para todos os sinks ativos
oxy sink test
```

---

## Saída Estruturada para Operações de Sinks

Incluindo a flag `--json` ou `--machine`, as confirmações são emitidas em formato JSON:

```bash
# Testar sinks no modo máquina
oxy sink test --json

# Listar sinks em formato JSON
oxy sink ls --json
```

---

## Estrutura do Payload do Webhook

Ao concluir uma sessão ou emitir um teste, o webhook transmite o seguinte objeto JSON:

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Portal do Cliente",
    "task_title": "Otimização de banco de dados",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```

Se o servidor de destino estiver inacessível no momento, os envios com falha são retidos na fila de repetição do SQLite (`webhook_queue`) e reenviados com intervalo exponencial.
