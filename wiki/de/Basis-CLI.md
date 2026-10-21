# 💻 Grundlegende Terminal-Befehle (CLI)

🌐 **Sprache / Language**: [English](../Basic-Cli.md) | [Polski](../pl/Podstawowe-CLI.md) | **Deutsch** | [Español](../es/CLI-Basico.md) | [Français](../fr/CLI-de-Base.md) | [Português (Brasil)](../pt-br/CLI-Basico.md)

---

Arbeiten Sie gerne mit der Tastatur? oXyFlow enthält das schnelle Konsolen-Werkzeug **`oxy`**. Damit können Sie Ihre Zeiterfassung direkt über PowerShell, Terminal oder Bash steuern!

---

## Die 5 wichtigsten Befehle

Für den Alltag genügen fünf einfache Kommandos:

### 1. Aufgabe starten
```bash
oxy start "Startseite Entwurf"
```
Startet die Zeiterfassung für diese Aufgabe sofort.
- **Tippfehler-Korrektur**: Bei `oxy start Startse` schlägt das Programm vor: *"Meinten Sie 'Startseite Entwurf'?"*.
- **Auswahlliste**: Bei mehreren ähnlichen Aufgaben zeigt `oxy` eine nummerierte Liste an.

---

### 2. Timer anhalten
```bash
oxy stop
```
Beendet die aktive Aufgabe und speichert die erfasste Zeit.

---

### 3. Aktuellen Status prüfen
```bash
oxy status
```
Zeigt an, was gerade läuft:
```text
● Aktiv: [Kunden-Website] Startseite Entwurf (01h 12m)
```

---

### 4. Tagesübersicht abrufen
```bash
oxy today
```
Gibt eine übersichtliche Tabelle aller heute bearbeiteten Aufgaben und der Gesamtstunden aus.

---

### 5. Projekte & Aufgaben anlegen
```bash
# Neues Projekt anlegen
oxy project add "Mobile App"

# Neue Aufgabe im Projekt anlegen
oxy task add "Benutzer-Login" --project "Mobile App"
```
