# Interface et Thèmes

> Langue / Language: [English](/en/interface.md) | [Polski](/pl/interface.md) | [Deutsch](/de/interface.md) | [Español](/es/interface.md) | **Français** | [Português](/pt-br/interface.md)

---

L'interface utilisateur d'oXyFlow s'articule autour de quatre dimensions visuelles indépendantes : environnement d'exécution, variante de disposition, échelle visuelle et thème graphique.

---

## Variantes de Disposition

L'application s'adapte de manière fluide entre trois densités d'affichage, sans altérer l'état ni la logique métier :

| Variante | Caractéristiques | Cas d'Utilisation |
| :--- | :--- | :--- |
| **Compact (Compact)** | Widget flottant épuré regroupant minuteur, tâche en cours et recherche rapide. | Écrans secondaires, petits espaces et surveillance discrète. |
| **Moyen (Medium)** | Disposition à deux colonnes présentant les projets à gauche et les cartes de tâches à droite. | Productivité courante et suivi équilibré des projets. |
| **Complet (Full)** | Environnement à trois colonnes avec navigation arborescente, listes de tâches et rapports intégrés. | Audits temporels détaillés, bilans périodiques et administration. |

La disposition se modifie via la barre supérieure ou dans **Paramètres → Interface**.

---

## Échelle Typographique et des Icônes

En complément des dispositions, oXyFlow propose trois paliers de mise à l'échelle gérés par des jetons CSS :

- **Petit (Small)** : Densité maximale, adaptée aux grandes hiérarchies de tâches.
- **Moyen (Medium)** : Échelle standard équilibrée pour moniteurs classiques.
- **Grand (Large)** : Lisibilité accrue pour moniteurs très haute définition (HiDPI) ou présentations.

---

## Thèmes Intégrés

oXyFlow intègre trois thèmes officiels gérés par le `ThemeRegistry` :

| Identifiant | Nom | Caractéristiques |
| :--- | :--- | :--- |
| `light` | Clair (Warm Daylight) | Toile douce et chaleureuse (`#F4EFEA`) avec une typographie anthracite (`#2C2421`). |
| `dark` | Sombre (Midnight Slate) | Fond sombre profond (`#0B0F19`) avec cartes ardoise (`#0F172A`) et texte lumineux. |
| `high-contrast` | Contraste Élevé (Monochrome) | Noir absolu (`#000000`) et bordures d'un blanc pur (`#FFFFFF`) pour une accessibilité maximale. |

L'application d'un thème est immédiate en actualisant l'attribut `data-theme` sur `document.documentElement`, sans réinitialiser les composants React.

---

## Jetons de Conception Sémantiques

Tous les composants exploitent des jetons de conception CSS standardisés au lieu de codes hexadécimaux figés :

- Arrière-plans : `bg-background`, `bg-card`, `bg-muted`
- Typographie : `text-foreground`, `text-card-foreground`, `text-muted-foreground`
- Bordures & Champs : `border-border`, `border-input`
- Actions & Accents : `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-destructive`

---

## Enregistrement de Thèmes Personnalisés

Les extensions et intégrations tierces peuvent déclarer de nouveaux thèmes à l'exécution avec l'API TypeScript :

```typescript
import { ThemeRegistry } from '@/styles/themeRegistry';

ThemeRegistry.getInstance().register({
  id: 'custom-solarized',
  displayNameKey: 'ThemeSolarizedLabel',
  iconName: 'Sun',
  isDark: true,
  tokens: {
    background: '#002b36',
    foreground: '#839496',
    card: '#073642',
    cardForeground: '#93a1a1',
    border: '#586e75',
    input: '#586e75',
    primary: '#268bd2',
    primaryForeground: '#fdf6e3',
    secondary: '#073642',
    secondaryForeground: '#839496',
    accent: '#2aa198',
    accentForeground: '#fdf6e3',
    destructive: '#dc322f',
    destructiveForeground: '#ffffff',
    ring: '#b58900',
    muted: '#073642',
    mutedForeground: '#657b83',
  },
});
```
