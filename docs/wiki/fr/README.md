# Documentation Technique oXyFlow

> Langue / Language: [English](/en/README.md) | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | [Español](/es/README.md) | **Français** | [Português](/pt-br/README.md)

---

oXyFlow est une application de bureau pour le suivi du temps de travail et la gestion des tâches, conçue avec Tauri v2, Rust et une base de données locale SQLite. Elle fonctionne de manière totalement locale (offline-first) et comprend un CLI de terminal synchronisé (`oxy`) pour l'automatisation en ligne de commande.

---

## Vue d'Ensemble de l'Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│         (Tailwind CSS, Base UI, Jetons Sémantiques)    │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Commandes)
┌───────────────────────────▼────────────────────────────┐
│                    Moteur de Référence Rust            │
│  - Cycle de vie du timer & règles de chevauchement     │
│  - Dépôts SQLite & migrations de schéma                │
│  - Sinks en temps réel (CSV & webhooks HTTP)           │
└───────────────────────────┬────────────────────────────┘
                            │ Pont CLI
┌───────────────────────────▼────────────────────────────┐
│                  Binaire Natif CLI (`oxy`)             │
└────────────────────────────────────────────────────────┘
```

- **Stockage Local** : Toutes les données sont enregistrées dans un fichier SQLite local (`oxytime.db`). Aucune dépendance au cloud, télémétrie ou authentification requise.
- **Triple Découplage (Triple Decoupling)** : Isolation absolue entre l'interface utilisateur, la logique métier du moteur et les pilotes de stockage.
- **Interfaces Doubles** : Application de bureau avec trois densités de disposition (Compact, Moyen, Complet) et terminal CLI synchronisé (`oxy`).

---

## Structure de la Documentation

### Guide de l'Utilisateur

- **[Premiers Pas](getting-started.md)** : Installation, configuration initiale et création de projets et tâches.
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

## Paquets Officiels

| Système d'Exploitation | Type de Paquet | Architecture Cible |
| :--- | :--- | :--- |
| **Windows** | Installateur Setup (`.exe`) | x86_64 |
| **Windows** | Exécutable Portable (`.exe`) | x86_64 |
| **macOS** | Image Disque Universelle (`.dmg`) | Universel (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | Paquet DEB (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | Paquet RPM (`.rpm`) | x86_64 |

Les fichiers binaires et les sommes de contrôle cryptographiques (`SHA256SUMS.txt`) sont disponibles sur la [page des versions GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
