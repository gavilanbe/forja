# Arquitectura offline-first

## Stack recomendado

- React estable + TypeScript + Vite.
- React Router con `HashRouter` para evitar errores 404 en GitHub Pages.
- Dexie + `dexie-react-hooks` sobre IndexedDB.
- `vite-plugin-pwa` con service worker basado en Workbox.
- Vitest y Playwright.
- CSS propio mediante variables y componentes; ninguna librería visual debe imponer el aspecto.

## Fuente de verdad

IndexedDB es la fuente primaria. Supabase, si se añade, será copia remota y sincronización.

Persistir localmente:

- Perfiles.
- Plantillas de rutina.
- Días y ejercicios.
- Sesiones.
- Series registradas.
- Notas de dolor.
- Eventos de juego.
- Racha semanal.
- Preferencias.
- Cola de sincronización.
- Versión del esquema y de la rutina.

Cada registro mutable debe usar UUID estable, `profileId`, `createdAt`, `updatedAt`, `localVersion` y `syncStatus`.

## Escritura local

Al pulsar `GUARDAR SERIE`:

1. Validar datos.
2. Escribir transaccionalmente en IndexedDB.
3. Confirmar en UI.
4. Iniciar el descanso.
5. Añadir operación a la cola de sincronización si existe remoto.

La red nunca participa en los tres primeros pasos.

## Service worker

Precachear app shell, JavaScript, CSS, fuentes, iconos, sprites y datos esenciales de rutina.

- Cache-first: recursos versionados e inmutables.
- Stale-while-revalidate: contenido de referencia no crítico.
- Network-first con fallback: actualizaciones opcionales de rutina.
- IndexedDB: todos los datos generados por usuarios.

La aplicación instalada debe abrirse sin conexión después de la primera carga correcta.

## Sincronización futura

- Cola no bloqueante.
- Reintento con backoff exponencial.
- Reintento en evento `online`.
- Background Sync cuando exista; reintento al abrir si no existe.
- Series de trabajo append-first.
- Estado visible: guardado local, sincronizando, sincronizado o cambios pendientes.
- Nunca mostrar un error alarmante solo porque no hay red.

Supabase debe integrarse mediante un adaptador para poder mantener un modo `local-only` completo.

## Temporizador

Persistir `targetEndAt`, no solo un contador en memoria. Al volver desde segundo plano se calcula el tiempo restante contra el reloj real.

## PWA

- Manifest completo.
- Iconos normales y maskable.
- `display: standalone`.
- Orientación principal vertical.
- Theme color propio.
- Guía de instalación por plataforma.
- Actualizaciones aplazables durante una sesión activa.

## Pruebas mínimas

- Recarga y reapertura conservan sesión y series.
- El temporizador se recupera correctamente.
- Todo el flujo de entrenamiento funciona con navegador offline.
- Build funciona con base `/forja/`.
- No hay desbordamiento horizontal en 360, 390 y 430 px.
- Los controles táctiles principales tienen al menos 44 px.
