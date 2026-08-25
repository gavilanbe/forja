# FORJA

Producto móvil **offline-first** que convierte un programa de hipertrofia de
seis semanas en una campaña de RPG de 16 bits con identidad visual propia:
acero forjado, brasas y maquinaria de gimnasio.

Este repositorio contiene dos implementaciones del mismo producto:

- La PWA original (React + TypeScript + Dexie) permanece en la raíz y es la
  referencia funcional y de compatibilidad de datos.
- La aplicación nativa para iPhone (SwiftUI + persistencia local) vive en
  [`ios/`](ios/README.md). Sus reglas específicas están en
  [`ios/AGENTS.md`](ios/AGENTS.md).

- **Bloque** → campaña · **semana** → capítulo · **entrenamiento** → misión ·
  **descanso** → campamento · **racha semanal** → Llama de la Forja.
- Registrar una serie tarda menos de cinco segundos y nunca espera a la red.
- Tras la primera carga con conexión, la app entera funciona sin cobertura.

## Comandos de la PWA

```sh
npm install          # dependencias
npm run dev          # desarrollo en http://localhost:5173 (base /)
npm test -- --run    # tests unitarios (Vitest)
npm run build        # type-check + build de producción en dist/
npm run preview      # sirve dist/ para probar el build (y el service worker)
npm run icons        # regenera public/icons/*.png desde el arte pixel
```

## Comandos de iPhone

```sh
cd ios
swift test
open ForjaIOS.xcodeproj
```

La app nativa requiere iOS 17 o posterior. La compilación de interfaz y los
simuladores requieren Xcode completo; los controles del dominio también pueden
ejecutarse con `swift run forja-core-checks`.

Para probar el build con la base de GitHub Pages:

```sh
VITE_BASE_PATH=/forja/ npm run build
VITE_BASE_PATH=/forja/ npm run preview   # → http://localhost:4173/forja/
```

## Cómo probar el modo offline

1. `npm run build && npm run preview` y abre la URL en Chrome.
2. Recarga una vez (el service worker toma el control tras la primera carga).
3. DevTools → Network → **Offline**.
4. Recarga: la app abre completa, puedes empezar la misión del día, guardar
   series, cronometrar descansos y sellar la misión. Todo queda en IndexedDB.
5. Vuelve online cuando quieras: no hay nada que "sincronizar" en la v1;
   los datos viven en el dispositivo (exportables a JSON desde Perfil).

## Arquitectura

- **React + TypeScript + Vite**, con `HashRouter` (evita 404 en GitHub Pages).
- **IndexedDB (Dexie)** como única fuente de verdad: perfiles, sesiones,
  series, molestias, eventos de juego, preferencias, cola de sincronización y
  metadatos de versión. Cada registro lleva UUID, `createdAt`, `updatedAt`,
  `localVersion` y `syncStatus`.
- **Guardar serie** = validar → transacción IndexedDB → confirmación en UI →
  descanso. La red no participa en ningún paso.
- **Temporizador** persistido como `targetEndAt` absoluto (tabla `kv`): tras
  recarga o segundo plano se recalcula contra el reloj real.
- **Service worker** (vite-plugin-pwa/Workbox): precachea la shell completa
  (JS, CSS, fuente pixel, iconos, manifest). Actualizaciones con aviso
  aplazable que nunca interrumpe una misión activa.
- **Sincronización futura**: interfaz `SyncAdapter` con `LocalOnlyAdapter`
  operativo; un adaptador Supabase podría enchufarse sin tocar el flujo de
  entrenamiento (`src/sync/adapter.ts`).
- **Rutina como datos** (`src/data/routine.ts`) y **códice** con la técnica
  íntegra del manual (`src/data/codex.ts`): racional, colocación, ejecución,
  errores y alternativas por ejercicio, con identificadores estables.
- **Gamificación segura** (`src/logic/xp.ts`, `streak.ts`): racha semanal
  (nunca diaria), campamentos que no rompen la llama, XP solo por series
  previstas y misiones planificadas, niveles cosméticos, sesiones adaptadas
  por molestia que conservan la adherencia. El volumen extra no puntúa.
- **Progresión** (`src/logic/progression.ts`): doble progresión conservadora;
  sugiere, nunca modifica; se desactiva si hubo molestia significativa.
- **Arte** : sprites originales como mapas de píxeles renderizados a SVG
  (`src/ui/sprites.ts`), fuente Press Start 2P (OFL) empaquetada en local y
  iconos PNG generados con `scripts/gen-icons.mjs` (sin dependencias).

```
src/
  data/     rutina estructurada + códice del manual
  db/       esquema Dexie, tipos y siembra de perfiles
  logic/    sesiones, progresión, racha, XP, temporizador, backup, fechas
  sync/     frontera de sincronización (v1: solo local)
  ui/       primitivas pixel, sprites, controles, gráficas
  screens/  Hoy · Misión · Resumen · Campaña · Progreso · Códice · Perfil
  styles/   tokens, base y componentes (CSS propio, sin librerías)
tests/      Vitest: progresión, racha, temporizador, fechas, base local
ios/        app nativa SwiftUI, proyecto Xcode, núcleo y pruebas propias
```

## Rutina y perfiles

- **Nahuel** — 5 misiones/semana: Torso A, Pierna A, X campamento, Empuje,
  Tirón, Pierna B, D campamento.
- **Carlos** — 3 misiones/semana: el mismo Torso A, Pierna A y Tirón, sin
  compensaciones. Si un día puede más (jueves/sábado), la app le ofrece
  unirse a la sesión exacta de Nahuel como día extra sin XP.
- Semana 6 = checkpoint de evaluación, nunca una prueba de máximos.

Fuente: `reference/Manual_hipertrofia_Nahuel_y_Carlos.docx` (v1.0, agosto 2026).

## Despliegue (GitHub Pages)

El workflow `.github/workflows/pages.yml` ya define el contrato: en cada push
a `main` ejecuta tests, hace build con `VITE_BASE_PATH=/forja/` y publica
`dist/` en `https://gavilanbe.github.io/forja/`. Manifest, scope, start_url,
iconos y service worker funcionan desde ese subpath (verificado en local).

El repositorio remoto es `gavilanbe/forja`. Los cambios de la app nativa se
preparan en una rama separada; no requieren ni deben disparar un despliegue de
la PWA. La publicación web continúa gobernada por `main` y por
`docs/DEPLOYMENT.md`.

## Limitaciones conocidas de la v1

- Sin copia remota: los datos viven en el dispositivo (exporta JSON desde
  Perfil como respaldo).
- La fuente pixel dibuja las vocales acentuadas en caja alta con forma
  compacta (límite de su rejilla 8×8); es legible y coherente con el estilo.
- Sin notificaciones push ni recordatorios (requerirían backend).
