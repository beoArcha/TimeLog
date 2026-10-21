# 💻 Commandes de Base dans le Terminal (CLI)

🌐 **Langue / Language**: [English](../Basic-Cli.md) | [Polski](../pl/Podstawowe-CLI.md) | [Deutsch](../de/Basis-CLI.md) | [Español](../es/CLI-Basico.md) | **Français** | [Português (Brasil)](../pt-br/CLI-Basico.md)

---

Vous préférez le clavier ? oXyFlow comprend un outil en ligne de commande ultra-rapide nommé **`oxy`** pour gérer votre temps depuis PowerShell, CMD ou le terminal Linux/macOS.

---

## Les 5 Commandes Indispensables

Au quotidien, 5 commandes simples suffisent :

### 1. Démarrer une Tâche

```bash
oxy start "Maquette Accueil"
```

Lance immédiatement le chronométrage.

- **Tolérant aux fautes de frappe** : Si vous tapez `oxy start Maquet`, l'outil vous propose : *"Vouliez-vous dire 'Maquette Accueil' ?"*.
- **Choix par numéro** : Si plusieurs tâches portent un nom similaire, tapez simplement `1` ou `2`.

---

### 2. Arrêter le Minuteur

```bash
oxy stop
```

Arrête la tâche active et enregistre la session.

---

### 3. Vérifier l'Activité en Cours

```bash
oxy status
```

Affiche la tâche actuellement active :

```text
● Actif : [Site Web Client] Maquette Accueil (01h 12m)
```

---

### 4. Bilan de la Journée

```bash
oxy today
```

Affiche un tableau complet de toutes les tâches effectuées aujourd'hui et le temps total accumulé.

---

### 5. Créer des Projets et des Tâches

```bash
# Ajouter un projet
oxy project add "Application Mobile"

# Ajouter une tâche dans ce projet
oxy task add "Écran de Connexion" --project "Application Mobile"
```
