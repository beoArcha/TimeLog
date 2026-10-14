# Plan Usunięcia Etykiety 'Wybierz Projekt' i Optymalizacji Przewijania Zadań

Plan wdrożenia zmian uzgodnionych z użytkownikiem: usunięcie zbędnej i wprowadzającej w błąd kontrolki ("Wybierz projekt") w widoku średnim, likwidacja podwójnego zagnieżdżenia paska przewijania (scrolla) oraz zapewnienie maksymalnej przestrzeni i czytelności listy zadań.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Decyzje ustalone z użytkownikiem:

1. **Wskazana kontrolka (CSS selector: etykieta `Wybierz projekt`)**:
   - Całkowite usunięcie kontrolki `{tProject('SelectProject')}` ("Wybierz projekt") w widoku średnim (`isCondensed`).
   - Projekt jest już wybrany i widoczny w górnym selektorze oraz w tytule karty, więc etykieta wprowadzała w błąd i zajmowała cenny pionowy obszar ekranu.
2. **Optymalizacja widoczności i przewijania zadań**:
   - **Likwidacja podwójnego scrolla**: Usunięcie zagnieżdżonego `overflow-y-auto` z `#tasks-tree-container` w widoku średnim.
   - **Jeden płynny pasek przewijania**: Cały obszar zadań (`#tasks-main`) przewija się w jednym, naturalnym strumieniu z dedykowanym scrollem.
   - **Większa widoczność zadań**: Zmniejszenie zbędnych marginesów nagłówka karty (`padding-section` zamiast `padding-main` w trybie kompaktowym), dzięki czemu zadania pojawiają się od razu wyżej na ekranie bez konieczności niepotrzebnego przewijania.

---

## 1. Overview & Core Concept

### Istota problemu
1. **Myląca kontrolka**: Etykieta `span` z tekstem "WYBIERZ PROJEKT" (`SelectProject`) wyświetlała się nad nazwą już wybranego projektu, sugerując użytkownikowi, że projekt nie został jeszcze wybrany.
2. **Podwójny scroll**: W widoku średnim zarówno kontener `#tasks-main` w `MediumLayoutBuilder`, jak i `#tasks-tree-container` w `TaskListView` posiadały właściwość `overflow-y-auto`. Powodowało to powstawanie dwóch walczących ze sobą pasków przewijania, ucinanie widoku zadań i brak ergonomii.

### Rozwiązanie
- Usunięcie etykiety `SelectProject` z widoku średniego (`isCondensed`).
- W `TaskListView.tsx`: warunkowe wyłączenie wewnętrznego scrolla w trybie `isCondensed` (`isCondensed ? 'overflow-visible' : 'overflow-y-auto'`), aby lista zadań płynnie wypełniała główny obszar roboczy.
- Kompaktowe odstępy karty w trybie średnim, by lista zadań miała natychmiastową czytelność.

---

## 2. Technical Implementation Details

### Pliki objęte modyfikacjami:

1. **`src/features/tasks/components/ProjectHeaderCard.tsx`**:
   - Warunek na wyświetlanie etykiety `{tProject('SelectProject')}`: ukrycie w trybie `isCondensed` (`!isCondensed && (...)`).
   - Kompaktowy nagłówek karty zadań w trybie `isCondensed`: nazwa projektu, kropka koloru, czas trwania oraz formularz dodawania zadania w zwartej, ergonomicznej formie.

2. **`src/features/tasks/TaskListView.tsx`**:
   - W kontenerze `#tasks-tree-container`: zmiana z sztywnego `overflow-y-auto` na `isCondensed ? 'overflow-visible' : 'overflow-y-auto'`, eliminująca podwójny scrollbar.
   - W `#project-tasks-sheet`: zastosowanie `isCondensed ? 'p-3 sm:p-4 gap-3' : 'padding-main gap-main'`, co natychmiast uwalnia miejsce dla widoku zadań.

3. **`src/layouts/builders/MediumLayoutBuilder.tsx`**:
   - Upewnienie się, że `#tasks-main` jest jedynym, płynnym kontenerem przewijania zadań (`flex-1 min-h-0 overflow-y-auto pr-1`).

---

## 3. Verification & Testing Strategy

- **Testy jednostkowe**:
  - `npx vitest run tests/unit/features/tasks/ProjectHeaderCard.test.tsx`
  - `npx vitest run tests/unit/features/tasks/TaskListView.test.tsx`
  - `npx vitest run tests/unit/layouts/MediumLayoutBuilder.test.tsx`
- **Weryfikacja scrolla i widoczności**:
  - Potwierdzenie obecności jednego, płynnego paska przewijania w widoku średnim.
  - Sprawdzenie, że zadania są od razu widoczne w oknie bez ciasnoty i bez etykiety "Wybierz projekt".
- **Kompilacja i Linter**:
  - `compile_applet` – bezbłędny build produkcyjny.
  - `lint_applet` – brak błędów.
