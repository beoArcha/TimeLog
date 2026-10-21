# Interfaz y Temas

> Idioma / Language: [English](/en/interface.md) | [Polski](/pl/interface.md) | [Deutsch](/de/interface.md) | **Español** | [Français](/fr/interface.md) | [Português](/pt-br/interface.md)

---

La interfaz de usuario de oXyFlow se articula en torno a cuatro dimensiones visuales desacopladas: entorno de ejecución, variante de diseño, escala visual y tema de color.

---

## Variantes de Diseño

La aplicación se adapta dinámicamente a tres densidades de diseño sin alterar la lógica de negocio ni el estado:

| Variante | Características | Caso de Uso |
| :--- | :--- | :--- |
| **Compacto (Compact)** | Widget flotante minimalista con controles de temporizador, tarea activa y búsqueda rápida. | Monitores secundarios, pantallas reducidas y trabajo en segundo plano. |
| **Medio (Medium)** | Diseño en dos columnas que muestra carpetas de proyectos a la izquierda y tareas a la derecha. | Gestión diaria equilibrada de proyectos y tareas. |
| **Completo (Full)** | Espacio de trabajo de tres columnas con navegación de proyectos, árbol de tareas y paneles de informe. | Auditorías de tiempo detalladas, informes extensos y configuración. |

La variante de diseño se puede cambiar desde la barra de navegación superior o en **Ajustes → Interfaz**.

---

## Escala de Tipografía e Iconos

Además de las variantes de diseño, oXyFlow admite tres niveles de escala independientes controlados mediante tokens de diseño CSS:

- **Pequeño (Small)**: Mayor densidad de información, ideal para jerarquías extensas de tareas.
- **Medio (Medium)**: Escala equilibrada por defecto para monitores convencionales.
- **Grande (Large)**: Máxima legibilidad para monitores de alta resolución (HiDPI) o presentaciones.

---

## Temas Integrados

oXyFlow incluye tres temas integrados gestionados a través de `ThemeRegistry`:

| ID del Tema | Nombre | Características |
| :--- | :--- | :--- |
| `light` | Claro (Warm Daylight) | Fondo cálido suave (`#F4EFEA`) con tipografía carbón legible (`#2C2421`). |
| `dark` | Oscuro (Midnight Slate) | Fondo oscuro profundo (`#0B0F19`) con tarjetas pizarra (`#0F172A`) y texto nítido. |
| `high-contrast` | Alto Contraste (Monochrome) | Fondo negro puro (`#000000`) con bordes blancos puros (`#FFFFFF`) para máxima accesibilidad. |

El cambio de tema se aplica de inmediato modificando el atributo `data-theme` en `document.documentElement` sin reiniciar el árbol de componentes React.

---

## Tokens de Diseño Semánticos

Todos los componentes de la interfaz utilizan tokens de diseño CSS en lugar de colores hexadecimales fijos:

- Fondos: `bg-background`, `bg-card`, `bg-muted`
- Tipografía: `text-foreground`, `text-card-foreground`, `text-muted-foreground`
- Bordes y Campos: `border-border`, `border-input`
- Acciones y Acentos: `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-destructive`

---

## Registro de Temas Personalizados

Los plugins y extensiones pueden registrar temas adicionales en tiempo de ejecución utilizando la API de TypeScript:

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
