# Documentation Technique oXyFlow

> Langue / Language: [English](/en/README.md) | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | [Español](/es/README.md) | **Français** | [Português](/pt-br/README.md)

---

oXyFlow est une application de suivi du temps et de gestion des tâches locale (local-first), disponible sous forme d'application de bureau native (Tauri v2, Rust, base SQLite) accompagnée d'un outil CLI (`oxy`), ainsi que sous forme **d'application Web et Progressive Web App (PWA)** hébergée directement sur GitHub Pages.

> 🚀 **Application Web en Direct** : Lancez oXyFlow immédiatement dans votre navigateur ou installez-la avec support hors ligne sur **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)**.

---

## Vue d'Ensemble de l'Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│         (Tailwind CSS, Base UI, Jetons Sémantiques)    │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼ (Environnement Bureau)            ▼ (Environnement Web / PWA)
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Tauri IPC (Commandes)    │     │      Stockage Navigateur    │
│  - Moteur Rust natif        │     │  - Plugin localStorage      │
│  - Base de données SQLite   │     │  - Service Worker PWA       │
│  - Sinks en temps réel      │     │  - Fonctionnement 100% hors │
└──────────────┬──────────────┘     └─────────────────────────────┘
               │ Pont CLI
┌──────────────▼──────────────┐
│  Binaire Natif CLI (`oxy`)  │
└─────────────────────────────┘
```

- **Stockage Local** : Sur le bureau, les données sont persistées dans SQLite (`oxytime.db`), et dans le navigateur dans le `localStorage` privé. Aucune télémétrie ni compte requis.
- **Triple Découplage (Triple Decoupling)** : Isolation absolue entre l'interface utilisateur, la logique métier du moteur et les pilotes de stockage.
- **Multiplateforme** : Application de bureau (Compact, Moyen, Complet), terminal synchronisé (`oxy`) et version Web/PWA instantanée.

---

## Structure de la Documentation

### Guide de l'Utilisateur

- **[Premiers Pas](getting-started.md)** : Accès Web, installation de bureau, configuration initiale et création de projets et tâches.
- **[Minuteur de Base](timer.md)** : Contrôle du minuteur, basculement atomique de tâche, correction des entrées et règles temporelles.
- **[CLI de Base (`oxy`)](cli.md)** : Syntaxe des commandes dans le terminal avec PowerShell, Bash ou Zsh.
- **[Interface et Thèmes](interface.md)** : Variantes de disposition, thèmes sémantiques intégrés et échelles visuelles.
- **[Foire Aux Questions (FAQ)](faq.md)** : Emplacements des fichiers de base de données, sauvegardes et fonctionnement hors ligne.

### Documentation Technique et Référence Développeur

- **[Scripts CLI Avancés](advanced-cli.md)** : Pipelines JSON, intégration aux invites de commandes et automatisation.
- **[Architecture Système](architecture.md)** : Cycle de vie du moteur Rust, tests AST et couche SQLite.
- **[Automatisation & Sinks](automation.md)** : Configuration des flux d'audit CSV et des webhooks HTTP.
- **[Compilation du Code](developer-build.md)** : Prérequis, chaîne d'outils Bun et commandes de compilation Cargo.

---

## Paquets Officiels et Déploiements

| Plateforme | Type de Paquet / Déploiement | Architecture Cible | Lien / Instructions |
| :--- | :--- | :--- | :--- |
| **Web & PWA** | Application Web (Sans installation) | Navigateurs Web Modernes | [Ouvrir l'application Web](https://beoarcha.github.io/TimeLog/app/) |
| **Windows** | Installateur Setup (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Windows** | Exécutable Portable (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **macOS** | Image Disque Universelle (`.dmg`) | Universel (Apple Silicon M1–M4 & Intel x86_64) | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux** | AppImage (`.AppImage`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (Debian / Ubuntu)** | Paquet DEB (`.deb`) | amd64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (RHEL / Fedora)** | Paquet RPM (`.rpm`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |

Les fichiers binaires et les sommes de contrôle cryptographiques (`SHA256SUMS.txt`) sont disponibles sur la [page des versions GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
