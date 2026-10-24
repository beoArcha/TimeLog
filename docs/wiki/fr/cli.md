# CLI de Base (oxy)

> Langue / Language: [English](/en/cli.md) | [Polski](/pl/cli.md) | [Deutsch](/de/cli.md) | [Español](/es/cli.md) | **Français** | [Português](/pt-br/cli.md)

---

oXyFlow inclut un outil de terminal natif nommé `oxy`, qui interagit directement avec la base de données SQLite locale (`oxytime.db`). Il fonctionne indépendamment de l'interface graphique, ce qui en fait un allié idéal pour les scripts, les environnements sans affichage et les chaînes CI/CD.

---

## Drapeaux Globaux

Le binaire `oxy` accepte des drapeaux globaux pour ajuster le niveau de détail et le format des sorties :

| Drapeau | Raccourci | Description |
| :--- | :--- | :--- |
| `--json` | `-j` | Émet du JSON structuré et brut sur la sortie standard (`stdout`). |
| `--machine` | `-m` | Émet du JSON concis sur une seule ligne en désactivant les invites interactives. |
| `--quiet` | `-q` | Masque les messages informatifs et les en-têtes de tableau. |

---

## Cycle de Vie du Minuteur

```bash
# Vérifier l'état du minuteur actif
oxy status

# Lancer le suivi d'une tâche (par ID, préfixe ou nom)
oxy start "Implémentation API"

# Arrêter la session en cours
oxy stop

# Basculer de façon atomique vers une autre tâche en une seule étape
oxy switch "Correction Interface"

# Afficher le résumé du temps travaillé aujourd'hui
oxy today
```

---

## Gestion des Projets et des Tâches

```bash
# Lister l'ensemble des projets actifs
oxy project ls

# Créer un nouveau projet avec une couleur facultative
oxy project add "Portail Client" -c "#3b82f6"

# Lister les tâches de tous les projets
oxy task ls

# Lister les tâches filtrées par projet
oxy task ls -p "Portail Client"

# Ajouter une nouvelle tâche rattachée à un projet
oxy task add "Conception flux OAuth" -p "Portail Client"

# Marquer une tâche comme terminée
oxy task done "Conception flux OAuth"

# Archiver une tâche
oxy task rm "Conception flux OAuth"
```

---

## Génération de Rapports et Exportation

```bash
# Générer un arbre Unicode hiérarchique des tâches du jour
oxy report --tree --today

# Afficher le rapport de la semaine en cours
oxy report --tree --week

# Exporter les temps vers un fichier HTML, CSV ou JSON
oxy report export -f html -o ./releve.html
oxy report export -f csv -o ./releve.csv
oxy report export -f json -o ./releve.json
```

---

## Codes de Sortie

Toutes les commandes `oxy` renvoient des codes de sortie POSIX déterministes :

| Code | Signification | Description |
| :--- | :--- | :--- |
| `0` | Succès | Commande exécutée avec succès. |
| `1` | Erreur générique | Violation d'une règle métier ou échec d'invariante. |
| `2` | Erreur de syntaxe | Commande invalide, argument manquant ou drapeau non supporté. |
| `3` | Erreur de stockage | Échec de lecture/écriture dans la base SQLite. |
| `4` | Erreur d'entité | Entité introuvable ou requête ambiguë. |
| `5` | Erreur moteur | Conflit dans le cycle de vie du minuteur. |

---

## Enveloppe d'Erreur et Mode Machine

Lorsqu'une commande échoue, `oxy` écrit des détails techniques structurés sur `stderr`.

Dans les pipelines automatisés avec `--machine` (ou `--json`), les invites interactives et les blocs de suggestions humaines sont supprimés. L'erreur est émise sous forme d'une enveloppe JSON déterministe sur une seule ligne :

```json
{"code":"DOM_ENTITY_NOT_FOUND","message":"Task '104' was not found","operation":"start","subsystem":"domain"}
```

En mode interactif dans un terminal (TTY), l'enveloppe inclut un objet `user` supplémentaire fournissant du contexte lisible, des instructions de remédiation et des suggestions « Vouliez-vous dire... » :

```json
{
  "code": "DOM_ENTITY_NOT_FOUND",
  "message": "Task '104' was not found",
  "operation": "start",
  "subsystem": "domain",
  "user": {
    "locale": "fr",
    "message": "La tâche '104' n'existe pas dans le projet actif.",
    "suggestion": "Vouliez-vous dire la tâche '105' (Implémentation OAuth) ?",
    "remediation": "Exécutez 'oxy task ls' pour voir les tâches disponibles."
  }
}
```

### Codes d'Erreur Sémantiques

| Code d'Erreur | Code de Sortie | Description |
| :--- | :---: | :--- |
| `CLI_SYNTAX_UNKNOWN_COMMAND` | `2` | Commande ou sous-commande inconnue ou non implémentée. |
| `CLI_SYNTAX_INVALID_ARGS` | `2` | Arguments manquants ou invalides (ex. chemins vides). |
| `DOM_ENTITY_NOT_FOUND` | `4` | Le projet, la tâche, l'entrée de temps ou l'alias ciblé n'existe pas. |
| `ENG_OPERATION_FAILED` | `1` | Règle métier enfreinte (ex. validation de nom d'entité vide). |
| `ENG_TIMER_ACTIVE` | `5` | Tentative de démarrer un minuteur alors qu'un autre est actif sans flag de forçage. |
| `ENG_TIMER_INACTIVE` | `5` | Tentative d'arrêter le minuteur alors qu'aucune session n'est active. |
| `SNK_EXTERNAL_IO` | `1` | Échec de destination externe (chemin inaccessible ou test de sink échoué). |
| `STO_SQLITE_CONSTRAINT` | `3` | Violation de contrainte SQLite (clé unique ou étrangère). |
| `STO_STORAGE_ERROR` | `3` | Erreur de bas niveau d'accès à la base de données ou d'E/S. |

---

Pour les flux de données et l'automatisation en scripts de shell, consultez **[Scripts CLI Avancés](advanced-cli.md)**.
