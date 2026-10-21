# 🎨 Interface & Themes

> 🌐 **Language / Język**: **English** | [Polski](/pl/interfejs-i-motywy.md) | [Deutsch](/de/Benutzeroberflaeche.md) | [Español](/es/Interfaz-y-Temas.md) | [Français](/fr/Interface-et-Themes.md) | [Português](/pt-br/Interface-e-Temas.md)

---

## Layout Variants

The oXyFlow interface adapts across three distinct layout variants without altering business logic:

1. **Compact**: Floating desktop widget mode prioritizing minimal screen footprint, ideal for keeping visible on secondary displays.
2. **Medium**: Two-column layout displaying the project list and active task cards side-by-side.
3. **Full**: Three-column productivity view integrating project navigation, detailed task trees, and embedded report widgets.

Layout variants are selectable via the header toolbar or under **Settings → Interface**.

---

## Semantic Theming

oXyFlow features 12 curated visual themes constructed strictly with CSS design tokens (`--bg-background`, `--bg-card`, `--text-foreground`):

- **Dark Modes**: Slate Dark, Neutral Dark, Midnight Navy.
- **Light Modes**: Clean Daylight, Warm Sand, High-Contrast Crisp.
- **Accent Palettes**: Emerald (Productivity), Indigo (Focus), Amber (Energy), Rose (Vibrant).

Themes apply instantly via CSS attribute injection (`data-theme`) on the document root without triggering React component remounts.
