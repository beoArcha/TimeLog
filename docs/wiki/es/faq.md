# Preguntas Frecuentes (FAQ)

> Idioma / Language: [English](/en/faq.md) | [Polski](/pl/faq.md) | [Deutsch](/de/faq.md) | **Español** | [Français](/fr/faq.md) | [Português](/pt-br/faq.md)

---

## 1. ¿Dónde se guardan mis datos y registros de tiempo?

Todos los registros de tiempo, proyectos, tareas y configuraciones se almacenan en un archivo local SQLite denominado `oxytime.db`.

| Plataforma | Ruta de Almacenamiento |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.oxytime.oxyflow\oxytime.db` |
| **Linux** | `~/.local/share/com.oxytime.oxyflow/oxytime.db` |
| **macOS** | `~/Library/Application Support/com.oxytime.oxyflow/oxytime.db` |

En modo navegador (PWA), los datos se guardan en el `localStorage` de HTML5 en lugar de un archivo SQLite físico (consulte la pregunta 7 para más detalles).

---

## 2. ¿Requiere oXyFlow conexión a Internet?

**No.** oXyFlow opera de manera 100% local (offline-first). No existen conexiones obligatorias a la nube, beacons de telemetría ni servicios externos de autenticación. Todo el cálculo de tiempos y generación de informes lo ejecuta el motor nativo de Rust.

---

## 3. ¿Por qué Windows Defender SmartScreen muestra una advertencia al inicio?

Windows SmartScreen emite advertencias para archivos binarios descargados recientemente que no cuentan con un costoso certificado corporativo de firma de código (EV). oXyFlow es software libre distribuido bajo la licencia Mozilla Public License 2.0 (MPL-2.0).

Para continuar:

1. Haga clic en **Más información** en el cuadro de diálogo de SmartScreen.
2. Haga clic en **Ejecutar de todas formas**.
3. Puede verificar la autenticidad del binario comparando el hash con el archivo `SHA256SUMS.txt` publicado en GitHub Releases.

---

## 4. ¿Qué ocurre si olvido detener el temporizador al final del día?

La sesión activa continuará contando hasta que se detenga, pause o cambie manualmente:

- Puede ajustar manualmente la hora de inicio o fin de cualquier registro desde la tabla **Registros de Tiempo** o la vista de **Informes**.
- El motor prohíbe el solapamiento de registros en el mismo proyecto (`TemporalOverlapDetected`) para mantener la integridad de auditoría.

---

## 5. ¿Cómo realizo una copia de seguridad y restauración de mi base de datos?

- **Copia de Seguridad Universal en JSON**: En **Ajustes → Copias de seguridad** (panel **Copia de base de datos y estado**):
  - **Exportar**: Haga clic en **Exportar copia en JSON** (`data-testid="export-backup-btn"`) para descargar una captura JSON estructurada (`OxyFlow_Backup_YYYY-MM-DD.json`) con todos los proyectos, tareas, registros de tiempo y configuraciones.
  - **Restaurar / Importar**: Haga clic en **Restaurar copia desde JSON** (`data-testid="import-backup-btn"`) y seleccione un archivo `.json` previo. El motor valida la estructura de los datos (`validateBackupPayload`) antes de restaurar el estado.
  - **Portabilidad entre Plataformas**: El formato JSON es universal. Puede exportar una copia desde la PWA web e importarla en la aplicación de escritorio, o viceversa.
- **Copia Física de SQLite (Solo Escritorio)**: En versiones de escritorio, puede copiar el archivo `oxytime.db` directamente con la aplicación cerrada o ejecutar comandos de SQLite:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

En la PWA del navegador, las restricciones de seguridad impiden el acceso directo al sistema de archivos; la copia universal en JSON es el mecanismo principal de respaldo y migración.

---

## 6. ¿Cómo se sincronizan la interfaz visual y el CLI (`oxy`)?

El binario de terminal (`oxy`) lee y escribe en el mismo archivo local de SQLite (`oxytime.db`). Cuando se despacha una acción desde la consola, la interfaz gráfica actualiza la pantalla en el siguiente pulso del temporizador o al enfocar la ventana.

---

## 7. ¿En qué se diferencia el almacenamiento de datos entre la versión de escritorio y la PWA web?

oXyFlow emplea motores de persistencia adaptados a cada entorno de ejecución:

- **Escritorio (Tauri v2)**: Los datos se almacenan en un archivo SQLite local con soporte ACID (`oxytime.db`) en el sistema de archivos, permitiendo copias directas y sincronización con el CLI.
- **Navegador (PWA)**: Los datos residen en el `localStorage` del navegador (`LocalStorage Engine`), aislado por dominio. El entorno de seguridad del navegador no permite acceso al disco, por lo que no se genera ningún archivo `.sqlite` físico.
- **Advertencia sobre la Caché del Navegador**: Las acciones de limpieza del navegador ("Borrar datos de navegación", eliminar cookies o almacenamiento del sitio) o el uso de ventanas de incógnito borran de forma permanente todos los registros.
- **Práctica Recomendada**: Si utiliza oXyFlow en el navegador web, realice exportaciones periódicas en JSON desde **Ajustes → Copias de seguridad → Exportar copia en JSON** para mantener sus datos a salvo en el disco.

