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

En modo navegador, los datos se guardan en el `localStorage` de HTML5 bajo claves específicas.

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

- **Copias automáticas**: oXyFlow incluye opciones de respaldo en **Ajustes → Base de datos y Copias**.
- **Copia manual**: Copie el archivo `oxytime.db` mientras la aplicación esté cerrada o ejecute un comando de SQLite:

  ```bash
  sqlite3 oxytime.db ".backup 'oxytime-backup.db'"
  ```

---

## 6. ¿Cómo se sincronizan la interfaz visual y el CLI (`oxy`)?

El binario de terminal (`oxy`) lee y escribe en el mismo archivo local de SQLite (`oxytime.db`). Cuando se despacha una acción desde la consola, la interfaz gráfica actualiza la pantalla en el siguiente pulso del temporizador o al enfocar la ventana.
