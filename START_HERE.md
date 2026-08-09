# Cómo iniciar la construcción

No pegues el prompt maestro entero en cada conversación. Abre este directorio como proyecto y haz que el agente lea los archivos del repositorio.

## Opción A — Codex con `/goal`

Abre `/Users/nahuelgavilan/Projects/forja` en Codex y pega solamente:

```text
/goal Construye FORJA como una PWA móvil, pixel-art y realmente offline-first. Lee primero AGENTS.md, docs/SUPER_PROMPT_FABLE.md, docs/PRODUCT_BRIEF.md, docs/ARCHITECTURE.md, docs/ROUTINE.md y docs/DEPLOYMENT.md. Implementa el producto completo por checkpoints y no te detengas en un plan o un mockup. Termina únicamente cuando la aplicación funcione, la UI haya sido revisada visualmente en móvil, los tests pasen, el build de producción termine correctamente, el flujo principal funcione sin red después de la primera carga y el repositorio quede preparado para GitHub Pages. No crees repositorios remotos, no hagas push y no publiques sin pedirme autorización explícita.
```

`/goal` es apropiado porque existe un objetivo duradero, pruebas concretas y una condición verificable de finalización.

## Opción B — Claude con Fable 5 y `/goal`

Abre este directorio en Claude, selecciona Fable 5 y pega:

```text
/goal Build FORJA completely. Read CLAUDE.md and every document it requires before acting. Take ownership of product design, implementation, offline behavior, testing and mobile visual QA. Do not stop after planning or after producing a visual mockup. Continue until every Definition of Done item in docs/SUPER_PROMPT_FABLE.md passes. Do not create a remote repository, commit, push, publish or add paid infrastructure without my explicit authorization.
```

No pegues además el prompt maestro en el chat: la orden ya obliga a Fable a leerlo desde el repositorio. Así el contexto queda versionado, revisable y disponible en futuras sesiones.

## Checkpoints recomendados

1. Sistema visual y pantalla Hoy.
2. Flujo de entrenamiento y temporizador.
3. Base de datos local y recuperación de sesión.
4. Campaña, progreso, códice y perfiles.
5. Instalación PWA y pruebas sin conexión.
6. QA visual móvil y accesibilidad.
7. Build final y preparación del despliegue.

Pide informes breves por checkpoint: qué cambió, qué se verificó, qué falta y si existe un bloqueo real.
