# CLI Básico (oxy)

> Idioma / Language: [English](/en/cli.md) | [Polski](/pl/cli.md) | [Deutsch](/de/cli.md) | **Español** | [Français](/fr/cli.md) | [Português](/pt-br/cli.md)

---

oXyFlow incluye una herramienta nativa para terminal llamada `oxy`, que se comunica directamente con la base de datos local SQLite (`oxytime.db`). Funciona de manera autónoma sin necesidad de abrir la ventana gráfica, ideal para entornos de servidor, scripts de shell y pipelines de CI/CD.

---

## Flags Globales

El binario `oxy` acepta flags globales para controlar la salida y el nivel de detalle:

| Flag | Corto | Descripción |
| :--- | :--- | :--- |
| `--json` | `-j` | Emite JSON estructurado sin formato en `stdout`. |
| `--machine` | `-m` | Emite JSON en una sola línea suprimiendo las solicitudes interactivas. |
| `--quiet` | `-q` | Silencia mensajes informativos y encabezados de tabla. |

---

## Ciclo de Vida del Temporizador

```bash
# Consultar el estado del temporizador activo
oxy status

# Iniciar el temporizador en una tarea (por ID, prefijo o nombre)
oxy start "Implementación de API"

# Detener la sesión activa
oxy stop

# Cambiar de forma atómica a otra tarea en un solo paso
oxy switch "Corrección de Interfaz"

# Mostrar un resumen del tiempo registrado hoy
oxy today
```

---

## Gestión de Proyectos y Tareas

```bash
# Listar todos los proyectos activos
oxy project ls

# Crear un nuevo proyecto con color opcional
oxy project add "Portal de Clientes" -c "#3b82f6"

# Listar tareas de todos los proyectos
oxy task ls

# Listar tareas filtradas por proyecto
oxy task ls -p "Portal de Clientes"

# Crear una nueva tarea dentro de un proyecto
oxy task add "Diseñar flujo OAuth" -p "Portal de Clientes"

# Marcar una tarea como completada
oxy task done "Diseñar flujo OAuth"

# Archivar una tarea
oxy task rm "Diseñar flujo OAuth"
```

---

## Generación de Informes y Exportación

```bash
# Mostrar un árbol Unicode jerárquico de las tareas de hoy
oxy report --tree --today

# Mostrar el informe de la semana actual
oxy report --tree --week

# Exportar datos de tiempo a HTML, CSV o JSON
oxy report export -f html -o ./informe.html
oxy report export -f csv -o ./informe.csv
oxy report export -f json -o ./informe.json
```

---

## Códigos de Salida

Todos los comandos de `oxy` devuelven códigos de salida POSIX deterministas:

| Código | Significado | Descripción |
| :--- | :--- | :--- |
| `0` | Éxito | Comando ejecutado correctamente. |
| `1` | Error general | Violación de regla de negocio o invariante. |
| `2` | Error de sintaxis | Comando inválido, argumento ausente o flag desconocido. |
| `3` | Error de almacenamiento | Fallo de lectura/escritura en la base SQLite. |
| `4` | Error de entidad | Entidad no encontrada o coincidencia ambigua. |
| `5` | Error de motor | Conflicto de ciclo de vida del temporizador. |

Para automatización con scripts de shell y flujos JSON, consulte **[Scripting CLI Avanzado](advanced-cli.md)**.
