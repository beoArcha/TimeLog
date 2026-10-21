# 💻 Basic Terminal Commands (CLI)

🌐 **Language / Język**: **English** | [Polski](pl/Podstawowe-CLI.md) | [Deutsch](de/Basis-CLI.md) | [Español](es/CLI-Basico.md) | [Français](fr/CLI-de-Base.md) | [Português (Brasil)](pt-br/CLI-Basico.md)

---

Prefer using your keyboard? oXyFlow includes a fast command-line companion called **`oxy`**. You can start, switch, and stop your timers right from PowerShell, Windows Terminal, macOS Terminal, or Linux Bash!

---

## The 5 Everyday Commands

You only need to know 5 simple commands:

### 1. Start Working on a Task

```bash
oxy start "Homepage Redesign"
```

Starts tracking time on that task immediately.

- **Typo-tolerant**: If you type `oxy start Hompage`, it suggests: *"Did you mean 'Homepage Redesign'?"*.
- **Interactive choice**: If you have multiple tasks called "Meeting", `oxy` shows a numbered list so you can press `1` or `2`.

---

### 2. Stop Tracking

```bash
oxy stop
```

Stops whatever task is currently running and saves your session.

---

### 3. Check Current Status

```bash
oxy status
```

Shows what is running right now:

```text
● Active: [Client Website] Homepage Redesign (01h 12m)
```

If no timer is active, it simply reports `No active tasks`.

---

### 4. See Today's Work

```bash
oxy today
```

Prints a neat table of everything you worked on today, along with your total logged hours.

---

### 5. Quick Task & Project Creation

```bash
# Add a new project
oxy project add "Mobile App"

# Add a new task under that project
oxy task add "Push Notifications" --project "Mobile App"
```

---

## Tip: Quick Aliases

You can use single-letter shortcuts:

- `oxy s` $\to$ alias for `oxy status`
- `oxy today` $\to$ alias for `oxy summary`

> **Looking for advanced automation?**  
> If you write shell scripts, need machine-readable JSON, or want automatic webhook triggers, check out the **[Advanced CLI Scripting Guide](Advanced-Cli.md)**.
