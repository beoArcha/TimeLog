# Architecture Système et Ingénierie

> Langue / Language: [English](/en/architecture.md) | [Polski](/pl/architecture.md) | [Deutsch](/de/architecture.md) | [Español](/es/architecture.md) | **Français** | [Português](/pt-br/architecture.md)

---

oXyFlow applique une Clean Architecture avec une stricte séparation des couches, contrôlée par des suites de tests d'architecture AST dans le frontend TypeScript (`tests/architecture/`) et le backend Rust (`src-tauri/tests/architecture/`).

---

## Topologie Architecturale Globale

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Presentation UI                        │
│          (Jetons Tailwind CSS, hooks orchestrateurs déclaratifs)       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌────────────────────┐
│     EngineRouter      │                           │ PersistenceRouter  │
│  (IRouter<IEngine>)   │                           │(IRouter<IPersist>) │
└──────────┬────────────┘                           └─────────┬──────────┘
           │                                                  │
           ├──────────────────────────────┬───────────────────┤
           ▼                              ▼                   ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────┐
│       Tauri Desktop IPC     │  │       Plugin Runtime Navigateur       │
│  (Pont IPC vers moteur Rust)│  │  (EnginePlugin + PersistencePlugin)   │
└──────────┬──────────────────┘  └───────────────────────────────────────┘
           ▼
┌─────────────────────────────┐
│    Moteur de Référence Rust │
│  - Cycle de vie du timer    │
│  - Métriques temporelles    │
│  - Invariantes de domaine   │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ Couche Persistance SQLite   │
│  - Dépôts Rusqlite          │
│  - Mode WAL & transactions  │
└─────────────────────────────┘
```

---

## Invariantes Architecturales Clés

### 1. La Règle du Triple Découplage (Triple Decoupling)

1. **Découplage de la Localisation** : Les composants ne vérifient jamais les libellés traduits. Les assertions d'interface s'appuient uniquement sur `data-testid` ou les rôles ARIA.
2. **Découplage des Thèmes et du CSS** : Les styles emploient des jetons sémantiques (`bg-card`, `text-foreground`). Les composants ne contiennent aucune condition du type `resolvedTheme === 'dark'` ni code couleur hexadécimal en dur.
3. **Découplage des Effets de Runtime** : Les composants React partagés n'appellent jamais `window.__TAURI__` directement. Tous les flux passent par des routeurs polymorphes (`EngineRouter`, `PersistenceRouter`).

### 2. Parité Multi-Environnements du Moteur

La logique métier centrale (changements d'état du minuteur, calculs de durée à minuit et règles de validation) est dupliquée dans deux moteurs synchrones :

- **Moteur de Référence en Rust** (`src-tauri/src/engine/`) : Performance compilée maximale pour le bureau.
- **Plugin de Moteur Web** (`src/plugins/engine/`) : Implémentation TypeScript garantissant un comportement strictement identique dans le navigateur.

Une suite de tests de parité (`CrossRuntimeParity.test.ts`) garantit l'alignement permanent des deux environnements.

### 3. Règle des 2 Conditions If Imbriquées Maximum (Rule of 3 Ifs)

Dans l'ensemble du projet (TypeScript comme Rust), la profondeur d'imbrication des instructions `if` ne doit pas excéder 2. Tout bloc conditionnel imbriqué 3 fois ou plus entraîne l'échec automatique des tests d'architecture (`max-nested-ifs.arch.test.ts` et `max_nested_ifs_test.rs`).

### 4. Isolation du CLI Sans Affichage

Le binaire `oxy` (`src-tauri/src/cli/`) communique exclusivement avec les contrats `Engine` et `Persistence`. Il lui est rigoureusement interdit d'importer des éléments d'interface Tauri (`AppState`, `tauri::AppHandle`, gestionnaires de fenêtres ou de barre des tâches).

### 5. Encapsulation des Couches et Contrat d'Erreurs

oXyFlow applique une propagation d'erreurs unidirectionnelle et strictement typée à travers toutes les frontières architecturales :

```text
Dépôts / Repositories (RepositoryError)
         │
         ▼
Couche de Persistance (PersistenceError)
         │
         ├───────────────────────────────┐
         ▼                               ▼
Commandes Tauri IPC (AppError)   CLI Natif (CliError)
         │                               │
         ▼                               ▼
Frontend (codes texte : "DOM_*") Terminal / CI (enveloppe JSON et code de sortie)
```

1. **Encapsulation Stricte des Dépôts** : Les erreurs de base de données et SQL de bas niveau (`RepositoryError`) sont strictement converties en erreurs de persistance de domaine (`PersistenceError`). Les types de dépôts bruts ne franchissent jamais les gestionnaires de commandes Tauri IPC ou les modules CLI.
2. **Énumérations d'Erreurs Typées** : Chaque couche définit sa propre énumération via `thiserror` avec des variantes structurées. L'utilisation de chaînes génériques (`String`), de `Box<dyn Error>` ou de `anyhow::Error` est interdite.
3. **Mappage Déterministe des Erreurs** : Les défaillances de domaine sont associées à des codes standardisés en majuscules (`DOM_*`, `ENG_*`, `STO_*`, `SNK_*`, `CLI_SYNTAX_*`) et des codes de sortie POSIX déterministes (`0`–`5`).
