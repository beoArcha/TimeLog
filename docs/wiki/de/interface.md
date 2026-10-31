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

## Zweistufiges Projektformular

Die Seitenleiste enthält ein adaptives, zweistufiges Formular zur Projekterstellung mit einer kompakten Hauptzeile für die Schnelleingabe und einer ausklappbaren Optionsschublade:

### Hauptzeile (Stufe 1)
- **Projektname**: Textfeld zur direkten Eingabe (Drücken der Eingabetaste erstellt das Projekt sofort).
- **Farbpalette**: Zehn vordefinierte Farbmuster (`slate`, `rose`, `orange`, `amber`, `emerald`, `teal`, `blue`, `indigo`, `violet`, `fuchsia`).
- **Benutzerdefinierte Farbwahl (Paintbrush)**: Die Pinselschaltfläche (Paintbrush) am Ende der Palette öffnet eine Farbauswahl für beliebige HEX-Farbcodes (z. B. `#8B5CF6`).
- **Schaltfläche für Erweiterte Optionen**: Pfeilschaltfläche (**Mehr Optionen** / **Optionen ausblenden**) zum Ein- und Ausklappen der erweiterten Optionen.
- **Projekt Hinzufügen**: Primäre Schaltfläche zum Bestätigen und Speichern.

### Erweiterte Schublade (Stufe 2)
- **Emoji-Auswahl**: Popover-Menü zur Zuweisung eines Emoji-Icons für das Projekt.
- **Tag-Vorschlagswolke**: Eingabefeld für kommagetrennte Tags mit automatischer Vorschlagswolke aus bestehenden Projekten. Ein Klick auf einen Tag-Chip fügt diesen direkt in das Feld ein.
- **Projektbeschreibung**: Mehrzeiliges Textfeld für Notizen und Kontext.
- **Parallelitäts-Schalter**: Steuert, ob Aufgaben dieses Projekts gleichzeitig mit Aufgaben anderer Projekte ausgeführt werden dürfen.

---

## Projektlebenszyklus: Löschen vs. Archivieren

Um die Integrität der Zeiterfassung zu sichern und Datenverlust zu verhindern:

- **Projekte ohne Zeiteinträge (`00:00:00`)**: Projekte ohne erfasste Arbeitszeit und ohne aktiven Timer zeigen eine Löschschaltfläche (Trash2-Icon). Das Löschen entfernt das Projekt vollständig aus dem Speicher.
- **Projekte mit Zeiteinträgen (`> 00:00:00`)**: Die Validierungs-Engine blockiert das Löschen (`validate_project_deletion`). Die Oberfläche ersetzt das Lösch-Icon automatisch durch die Schaltfläche **Archivieren**. Das Archivieren blendet das Projekt aus den aktiven Seitenleisten und Auswahllisten aus, erhält jedoch alle erfassten Sitzungen, Aufgaben und Berichtsdaten.

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
