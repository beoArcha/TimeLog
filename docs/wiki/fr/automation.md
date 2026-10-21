# Automatisation & Sinks

> Langue / Language: [English](/en/automation.md) | [Polski](/pl/automation.md) | [Deutsch](/de/automation.md) | [Español](/es/automation.md) | **Français** | [Português](/pt-br/automation.md)

---

oXyFlow intègre un sous-système persistant de **Sinks**, chargé d'enregistrer et de transmettre en temps réel les événements temporels lors de la clôture des sessions de travail.

---

## Types de Sinks Pris en Charge

1. **Audit CSV Local** : Ajoute automatiquement des lignes structurées dans des fichiers CSV situés dans le dossier configuré.
2. **Webhook HTTP Sortant** : Transmet une charge utile JSON en requête `POST` avec jeton Bearer optionnel vers des services d'automatisation (tels que n8n, Zapier ou vos propres API REST).

---

## Configuration via le CLI

La commande `oxy sink` configure et valide les destinations directement dans la base SQLite :

```bash
# Lister l'ensemble des sinks configurés et leur état
oxy sink ls

# Définir le dossier local recevant les fichiers d'audit CSV
oxy sink set-csv --dir "$HOME/Documents/timelogs"

# Configurer un point de terminaison HTTP/HTTPS avec jeton optionnel
oxy sink set-webhook --url "https://api.example.com/v1/timelogs" --token "mon-token-secret"

# Déclencher un test de connectivité vers tous les sinks configurés
oxy sink test
```

---

## Format Machine pour les Sinks

En ajoutant `--json` ou `--machine`, les résultats sont renvoyés sous forme de données JSON exploitables :

```bash
# Tester les sinks en mode machine
oxy sink test --json

# Obtenir la liste des sinks en JSON
oxy sink ls --json
```

---

## Schéma de Charge Utile du Webhook

Lorsqu'une session est finalisée ou testée, le webhook expédie l'objet JSON suivant :

```json
{
  "event": "time_log_stopped",
  "timestamp": "2026-10-21T18:30:00Z",
  "log": {
    "id": "e6a0d24f-95ec-4467-bc5b-419b4e348981",
    "project_id": "proj-1",
    "task_id": "task-42",
    "project_name": "Portail Client",
    "task_title": "Optimisation base de données",
    "start_time": "2026-10-21T17:00:00Z",
    "end_time": "2026-10-21T18:30:00Z",
    "duration_seconds": 5400
  }
}
```

Si le serveur distant est temporairement inaccessible, les messages en échec sont conservés dans la file d'attente SQLite (`webhook_queue`) et réexpédiés selon une stratégie d'intervalle exponentiel.
