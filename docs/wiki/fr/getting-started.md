# Premiers Pas

> Langue / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | **Français** | [Português](/pt-br/getting-started.md)

---

Ce guide vous accompagne dans l'installation d'oXyFlow, la configuration de votre environnement et l'enregistrement de votre première session de travail.

---

## Installation

Téléchargez le paquet correspondant à votre système d'exploitation depuis la [page des versions GitHub](https://github.com/beoArcha/TimeLog/releases/latest) :

- **Windows** : Exécutez l'installateur `OxyFlow-Setup-x64.exe` ou utilisez la version portable `OxyFlow-Standalone-x64.exe`.
- **macOS** : Ouvrez l'image disque `OxyFlow-Universal.dmg` et déposez `OxyFlow.app` dans le dossier `/Applications`.
- **Linux** : Attribuez les droits d'exécution au fichier `OxyFlow-x86_64.AppImage` (`chmod +x OxyFlow-x86_64.AppImage`) ou installez le paquet `.deb` / `.rpm` :

  ```bash
  sudo dpkg -i oxyflow_amd64.deb
  # ou sous Fedora/RHEL :
  sudo rpm -i oxyflow.x86_64.rpm
  ```

---

## Configuration du CLI (Optionnel)

Les paquets de bureau configurent également l'exécutable CLI nommé `oxy`. Pour utiliser `oxy` directement dans votre terminal (PowerShell, Bash, Zsh), vérifiez que le dossier d'installation figure dans votre variable d'environnement `PATH` :

- **Windows** : `%LOCALAPPDATA%\Programs\oXyFlow\`
- **Linux / macOS** : `/usr/local/bin/` ou `~/.local/bin/`

Vérifiez la disponibilité dans votre terminal :

```bash
oxy --version
```

---

## Créer un Projet et une Tâche

1. Lancez **oXyFlow**.
2. Cliquez sur le bouton **"+ Nouveau Projet"** dans la barre latérale.
3. Saisissez le nom du projet (ex. `Portail Client`) et choisissez une couleur d'identification. Cliquez sur **Enregistrer**.
4. Au sein du projet créé, cliquez sur **"+ Ajouter une tâche"**. Renseignez le titre (ex. `Implémentation API`) et appuyez sur **Entrée**.

---

## Suivre le Temps

- Cliquez sur le bouton **Démarrer (▶)** à côté de la tâche pour lancer le minuteur immédiatement.
- La barre supérieure met en surbrillance la tâche active et affiche le temps écoulé en direct.
- Cliquez sur **Arrêter (■)** pour clore la session actuelle.
- Cliquer sur Démarrer sur une autre tâche interrompt immédiatement la tâche en cours et lance la nouvelle dans une seule transaction atomique (`switch`).

---

## Étapes Suivantes

- **[Minuteur de Base](timer.md)** : Règles de non-chevauchement, ajustement des entrées et totaux.
- **[CLI de Base (`oxy`)](cli.md)** : Contrôle en ligne de commande.
- **[Interface et Thèmes](interface.md)** : Personnalisation des dispositions et des styles.
