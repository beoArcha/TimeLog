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

## Dwupoziomowy Formularz Projektu

Pasek boczny zawiera adaptacyjny, dwupoziomowy formularz tworzenia projektu z wierszem podstawowym oraz rozwijaną szufladą opcji zaawansowanych:

### Wiersz Podstawowy (Poziom 1)
- **Nazwa Projektu**: Pole tekstowe do natychmiastowego wpisania nazwy (naciśnięcie Enter od razu tworzy projekt).
- **Zdefiniowana Paleta**: Sześć gotowych próbek kolorów (`rose`, `teal`, `amber`, `violet`, `indigo`, `emerald`).
- **Wybór Niestandardowego Koloru (Paintbrush)**: Przycisk z ikoną Paintbrush (pędzel) na końcu palety otwiera próbnik kolorów obsługujący dowolny kod HEX (np. `#8B5CF6`).
- **Przełącznik Opcji Zaawansowanych**: Przycisk ze strzałką (**Więcej opcji** / **Ukryj opcje**) rozwijający i zwijający szufladę.
- **Przycisk Dodawania Projektu**: Przycisk zatwierdzający i zapisujący nowy projekt.

### Rozwijana Szuflada Opcji Zaawansowanych (Poziom 2)
- **Wybór Ikony Emoji**: Dedykowany selektor popover przypisujący ikonę emoji do projektu.
- **Chmura Sugestii Tagów**: Pole tagów rozdzielanych przecinkami z dynamiczną chmurą podpowiedzi skanującą istniejące projekty. Kliknięcie kafelka tagu dodaje go bezpośrednio do pola bez konieczności wpisywania.
- **Opis Projektu**: Opcjonalne pole tekstowe na notatki i zakres projektu.
- **Przełącznik Współbieżności**: Określa, czy zadania w ramach tego projektu mogą być uruchamiane jednocześnie z zadaniami z innych projektów.

---

## Cykl Życia Projektu: Usuwanie a Archiwizacja

W celu ochrony spójności ewidencji czasu pracy i zapobiegania utracie danych audytowych:

- **Projekty bez Zalogowanego Czasu (`00:00:00`)**: Projekty bez zarejestrowanych sesji i bez aktywnego stopera wyświetlają przycisk trwałego usunięcia (ikona Trash2). Usunięcie trwale kasuje projekt oraz niepowiązane metadane z bazy danych.
- **Projekty z Zalogowanym Czasem (`> 00:00:00`)**: Silnik walidacji blokuje usunięcie (`validate_project_deletion`). Interfejs automatycznie zastępuje ikonę kosza przyciskiem **Archiwizuj**. Archiwizacja ukrywa projekt na listach bocznych i w selektorach, zachowując wszystkie zarejestrowane wpisy, zadania i historię audytową w raportach.

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
