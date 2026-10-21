# Benutzeroberfläche und Designs

> Sprache / Language: [English](/en/interface.md) | [Polski](/pl/interface.md) | **Deutsch** | [Español](/es/interface.md) | [Français](/fr/interface.md) | [Português](/pt-br/interface.md)

---

Die Benutzeroberfläche von oXyFlow basiert auf vier voneinander entkoppelten visuellen Dimensionen: Laufzeitumgebung, Layout-Variante, Skalierungsfaktor und Farb-Theme.

---

## Layout-Varianten

Die Anwendung passt sich dynamisch an drei Layout-Dichten an, ohne dass Geschäftslogik oder Anwendungszustand verändert werden:

| Variante | Eigenschaften | Empfohlener Einsatz |
| :--- | :--- | :--- |
| **Kompakt (Compact)** | Schwebendes Mini-Widget mit Timer-Steuerung, aktuellem Aufgabenstatus und Schnellsuche. | Zweitmonitore, kompakte Arbeitsbereiche und Hintergrundbetrieb. |
| **Mittel (Medium)** | Zweispaltiges Layout mit Projektordnern links und Aufgabenkarten rechts. | Ausgewogene tägliche Zeiterfassung und Aufgabenverwaltung. |
| **Voll (Full)** | Dreispaltiger Desktop-Arbeitsplatz mit Projekthierarchie, Aufgabenlisten und Berichts-Panels. | Ausführliche Zeitaudits, Berichterstellung und Konfiguration. |

Die Layout-Variante kann über die obere Menüleiste oder unter **Einstellungen → Benutzeroberfläche** umgeschaltet werden.

---

## Skalierung von Typografie und Symbolen

Ergänzend zu den Layout-Varianten unterstützt oXyFlow drei unabhängige Skalierungsstufen über CSS-Design-Tokens:

- **Klein (Small)**: Hohe Informationsdichte für Power-User mit großen Aufgabenbäumen.
- **Mittel (Medium)**: Standardmäßige, ausgewogene Skalierung für reguläre Bildschirme.
- **Groß (Large)**: Erhöhte Lesbarkeit für hochauflösende Bildschirme (HiDPI) oder Präsentationsmodi.

---

## Integrierte Themes

oXyFlow stellt drei über die `ThemeRegistry` verwaltete Themes bereit:

| Theme-ID | Anzeigename | Eigenschaften |
| :--- | :--- | :--- |
| `light` | Hell (Warm Daylight) | Warmer Hintergrund (`#F4EFEA`) mit anthrazitfarbener Typografie (`#2C2421`). |
| `dark` | Dunkel (Midnight Slate) | Dunkler Hintergrund (`#0B0F19`) mit Schiefer-Karten (`#0F172A`) und klarem Text. |
| `high-contrast` | Hoher Kontrast (Monochrome) | Tiefes Schwarz (`#000000`) mit reinweißen Rändern (`#FFFFFF`) für maximale Barrierefreiheit. |

Themes werden direkt über das Attribut `data-theme` auf `document.documentElement` angewendet, ohne ein Neu-Rendern des React-Komponentenbaums auszulösen.

---

## Semantische Design-Tokens

Alle UI-Komponenten nutzen semantische Design-Tokens statt fester Hex-Farbcodes:

- Hintergründe: `bg-background`, `bg-card`, `bg-muted`
- Typografie: `text-foreground`, `text-card-foreground`, `text-muted-foreground`
- Ränder & Eingabefelder: `border-border`, `border-input`
- Aktionen & Akzente: `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-destructive`

---

## Benutzerdefinierte Themes registrieren

Plugins und Erweiterungen können zur Laufzeit zusätzliche Themes über die TypeScript-API registrieren:

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
