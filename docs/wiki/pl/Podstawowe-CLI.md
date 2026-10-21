# 💻 Podstawowe Polecenia w Terminalu (CLI)

🌐 **Język / Language**: [English](../Basic-Cli.md) | **Polski** | [Deutsch](../de/Basis-CLI.md) | [Español](../es/CLI-Basico.md) | [Français](../fr/CLI-de-Base.md) | [Português (Brasil)](../pt-br/CLI-Basico.md)

---

Wolisz korzystać z klawiatury? Do oXyFlow dołączone jest szybkie narzędzie wiersza poleceń o nazwie **`oxy`**. Możesz uruchamiać i zatrzymywać stoper bezpośrednio z PowerShell, CMD lub terminala Linux/macOS bez sięgania po myszkę!

---

## 5 Podstawowych Poleceń

W codziennej pracy wystarczy zapamiętać 5 prostych komend:

### 1. Rozpoczęcie Pracy nad Zadaniem

```bash
oxy start "Projekt Makiety Głównej"
```

Natychmiast uruchamia stoper dla danego zadania.

- **Odporne na literówki**: Jeśli wpiszesz `oxy start Makiet`, program sam podpowie: *"Czy chodziło o 'Projekt Makiety Głównej'?"*.
- **Wybór z listy**: Jeśli masz kilka zadań o podobnej nazwie, `oxy` wyświetli ponumerowaną listę i poprosi o naciśnięcie `1` lub `2`.

---

### 2. Zatrzymanie Stopera

```bash
oxy stop
```

Zatrzymuje aktualnie biegnące zadanie i zapisuje czas w historii.

---

### 3. Sprawdzenie Co Teraz Robisz

```bash
oxy status
```

Wyświetla aktualny stan:

```text
● Aktywne: [Nowa Strona WWW] Projekt Makiety Głównej (01h 12m)
```

Jeśli żaden stoper nie jest włączony, otrzymasz komunikat o braku aktywnych zadań.

---

### 4. Podsumowanie Dzisiejszego Dnia

```bash
oxy today
```

Wyświetla czytelną tabelę z wszystkimi zadaniami, nad którymi pracowałeś dzisiaj, oraz łączną liczbę przepracowanych godzin.

---

### 5. Szybkie Dodawanie Projektów i Zadań

```bash
# Dodanie nowego projektu
oxy project add "Aplikacja Mobilna"

# Dodanie zadania w tym projekcie
oxy task add "Logowanie Użytkowników" --project "Aplikacja Mobilna"
```

---

## Przydatne Skróty

Możesz stosować skrócone formy:

- `oxy s` $\to$ skrót od `oxy status`
- `oxy today` $\to$ skrót od `oxy summary`
