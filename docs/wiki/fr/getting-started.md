# Premiers Pas

> Langue / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | **Français** | [Português](/pt-br/getting-started.md)

---

Ce guide vous accompagne dans l'accès à oXyFlow via le Web / PWA ou l'installation de l'application de bureau, la configuration de votre environnement et l'enregistrement de votre première session de travail.

---

## Application Web et PWA (Sans Installation)

Vous pouvez utiliser oXyFlow immédiatement sans télécharger de fichiers d'installation :

1. Rendez-vous sur **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)** dans n'importe quel navigateur moderne (Chrome, Edge, Firefox, Safari).
2. L'ensemble du minuteur et de vos données fonctionne et persiste à 100% localement dans le stockage privé de votre navigateur.
3. **Installation PWA** : Dans les navigateurs compatibles, cliquez sur **Installer l'application** dans la barre d'adresse pour installer oXyFlow en tant qu'application autonome fonctionnant hors ligne sur votre ordinateur ou votre smartphone.

---

## Installation de Bureau

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

1. Lancez **oXyFlow** (version de bureau ou Web).
2. Cliquez sur le bouton **"+ Nouveau Projet"** dans la barre latérale.
3. Saisissez le nom du projet (ex. `Portail Client`) et choisissez une couleur d'identification. Cliquez sur **Enregistrer**.
4. Au sein du projet créé, cliquez sur **"+ Ajouter une tâche"**. Renseignez le titre (ex. `Implémentation API`) et appuyez sur **Entrée**.

---

## Enregistrement du Temps

- Cliquez sur le bouton **Démarrer (▶)** à côté d'une tâche pour lancer le chronomètre.
- La barre d'état affiche la tâche en cours avec son temps écoulé en direct.
- Cliquez sur **Pause (⏸)** ou **Arrêter (■)** pour clôturer la session.
- Démarrer une autre tâche arrête automatiquement la session précédente dans une transaction atomique.

---

## Étapes Suivantes

- **[Minuteur de Base](timer.md)** : Ajustements manuels, règles de chevauchement et historique.
- **[CLI de Base (`oxy`)](cli.md)** : Gestion du minuteur depuis la console PowerShell ou Bash.
- **[Interface et Thèmes](interface.md)** : Personnalisation des densités d'affichage et thèmes.
