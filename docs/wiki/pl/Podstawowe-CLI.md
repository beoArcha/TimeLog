# 💻 Podstawowe CLI (`oxy`)

> 🌐 **Język / Language**: [English](/en/cli.md) | **Polski** | [Deutsch](/de/Basis-CLI.md) | [Español](/es/CLI-Basico.md) | [Français](/fr/CLI-de-Base.md) | [Português](/pt-br/CLI-Basico.md)

---

oXyFlow zawiera natywny program wiersza poleceń `oxy`, komunikujący się bezpośrednio z lokalną bazą danych SQLite.

---

## Podstawowe Polecenia

```bash
# Sprawdź stan aktywnego stopera
oxy status

# Uruchom pomiar czasu na zadaniu (według nazwy lub ID)
oxy start "Implementacja API"

# Zatrzymaj lub zapauzuj stoper
oxy stop

# Wyświetl listę projektów i zadań
oxy list
oxy list --tasks

# Wygeneruj podsumowanie bieżącego dnia
oxy today
```

---

## Kody Wyjścia Procesu

CLI zwraca precyzyjne kody wyjścia:

| Kod | Znaczenie |
| :--- | :--- |
| `0` | Sukces |
| `1` | Błąd biznesowy / naruszenie reguły |
| `2` | Błędna składnia polecenia |
| `3` | Błąd bazy danych SQLite |
| `4` | Nie znaleziono encji / wieloznaczność |
| `5` | Konflikt cyklu życia stopera |

Zaawansowane scenariusze skryptowe opisano w sekcji **[Zaawansowane CLI](zaawansowane-cli.md)**.
