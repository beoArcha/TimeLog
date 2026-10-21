# 💻 Comandos Básicos de Terminal (CLI)

🌐 **Idioma / Language**: [English](../Basic-Cli.md) | [Polski](../pl/Podstawowe-CLI.md) | [Deutsch](../de/Basis-CLI.md) | **Español** | [Français](../fr/CLI-de-Base.md) | [Português (Brasil)](../pt-br/CLI-Basico.md)

---

¿Prefieres usar el teclado? oXyFlow incluye una herramienta de consola llamada **`oxy`** para controlar tu tiempo desde PowerShell, CMD o la terminal de Linux/macOS.

---

## Los 5 Comandos Esenciales

Para el día a día solo necesitas conocer 5 comandos:

### 1. Iniciar una Tarea
```bash
oxy start "Diseño de Portada"
```
Inicia el temporizador de inmediato.
- **Tolerante a erratas**: Si escribes `oxy start Portad`, el programa te sugerirá: *"¿Quisiste decir 'Diseño de Portada'?"*.
- **Lista interactiva**: Si hay varias tareas con nombres parecidos, verás una lista para elegir con el teclado.

---

### 2. Detener el Temporizador
```bash
oxy stop
```
Detiene la tarea activa y guarda la sesión en el historial.

---

### 3. Consultar Estado Actual
```bash
oxy status
```
Muestra qué estás haciendo ahora mismo:
```text
● Activo: [Sitio Web de Cliente] Diseño de Portada (01h 12m)
```

---

### 4. Resumen de Hoy
```bash
oxy today
```
Muestra una tabla con todas las tareas trabajadas en el día y el total de horas.

---

### 5. Crear Proyectos y Tareas
```bash
# Crear proyecto
oxy project add "App Móvil"

# Crear tarea en el proyecto
oxy task add "Pantalla de Login" --project "App Móvil"
```
