# Compilation du Code

> Langue / Language: [English](/en/developer-build.md) | [Polski](/pl/developer-build.md) | [Deutsch](/de/developer-build.md) | [Español](/es/developer-build.md) | **Français** | [Português](/pt-br/developer-build.md)

---

Instructions pour compiler, tester et développer oXyFlow localement sous Windows, macOS et Linux.

---

## Prérequis

- **Bun** : Environnement d'exécution JavaScript moderne (version $\ge$ 1.1). L'utilisation de npm, npx, yarn ou pnpm est strictement prohibée.
- **Rust et Cargo** : Chaîne d'outils stable (version $\ge$ 1.80) avec `clippy` et `rustfmt`.
- **Dépendances système (Linux uniquement)** :

  ```bash
  sudo apt install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

---

## Développement Local

```bash
# Cloner le dépôt
git clone https://github.com/beoArcha/TimeLog.git
cd TimeLog

# Installer les dépendances du frontend
bun install

# Lancer la prévisualisation dans le navigateur (utilise LocalStorage)
bun run dev

# Lancer l'application de bureau native avec rechargement à chaud (Tauri + moteur Rust)
bun run tauri:dev
```

---

## Commandes de Vérification et de Test

Exécutez les suites de tests requises avant toute soumission :

| Objectif | Commande |
| :--- | :--- |
| Tous les tests Vitest (unitaires, intégration et architecture) | `bun run test` |
| Exécuter un fichier de test isolé | `bun x vitest run tests/unit/path/to/file.test.ts` |
| Vérification des types TypeScript et ESLint | `bun run typecheck` et `bun run lint` |
| Tests unitaires, intégration et parité en Rust | `bun run test:rust` |
| Contrôles de style Clippy et formatage Rust | `bun run lint:rust` et `bun run fmt:rust:check` |
| Tests d'architecture et de règles en Rust | `bun run test:arch:rust` |
| Tests End-to-End (Playwright) | `bun run test:e2e` |
| Régénérer les liaisons TypeScript depuis les types Rust | `cargo test --manifest-path src-tauri/Cargo.toml --test export_bindings_when_testing` |
