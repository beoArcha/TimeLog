# Foire Aux Questions (FAQ)

> Langue / Language: [English](/en/faq.md) | [Polski](/pl/faq.md) | [Deutsch](/de/faq.md) | [Español](/es/faq.md) | **Français** | [Português](/pt-br/faq.md)

---

## 1. Où sont enregistrées mes données et mes sessions ?

Tous les temps enregistrés, projets, tâches et réglages sont stockés dans un fichier SQLite local nommé `oxytime.db`.

| Plateforme | Emplacement de Stockage |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.oxytime.oxyflow\oxytime.db` |
| **Linux** | `~/.local/share/com.oxytime.oxyflow/oxytime.db` |
| **macOS** | `~/Library/Application Support/com.oxytime.oxyflow/oxytime.db` |

En mode web (PWA), les données sont conservées dans le `localStorage` HTML5 au lieu d'un fichier SQLite physique (voir la question 7 pour les détails d'architecture).

---

## 2. oXyFlow nécessite-t-il une connexion Internet ?

**Non.** oXyFlow est conçu selon une architecture strictement locale (offline-first). Il ne comporte aucune dépendance cloud, balise de télémétrie ou système d'authentification externe. L'ensemble des calculs et requêtes s'exécute directement dans le moteur natif Rust.

---

## 3. Pourquoi Windows SmartScreen affiche-t-il un message lors du premier lancement ?

Windows SmartScreen avertit les utilisateurs lors du lancement d'applications récentes dépourvues de certificat commercial de signature EV (très onéreux). oXyFlow est un projet open-source sous licence Mozilla Public License 2.0 (MPL-2.0).

Pour continuer :

1. Cliquez sur **Informations complémentaires** dans la fenêtre SmartScreen.
2. Cliquez sur le bouton **Exécuter quand même**.
3. Vous pouvez vérifier l'intégrité du binaire grâce au fichier d'empreintes `SHA256SUMS.txt` sur GitHub Releases.

---

## 4. Que se passe-t-il si j'oublie d'arrêter le minuteur à la fin de ma journée ?

La session continue d'enregistrer jusqu'à ce qu'elle soit arrêtée, mise en pause ou basculée manuellement :

- Vous pouvez modifier l'heure de début ou de fin de n'importe quel enregistrement depuis la table **Entrées de Temps** ou la vue **Rapports**.
- Le moteur bloque les chevauchements temporels au sein d'un même projet (`TemporalOverlapDetected`) afin de maintenir l'exactitude de vos audits.

---

## 5. Comment sauvegarder et restaurer ma base de données ?

- **Sauvegarde Universelle JSON** : Dans **Paramètres → Sauvegardes** (carte **Sauvegarde de la base et de l'état**) :
  - **Exporter** : Cliquez sur **Exporter la sauvegarde JSON** (`data-testid="export-backup-btn"`) pour générer un instantané structuré (`OxyFlow_Backup_YYYY-MM-DD.json`) comprenant l'ensemble des projets, tâches, entrées de temps et paramètres.
  - **Restaurer / Importer** : Cliquez sur **Restaurer la sauvegarde JSON** (`data-testid="import-backup-btn"`) et sélectionnez un fichier `.json` exporté au préalable. Le moteur valide le schéma des données (`validateBackupPayload`) avant d'appliquer la restauration.
  - **Portabilité Multi-Environnement** : Le format JSON est universel. Vous pouvez exporter une sauvegarde depuis la PWA web et l'importer dans l'application de bureau, ou inversement.
- **Sauvegarde Physique SQLite (Bureau Uniquement)** : Sur l'application de bureau, copiez directement le fichier `oxytime.db` lorsque l'application est fermée ou utilisez les commandes SQLite :

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

Dans la PWA sur navigateur, les restrictions de sécurité empêchent l'accès direct au système de fichiers ; la sauvegarde universelle JSON constitue la méthode de référence pour sauvegarder et migrer les données.

---

## 6. Comment s'effectue la synchronisation entre l'interface et le CLI (`oxy`) ?

Le binaire CLI (`oxy`) opère directement sur le même fichier de base de données SQLite (`oxytime.db`). Dès qu'une action est exécutée depuis votre terminal, l'application de bureau actualise son affichage lors de la prochaine seconde du minuteur ou lors du focus de la fenêtre.

---

## 7. Quelles sont les différences de stockage entre l'application de bureau et la PWA web ?

oXyFlow s'appuie sur des moteurs de persistance adaptés à chaque contexte d'exécution :

- **Bureau (Tauri v2)** : Les données sont stockées dans un fichier de base de données SQLite local (`oxytime.db`) respectant les principes ACID, accessible pour les sauvegardes manuelles et la synchronisation avec le CLI.
- **Navigateur (PWA)** : Les données résident dans le `localStorage` du navigateur (`LocalStorage Engine`), isolé par domaine. Le bac à sable du navigateur interdisant tout accès direct au système de fichiers, aucun fichier `.sqlite` physique n'est généré ni exportable.
- **Avertissement sur le Cache du Navigateur** : Le nettoyage des données de navigation (suppression des cookies, vidage du stockage de site) ou l'usage du mode de navigation privée supprime définitivement tous les relevés de temps enregistrés.
- **Recommandation Pratique** : Lorsque vous utilisez oXyFlow dans un navigateur, effectuez des sauvegardes JSON régulières via **Paramètres → Sauvegardes → Exporter la sauvegarde JSON** afin de conserver vos relevés sur votre disque local.

