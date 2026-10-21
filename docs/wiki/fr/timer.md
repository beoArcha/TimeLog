# Minuteur de Base et Suivi du Temps

> Langue / Language: [English](/en/timer.md) | [Polski](/pl/timer.md) | [Deutsch](/de/timer.md) | [Español](/es/timer.md) | **Français** | [Português](/pt-br/timer.md)

---

oXyFlow orchestre vos sessions de travail grâce à un moteur natif en Rust garantissant la précision temporelle et empêchant toute dérive d'horloge.

---

## Principes de Fonctionnement du Minuteur

- **Entrée Active Unique** : Une seule tâche peut enregistrer du temps à un instant donné. Démarrer une nouvelle tâche clôture la session précédente (`endTime`) et valide la transaction avant d'ouvrir la suivante.
- **Basculement Atomique (`switch`)** : Changer de tâche depuis l'interface ou via `oxy switch <id>` arrête le minuteur courant et lance le nouveau dans une transaction SQLite unique.
- **Horodatages UTC** : Tous les repères temporels sont enregistrés au format ISO 8601 UTC. La durée est déterminée de manière déterministe par la différence entre les deux horodatages.
- **Calcul en Direct sans Dérive** : L'interface calcule le temps écoulé en temps réel à partir de l'horloge système (`useLiveTaskElapsed`), évitant les erreurs cumulatives des compteurs `setInterval` en JavaScript lors de la mise en veille.

---

## Édition et Correction des Sessions

Vous pouvez examiner et modifier vos enregistrements depuis la table **Entrées de Temps** ou la vue **Rapports** :

1. Cliquez sur une entrée pour afficher l'éditeur de session.
2. Mettez à jour l'horodatage de début ou de fin.
3. Enregistrez les modifications. Le moteur recalcule la durée et met à jour les totaux du projet.

---

## Règle de Non-Chevauchement Temporel

Pour assurer une conformité d'audit rigoureuse, le moteur interdit tout chevauchement entre sessions (`TemporalOverlapDetected`) :

- Deux entrées de temps rattachées au même projet ne peuvent pas se recouvrir.
- Si une modification entre en conflit avec une session existante, l'application rejette l'opération et invite à corriger l'intervalle.

---

## Rapports et Exportation des Données

Le module de rapports regroupe les données par jour, semaine et mois :

- **Hiérarchie de Projets** : Décomposition par projets, tâches et sous-tâches.
- **Formats d'Exportation** : Export direct vers **HTML** (fiche imprimable), **CSV** (pour tableurs) et **JSON** (pour intégrations de données).
