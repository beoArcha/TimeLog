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

Pour les flux de données et l'automatisation en scripts de shell, consultez **[Scripts CLI Avancés](advanced-cli.md)**.
