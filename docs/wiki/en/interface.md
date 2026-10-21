# Interface and Themes

> Language / Język: **English** | [Polski](/pl/interface.md) | [Deutsch](/de/interface.md) | [Español](/es/interface.md) | [Français](/fr/interface.md) | [Português](/pt-br/interface.md)

---

The oXyFlow user interface is built on four decoupled visual dimensions: runtime environment, layout variant, scaling factor, and color theme.

---

## Layout Variants

The application adapts dynamically across three layout variants without altering business logic or state:

| Variant | Characteristics | Target Use Case |
| :--- | :--- | :--- |
| **Compact** | Floating minimalist widget containing timer controls, current task status, and mini search. | Secondary monitors, compact screen areas, and background work. |
| **Medium** | Two-column split view displaying project folders on the left and active task cards on the right. | Balanced daily productivity, task management, and project browsing. |
| **Full** | Comprehensive three-column desktop workspace integrating project trees, task lists, and report panels. | In-depth reporting, time audit logs, settings, and bulk task organization. |

Layout variants can be switched from the top navigation bar or under **Settings → Interface**.

---

## Typography and Icon Scaling

In addition to layout variants, oXyFlow supports three independent scaling tiers controlled strictly via CSS design tokens:

- **Small**: High-density display suited for power users managing large task hierarchies.
- **Medium**: Default balanced scale designed for standard desktop displays.
- **Large**: High-legibility scale for high-DPI screens or presentation modes.

Scaling adjusts font sizes, line heights, paddings, and icon dimensions uniformly without triggering component re-renders.

---

## Built-In Themes

oXyFlow provides three verified built-in themes managed by the `ThemeRegistry`:

| Theme ID | Display Name | Characteristics |
| :--- | :--- | :--- |
| `light` | Light (Warm Daylight) | Soft warm canvas (`#F4EFEA`) with dark charcoal typography (`#2C2421`). |
| `dark` | Dark (Midnight Slate) | Deep dark canvas (`#0B0F19`) with slate cards (`#0F172A`) and crisp foreground text. |
| `high-contrast` | High Contrast (Crisp Monochrome) | Pure black canvas (`#000000`) with pure white borders and typography (`#FFFFFF`) for maximum accessibility. |

Theme changes apply immediately by updating the `data-theme` attribute on `document.documentElement` and toggling the `.dark` class, avoiding component tree remounts.

---

## Design System Tokens

All interface components consume semantic design tokens rather than hardcoded hex values:

- Backgrounds: `bg-background`, `bg-card`, `bg-muted`
- Typography: `text-foreground`, `text-card-foreground`, `text-muted-foreground`
- Borders and Inputs: `border-border`, `border-input`
- Actions and Accents: `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-destructive`

---

## Custom Theme Registration

Plugins and custom integrations can register additional themes at runtime via the TypeScript API:

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
