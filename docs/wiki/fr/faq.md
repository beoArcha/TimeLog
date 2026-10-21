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

En mode web, les données sont persistées dans le `localStorage` HTML5 sous des clés préfixées.

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

- **Sauvegardes automatiques** : oXyFlow propose des mécanismes dédiés sous **Paramètres → Base de données & Sauvegardes**.
- **Sauvegarde manuelle** : Copiez le fichier `oxytime.db` lorsque l'application est fermée ou utilisez les outils en ligne de commande SQLite :

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

---

## 6. Comment s'effectue la synchronisation entre l'interface et le CLI (`oxy`) ?

Le binaire CLI (`oxy`) opère directement sur le même fichier de base de données SQLite (`oxytime.db`). Dès qu'une action est exécutée depuis votre terminal, l'application de bureau actualise son affichage lors de la prochaine seconde du minuteur ou lors du focus de la fenêtre.
