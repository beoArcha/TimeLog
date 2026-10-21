# 🎨 Interfejs i Motywy

> 🌐 **Język / Language**: [English](/en/interface.md) | **Polski** | [Deutsch](/de/Benutzeroberflaeche.md) | [Español](/es/Interfaz-y-Temas.md) | [Français](/fr/Interface-et-Themes.md) | [Português](/pt-br/Interface-e-Temas.md)

---

## Układy Okna (Layout Variants)

Interfejs oXyFlow dostosowuje się do trzech wariantów gęstości bez ingerencji w logikę biznesową:

1. **Kompaktowy (Compact)**: Pływający widget zajmujący minimalną przestrzeń na ekranie, idealny do pracy na drugim monitorze.
2. **Średni (Medium)**: Układ dwukolumnowy wyświetlający listę projektów i aktywne zadania obok siebie.
3. **Pełny (Full)**: Trzykolumnowy pulpit łączący nawigację projektów, drzewo zadań oraz widżety raportów.

Wariant układu można przełączać na górnym pasku narzędzi lub w **Opcje → Interfejs**.

---

## Semantyczne Motywy Kolorystyczne

Aplikacja oferuje 12 dopracowanych motywów opartych wyłącznie na tokenach projektowych CSS:

- **Motywy Ciemne**: Ciemny Łupek (Slate Dark), Neutralny Ciemny (Neutral Dark), Granatowy (Midnight Navy).
- **Motywy Jasne**: Czysty Dzień (Daylight), Ciepły Piasek (Warm Sand), Wysoki Kontrast (Crisp).
- **Palety Akcentujące**: Szmaragd (Emerald), Indygo (Indigo), Bursztyn (Amber), Różany (Rose).

Motywy są aplikowane dynamicznie poprzez atrybut `data-theme` na elemencie głównym dokumentu, bez konieczności ponownego montowania komponentów Reacta.
