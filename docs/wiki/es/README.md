# Documentación Técnica de oXyFlow

> Idioma / Language: [English](/en/README.md) | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | **Español** | [Français](/fr/README.md) | [Português](/pt-br/README.md)

---

oXyFlow es una aplicación de escritorio para el registro de tiempo y la gestión de tareas, desarrollada con Tauri v2, Rust y una base de datos local SQLite. Funciona de manera 100% local (offline-first) e incluye una interfaz de línea de comandos sincronizada (`oxy`) para automatización en terminal y scripts de shell.

---

## Resumen de la Arquitectura del Sistema

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│        (Tailwind CSS, Base UI, Tokens Semánticos)      │
└───────────────────────────┬────────────────────────────┘
                            │ Tauri IPC (Comandos)
┌───────────────────────────▼────────────────────────────┐
│                    Motor de Referencia Rust            │
│  - Ciclo de vida del timer e invariantes de solapamiento│
│  - Repositorios SQLite y migraciones de esquema        │
│  - Sinks en tiempo real (CSV y webhooks HTTP)          │
└───────────────────────────┬────────────────────────────┘
                            │ Puente CLI
┌───────────────────────────▼────────────────────────────┐
│                  Binario Nativo CLI (`oxy`)            │
└────────────────────────────────────────────────────────┘
```

- **Almacenamiento Local**: Todos los datos se almacenan en una base de datos local SQLite (`oxytime.db`). Sin dependencias en la nube, telemetría ni inicio de sesión forzado.
- **Triple Desacoplamiento (Triple Decoupling)**: Aislamiento estricto entre la interfaz de usuario, las reglas de dominio del motor y los controladores de almacenamiento.
- **Interfaces Duales**: Aplicación de escritorio con tres densidades de diseño (Compacto, Medio, Completo) y un CLI de terminal sincronizado (`oxy`).

---

## Estructura de la Documentación

### Guía del Usuario

- **[Primeros Pasos](getting-started.md)**: Instalación, configuración inicial y creación de proyectos y tareas.
- **[Uso del Temporizador](timer.md)**: Control del timer, cambio atómico de tareas, ajuste de registros y validaciones.
- **[CLI Básico (`oxy`)](cli.md)**: Sintaxis de comandos de terminal en PowerShell, Bash y Zsh.
- **[Interfaz y Temas](interface.md)**: Variantes de diseño, temas semánticos integrados y escalas visuales.
- **[Preguntas Frecuentes (FAQ)](faq.md)**: Rutas de base de datos, copias de seguridad e integridad local.

### Documentación Técnica y Referencia para Desarrolladores

- **[Scripting CLI Avanzado](advanced-cli.md)**: Flujos JSON, integración con prompts de terminal y automatización.
- **[Arquitectura del Sistema](architecture.md)**: Ciclo de vida del motor en Rust, pruebas AST y capa SQLite.
- **[Automatización y Sinks](automation.md)**: Configuración de registros de auditoría CSV y webhooks en tiempo real.
- **[Compilación desde el Código Fuente](developer-build.md)**: Requisitos, toolchain Bun y comandos de compilación Cargo.

---

## Paquetes Oficiales

| Sistema Operativo | Tipo de Paquete | Arquitectura de Destino |
| :--- | :--- | :--- |
| **Windows** | Instalador Setup (`.exe`) | x86_64 |
| **Windows** | Ejecutable Portable (`.exe`) | x86_64 |
| **macOS** | Disco Universal (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) |
| **Linux** | AppImage (`.AppImage`) | x86_64 |
| **Linux (Debian / Ubuntu)** | Paquete DEB (`.deb`) | amd64 |
| **Linux (RHEL / Fedora)** | Paquete RPM (`.rpm`) | x86_64 |

Los archivos binarios y las sumas criptográficas (`SHA256SUMS.txt`) están disponibles en la [página de versiones de GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
