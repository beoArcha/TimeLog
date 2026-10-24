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
| `--db <ruta>` | | Ruta explícita al archivo de base de datos SQLite (anula `OXY_DB_PATH`). |

---

## Ciclo de Vida del Temporizador

```bash
# Consultar el estado del temporizador activo
oxy status

# Iniciar el temporizador en una tarea (por ID, prefijo o nombre)
oxy start "Implementación de API"

# Detener la sesión activa
oxy stop

# Detener todos los temporizadores activos en todos los proyectos
oxy stop --all

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

# Consultar el informe para un rango de fechas y proyecto específico
oxy report --from 2026-10-01 --to 2026-10-31 -p "Portal de Clientes"

# Exportar datos de tiempo a HTML, CSV o JSON
oxy report export -f html -o ./informe.html
oxy report export -f csv -o ./informe.csv
oxy report export -f json -o ./informe.json
```

---

## Diagnóstico del Sistema y Gestión de Base de Datos

```bash
# Ejecutar verificación de estado del sistema e integridad de SQLite
oxy doctor

# Crear una copia de seguridad en línea de la base de datos SQLite
oxy db backup ./backups/oxytime-backup.db

# Restaurar la base de datos desde una instantánea de copia de seguridad
oxy db restore ./backups/oxytime-backup.db
```

---

## Máscaras de Acción y Macros

Las máscaras de acción permiten definir atajos de comandos reutilizables con sustitución posicional de argumentos (`$1`..`$9`):

```bash
# Definir un atajo personalizado con sustitución de argumentos
oxy mask set standup "start $1"

# Ejecutar el atajo directamente
oxy standup "Reunión Diaria"

# Listar las máscaras configuradas
oxy mask ls
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

---

## Envoltorio de Errores y Modo Máquina

Cuando un comando falla, `oxy` escribe información técnica estructurada en `stderr`.

En canalizaciones automatizadas con `--machine` (o `--json`), las solicitudes interactivas y los bloques de sugerencias para el usuario se suprimen. El error se emite como un envoltorio JSON determinista de una sola línea:

```json
{"code":"DOM_ENTITY_NOT_FOUND","message":"Task '104' was not found","operation":"start","subsystem":"domain"}
```

En modo interactivo de terminal (TTY), el envoltorio incluye un objeto `user` adicional con contexto legible en el idioma correspondiente, sugerencias de solución y recomendaciones "¿Quiso decir...?":

```json
{
  "code": "DOM_ENTITY_NOT_FOUND",
  "message": "Task '104' was not found",
  "operation": "start",
  "subsystem": "domain",
  "user": {
    "locale": "es",
    "message": "La tarea '104' no existe en el proyecto activo.",
    "suggestion": "¿Quiso decir la tarea '105' (Implementación OAuth)?",
    "remediation": "Ejecute 'oxy task ls' para ver las tareas disponibles."
  }
}
```

### Códigos de Error Semánticos

| Código de Error | Código de Salida | Descripción |
| :--- | :---: | :--- |
| `CLI_SYNTAX_UNKNOWN_COMMAND` | `2` | Comando o subcomando desconocido o no implementado. |
| `CLI_SYNTAX_INVALID_ARGS` | `2` | Argumentos faltantes o inválidos (ej. rutas vacías). |
| `DOM_ENTITY_NOT_FOUND` | `4` | El proyecto, tarea, registro de tiempo o alias no existe. |
| `ENG_OPERATION_FAILED` | `1` | Invariante de negocio fallida (ej. validación de nombre vacío). |
| `ENG_TIMER_ACTIVE` | `5` | Intento de iniciar temporizador cuando ya hay otro activo sin flag de forzar. |
| `ENG_TIMER_INACTIVE` | `5` | Intento de detener temporizador cuando no hay sesión activa. |
| `SNK_EXTERNAL_IO` | `1` | Fallo de destino externo (ruta inaccesible o prueba fallida). |
| `STO_SQLITE_CONSTRAINT` | `3` | Violación de restricción SQLite (clave única o foránea). |
| `STO_STORAGE_ERROR` | `3` | Fallo de bajo nivel de acceso a la base de datos o E/S. |

---

Para automatización con scripts de shell y flujos JSON, consulte **[Scripting CLI Avanzado](advanced-cli.md)**.
