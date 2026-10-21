# Primeros Pasos

> Idioma / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | **Español** | [Français](/fr/getting-started.md) | [Português](/pt-br/getting-started.md)

---

Esta guía le guiará a través de la instalación de oXyFlow, la configuración del entorno y el registro de su primera sesión de tiempo.

---

## Instalación

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

1. Inicie la aplicación **oXyFlow**.
2. Haga clic en el botón **"+ Nuevo Proyecto"** en la barra lateral.
3. Introduzca el nombre del proyecto (por ejemplo, `Portal de Clientes`) y elija un color identificador. Haga clic en **Guardar**.
4. Dentro del proyecto creado, haga clic en **"+ Añadir tarea"**. Escriba el título (por ejemplo, `Implementación de API`) y pulse **Enter**.

---

## Controlar el Registro de Tiempo

- Haga clic en el botón **Iniciar (▶)** junto a la tarea para comenzar el temporizador de inmediato.
- La barra de estado superior resaltará la tarea activa y mostrará el tiempo transcurrido en vivo.
- Haga clic en **Detener (■)** para finalizar la sesión actual.
- Al hacer clic en Iniciar en otra tarea, el temporizador actual se detendrá automáticamente y el nuevo se iniciará en una única transacción atómica (`switch`).

---

## Siguientes Pasos

- **[Uso del Temporizador](timer.md)**: Reglas de solapamiento, edición de registros y resúmenes diarios.
- **[CLI Básico (`oxy`)](cli.md)**: Control mediante línea de comandos.
- **[Interfaz y Temas](interface.md)**: Variantes de diseño y temas visuales.
