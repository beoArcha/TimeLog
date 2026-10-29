# Documentación Técnica de oXyFlow

> Idioma / Language: [English](/en/README.md) | [Polski](/pl/README.md) | [Deutsch](/de/README.md) | **Español** | [Français](/fr/README.md) | [Português](/pt-br/README.md)

---

oXyFlow es una aplicación de registro de tiempo y gestión de tareas local-first, disponible como aplicación nativa de escritorio (Tauri v2, Rust, base de datos SQLite) con un CLI complementario (`oxy`), así como una **aplicación web y Progressive Web App (PWA)** servida directamente desde GitHub Pages.

> 🚀 **Aplicación Web en Vivo**: Inicie oXyFlow al instante en su navegador o instálela con capacidad offline en **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)**.

---

## Resumen de la Arquitectura del Sistema

```text
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│        (Tailwind CSS, Base UI, Tokens Semánticos)      │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼ (Entorno de Escritorio)           ▼ (Entorno Web / PWA)
┌─────────────────────────────┐     ┌─────────────────────────────┐
│    Tauri IPC (Comandos)     │     │    Almacenamiento Navegador │
│  - Motor nativo en Rust     │     │  - Plugin localStorage     │
│  - Base de datos SQLite     │     │  - Service Worker PWA       │
│  - Sinks en tiempo real     │     │  - Operación 100% offline   │
└──────────────┬──────────────┘     └─────────────────────────────┘
               │ Puente CLI
┌──────────────▼──────────────┐
│  Binario Nativo CLI (`oxy`) │
└─────────────────────────────┘
```

- **Almacenamiento Local**: Los registros de escritorio se conservan en un archivo SQLite local (`oxytime.db`), y la versión Web/PWA en el `localStorage` privado del navegador. Sin telemetría ni cuentas obligatorias.
- **Triple Desacoplamiento (Triple Decoupling)**: Aislamiento estricto entre la interfaz de usuario, las reglas de dominio del motor y los controladores de almacenamiento.
- **Múltiples Plataformas**: Aplicación de escritorio (Compacto, Medio, Completo), CLI sincronizado (`oxy`) y versión web/PWA accesible en cualquier navegador.

---

## Estructura de la Documentación

### Guía del Usuario

- **[Primeros Pasos](getting-started.md)**: Acceso web, instalación en escritorio, configuración inicial y creación de proyectos y tareas.
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

## Paquetes Oficiales y Despliegues

| Plataforma | Tipo de Paquete / Despliegue | Arquitectura de Destino | Enlace / Instrucciones |
| :--- | :--- | :--- | :--- |
| **Web & PWA** | Aplicación Web (Sin instalación) | Navegadores Web Modernos | [Abrir Aplicación Web](https://beoarcha.github.io/TimeLog/app/) |
| **Windows** | Instalador Setup (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Windows** | Ejecutable Portable (`.exe`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **macOS** | Disco Universal (`.dmg`) | Universal (Apple Silicon M1–M4 & Intel x86_64) | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux** | AppImage (`.AppImage`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (Debian / Ubuntu)** | Paquete DEB (`.deb`) | amd64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |
| **Linux (RHEL / Fedora)** | Paquete RPM (`.rpm`) | x86_64 | [GitHub Releases](https://github.com/beoArcha/TimeLog/releases/latest) |

Los archivos binarios y las sumas criptográficas (`SHA256SUMS.txt`) están disponibles en la [página de versiones de GitHub](https://github.com/beoArcha/TimeLog/releases/latest).
