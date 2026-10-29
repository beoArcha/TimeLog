# Primeros Pasos

> Idioma / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | **Español** | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

Esta guía le guiará a través del acceso a oXyFlow en la Web / PWA o la instalación de la aplicación de escritorio, la configuración del entorno y el registro de su primera sesión de tiempo.

---

## Aplicación Web y PWA (Sin Instalación)

Puede utilizar oXyFlow de inmediato sin necesidad de descargar instaladores:

1. Visite **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)** en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari).
2. Todo el temporizador y el almacenamiento de datos funcionan 100% localmente en el almacenamiento privado de su navegador.
3. **Instalación como PWA**: En navegadores compatibles, haga clic en **Instalar aplicación** en la barra de direcciones o en el menú del navegador para instalar oXyFlow como aplicación independiente con soporte offline en su escritorio o móvil.

---

## Instalación en Escritorio

Descargue el paquete correspondiente a su sistema operativo desde la [página de versiones de GitHub](https://github.com/beoArcha/TimeLog/releases/latest):

- **Windows**: Ejecute el instalador `OxyFlow-Setup-x64.exe` o descargue la versión portable `OxyFlow-Standalone-x64.exe`.
- **macOS**: Abra la imagen de disco `OxyFlow-Universal.dmg` y arrastre `OxyFlow.app` a la carpeta `/Applications`.
- **Linux**: Asigne permisos de ejecución al archivo `OxyFlow-x86_64.AppImage` (`chmod +x OxyFlow-x86_64.AppImage`) o instale el paquete `.deb` / `.rpm`:

  ```bash
  sudo dpkg -i oxyflow_amd64.deb
  # o en Fedora/RHEL:
  sudo rpm -i oxyflow.x86_64.rpm
  ```

---

## Configuración del CLI (Opcional)

Las instalaciones de escritorio configuran también el ejecutable CLI denominado `oxy`. Para utilizar `oxy` directamente en su terminal (PowerShell, Bash, Zsh), asegúrese de que el directorio de instalación esté en su variable de entorno `PATH`:

- **Windows**: `%LOCALAPPDATA%\Programs\oXyFlow\`
- **Linux / macOS**: `/usr/local/bin/` o `~/.local/bin/`

Compruebe la disponibilidad en su terminal:

```bash
oxy --version
```

---

## Crear un Proyecto y una Tarea

1. Inicie la aplicación **oXyFlow** (versión de escritorio o web).
2. Haga clic en el botón **"+ Nuevo Proyecto"** en la barra lateral.
3. Introduzca el nombre del proyecto (por ejemplo, `Portal de Clientes`) y elija un color identificador. Haga clic en **Guardar**.
4. Dentro del proyecto creado, haga clic en **"+ Añadir tarea"**. Escriba el título (por ejemplo, `Implementación de API`) y pulse **Enter**.

---

## Registro de Tiempo

- Haga clic en el botón **Iniciar (▶)** junto a una tarea para comenzar el seguimiento.
- La barra de estado resaltará la tarea activa mostrando el tiempo transcurrido en tiempo real.
- Haga clic en **Pausar (⏸)** o **Detener (■)** para finalizar la sesión.
- Iniciar otra tarea detiene automáticamente la anterior en una sola transacción atómica.

---

## Siguientes Pasos

- **[Uso del Temporizador](timer.md)**: Corrección de registros, reglas de solapamiento e historial.
- **[CLI Básico (`oxy`)](cli.md)**: Control del timer desde la consola de comandos.
- **[Interfaz y Temas](interface.md)**: Personalización de densidades de diseño y temas visuales.
