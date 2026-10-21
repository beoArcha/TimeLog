# Interfejs i Motywy

> Język / Language: [English](/en/interface.md) | **Polski** | [Deutsch](/de/interface.md) | [Español](/es/interface.md) | [Français](/fr/interface.md) | [Português](/pt-br/interface.md)

---

Interfejs użytkownika oXyFlow opiera się na czterech odseparowanych wymiarach wizualnych: środowisku uruchomieniowym, wariancie układu, skali interfejsu oraz motywie kolorystycznym.

---

## Warianty Układu Okna

Aplikacja dynamicznie dostosowuje się do trzech wariantów układu bez zmiany logiki biznesowej ani stanu:

| Wariant | Charakterystyka | Zastosowanie |
| :--- | :--- | :--- |
| **Kompaktowy (Compact)** | Pływający minimalistyczny widżet ze stoperem, statusem zadania i podręczną wyszukiwarką. | Praca w tle, dodatkowe monitory i niewielkie ekrany. |
| **Średni (Medium)** | Układ dwukolumnowy prezentujący listę projektów po lewej i kafelki zadań po prawej. | Codzienna zrównoważona praca i obsługa projektów. |
| **Pełny (Full)** | Trzykolumnowy pulpit łączący nawigację projektów, drzewa zadań i panele raportów. | Szczegółowe raportowanie, audyt wpisów i konfiguracja. |

Wariant układu można przełączać z poziomu górnego paska narzędzi lub w zakładce **Ustawienia → Interfejs**.

---

## Skalowanie Typografii i Ikon

Poza układem okna oXyFlow obsługuje trzy niezależne poziomy skalowania kontrolowane za pomocą tokenów CSS:

- **Mały (Small)**: Zwiększona gęstość informacji, polecana przy rozbudowanych drzewach zadań.
- **Średni (Medium)**: Domyślna, zbalansowana skala dla standardowych monitorów desktopowych.
- **Duży (Large)**: Zwiększona czytelność dla ekranów o wysokiej gęstości pikseli (HiDPI) lub trybu prezentacji.

---

## Wbudowane Motywy Kolorystyczne

oXyFlow oferuje trzy zweryfikowane motywy zarządzane przez `ThemeRegistry`:

| Identyfikator | Nazwa Wyświetlana | Charakterystyka |
| :--- | :--- | :--- |
| `light` | Jasny (Warm Daylight) | Ciepłe tło (`#F4EFEA`) z czytelną typografią w kolorze ciemnego węgla (`#2C2421`). |
| `dark` | Ciemny (Midnight Slate) | Głębokie tło (`#0B0F19`) z łupkowymi kartami (`#0F172A`) i jasnym tekstem. |
| `high-contrast` | Wysoki Kontrast (Monochrome) | Czysta czerń (`#000000`) z białymi obramowaniami (`#FFFFFF`) dla maksymalnej dostępności. |

Zmiana motywu aplikuje się natychmiastowo poprzez atrybut `data-theme` na elemencie `document.documentElement`, bez przeładowywania drzewa komponentów Reacta.

---

## Semantyczne Tokeny Projektowe

Wszystkie komponenty interfejsu korzystają ze standaryzowanych tokenów projektowych CSS zamiast sztywnych wartości szesnastkowych:

- Tła: `bg-background`, `bg-card`, `bg-muted`
- Typografia: `text-foreground`, `text-card-foreground`, `text-muted-foreground`
- Obramowania i Pola: `border-border`, `border-input`
- Akcje i Akcenty: `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-destructive`

---

## Rejestracja Niestandardowych Motywów

Wtyczki i rozszerzenia mogą rejestrować dodatkowe motywy w czasie wykonywania programu przy użyciu interfejsu TypeScript:

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
