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

## Two-Tier Project Form

The sidebar provides an adaptive two-tier project creation form with a compact primary row for rapid entry and an expandable options drawer:

### Primary Row (Tier 1)
- **Project Name**: Direct text input (pressing Enter creates the project immediately).
- **Curated Palette**: Ten default color swatches (`slate`, `rose`, `orange`, `amber`, `emerald`, `teal`, `blue`, `indigo`, `violet`, `fuchsia`).
- **Custom Color Picker (Paintbrush)**: The Paintbrush button at the end of the palette swatches opens an interactive color picker accepting any valid HEX color code (e.g. `#8B5CF6`).
- **More Options Toggle**: Chevron button (**More Options** / **Hide Options**) to expand or collapse the advanced drawer.
- **Add Project Button**: Primary confirmation button to create and persist the project.

### Advanced Drawer (Tier 2)
- **Emoji Icon Picker**: Popover selector to assign an emoji icon to the project.
- **Tag Suggestion Cloud**: Input field for comma-separated tags, accompanied by a dynamic suggestion cloud scanning existing project tags. Clicking any tag chip appends it directly without manual typing.
- **Project Description**: Optional notes and scope context for the project.
- **Allow Concurrency Toggle**: Controls whether multiple tasks under this project can run simultaneously with tasks in other projects.

---

## Project Lifecycle: Deletion vs Archival

To safeguard timesheet integrity and prevent accidental data loss:

- **Zero-Time Projects (`00:00:00`)**: Projects with no logged sessions and no active timer show a delete button (Trash2 icon). Deletion permanently removes the project and unlinked metadata from storage.
- **Projects With Logged Time (`> 00:00:00`)**: The core validation engine blocks deletion (`validate_project_deletion`). The user interface automatically replaces the delete icon with an **Archive** button. Archiving hides the project from active sidebars and selectors while preserving all historical sessions, tasks, and audit records in reports.

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
