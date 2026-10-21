# Uso del Temporizador y Registro de Tiempo

> Idioma / Language: [English](/en/timer.md) | [Polski](/pl/timer.md) | [Deutsch](/de/timer.md) | **Español** | [Français](/fr/timer.md) | [Português](/pt-br/timer.md)

---

oXyFlow gestiona las sesiones de tiempo mediante un motor nativo en Rust que garantiza la integridad temporal y elimina las desviaciones de reloj.

---

## Principios de Funcionamiento del Temporizador

- **Único Registro Activo**: Solo puede haber una tarea activa registrando tiempo a la vez. Iniciar una nueva tarea finaliza la sesión en curso (`endTime`) y guarda el registro antes de abrir la siguiente sesión.
- **Cambio Atómico (`switch`)**: Cambiar de tarea en la interfaz o mediante `oxy switch <id>` detiene el temporizador anterior y activa el nuevo en una única transacción de SQLite.
- **Marcas de Tiempo UTC**: Todas las marcas temporales se guardan en formato ISO 8601 UTC. La duración se calcula de forma determinista mediante la diferencia entre marcas.
- **Cálculo en Vivo sin Desviación**: La interfaz calcula el tiempo transcurrido directamente sobre el reloj del sistema (`useLiveTaskElapsed`) en lugar de acumuladores `setInterval` de JavaScript, evitando desfases por suspensión del equipo.

---

## Modificación y Corrección de Registros

Puede revisar y ajustar las sesiones registradas desde la tabla **Registros de Tiempo** o la vista de **Informes**:

1. Haga clic en un registro para abrir el editor de sesión.
2. Modifique la marca de tiempo de inicio o finalización.
3. Guarde los cambios. El motor recalculará la duración y actualizará las métricas del proyecto.

---

## Validación de Solapamientos Temporales

Para asegurar el cumplimiento de auditorías estrictas, el motor prohíbe el solapamiento temporal de registros (`TemporalOverlapDetected`):

- Dos registros de tiempo del mismo proyecto no pueden compartir intervalos superpuestos.
- Si una modificación colisiona con otra sesión existente, el editor devolverá un error y solicitará corregir el rango.

---

## Informes y Exportación de Datos

El módulo de informes agrega datos de forma diaria, semanal y mensual:

- **Desglose de Proyectos**: Visualización agrupada por proyectos, tareas y subtareas.
- **Formatos de Exportación**: Exportación directa a **HTML** (listo para imprimir), **CSV** (para hojas de cálculo) y **JSON** (para automatización).
