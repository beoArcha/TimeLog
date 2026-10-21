# Arquitectura del Sistema e Ingeniería

> Idioma / Language: [English](/en/architecture.md) | [Polski](/pl/architecture.md) | [Deutsch](/de/architecture.md) | **Español** | [Français](/fr/architecture.md) | [Português](/pt-br/architecture.md)

---

oXyFlow implementa una Clean Architecture con un aislamiento de capas estricto, verificado mediante suites automáticas de pruebas de arquitectura AST en el frontend en TypeScript (`tests/architecture/`) y en el backend en Rust (`src-tauri/tests/architecture/`).

---

## Topología Arquitectónica de Alto Nivel

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Presentation UI                        │
│         (Tokens Tailwind CSS, hooks orquestadores declarativos)        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌────────────────────┐
│     EngineRouter      │                           │ PersistenceRouter  │
│  (IRouter<IEngine>)   │                           │(IRouter<IPersist>) │
└──────────┬────────────┘                           └─────────┬──────────┘
           │                                                  │
           ├──────────────────────────────┬───────────────────┤
           ▼                              ▼                   ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────┐
│       Tauri Desktop IPC     │  │      Plugin de Tiempo de Ejecución    │
│ (Puente IPC al motor Rust)  │  │  (EnginePlugin + PersistencePlugin)   │
└──────────┬──────────────────┘  └───────────────────────────────────────┘
           ▼
┌─────────────────────────────┐
│   Motor de Referencia Rust  │
│  - Ciclo de vida del timer  │
│  - Métricas de duración     │
│  - Invariantes temporales   │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ Capa de Persistencia SQLite │
│  - Repositorios Rusqlite    │
│  - Modo WAL y transacciones │
└─────────────────────────────┘
```

---

## Invariantes Arquitectónicos Clave

### 1. La Regla del Triple Desacoplamiento (Triple Decoupling)

1. **Desacoplado de la Localización**: Los componentes de interfaz nunca validan textos traducidos. Las aserciones y consultas de UI se basan exclusivamente en `data-testid` o roles de accesibilidad ARIA.
2. **Desacoplado de Temas y CSS**: Los estilos utilizan tokens semánticos (`bg-card`, `text-foreground`). Los componentes nunca incluyen condicionales del tipo `resolvedTheme === 'dark'` ni colores hexadecimales fijos.
3. **Desacoplado de Efectos Secundarios de la Plataforma**: Los componentes compartidos de React nunca comprueban directamente `window.__TAURI__` ni emiten llamadas IPC sin intermediación. Toda la interacción pasa a través de routers polimórficos (`EngineRouter`, `PersistenceRouter`).

### 2. Paridad del Motor Entre Entornos de Ejecución

La lógica central de negocio (transiciones de estado del temporizador, cálculo de duraciones en saltos de medianoche y reglas de validación) existe en dos implementaciones sincronizadas:

- **Motor de Referencia en Rust** (`src-tauri/src/engine/`): Máximo rendimiento compilado para la aplicación de escritorio.
- **Plugin de Motor en Navegador** (`src/plugins/engine/`): TypeScript puro para garantizar un comportamiento 100% idéntico en pruebas y previsualizaciones web.

Una suite compartida de pruebas de paridad (`CrossRuntimeParity.test.ts`) ejecuta matrices idénticas contra ambas implementaciones.

### 3. Regla de Máximo 2 Sentencias If Anidadas (Rule of 3 Ifs)

Tanto en el código TypeScript como en los módulos Rust, la profundidad máxima permitida de sentencias `if` anidadas es 2. Tres o más sentencias condicionales anidadas provocan el fallo automático en las pruebas de arquitectura (`max-nested-ifs.arch.test.ts` y `max_nested_ifs_test.rs`).

### 4. Aislamiento del CLI Nativo

El binario de terminal (`src-tauri/src/cli/`) se comunica directamente con las interfaces `Engine` y `Persistence`. Tiene prohibido explícitamente importar tipos de interfaz gráfica de Tauri (`AppState`, `tauri::AppHandle`, controladores de ventanas o componentes de bandeja del sistema).
