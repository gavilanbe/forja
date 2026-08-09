# FORJA — Especificación de mejora artística y UX v2

Este documento es el contrato de implementación de la segunda pasada de FORJA. Debe leerse completo antes de modificar código. `PRODUCT_BRIEF.md`, `ARCHITECTURE.md` y `ROUTINE.md` siguen siendo autoritativos; este documento concreta la revisión artística, UX, accesibilidad y QA.

## Objetivo

Elevar FORJA desde una PWA funcional con una skin pixel-art coherente hasta un producto móvil de lanzamiento que se sienta como un pequeño RPG original de fantasía industrial, sin perjudicar la velocidad de registro durante el entrenamiento.

La aplicación debe responder inmediatamente:

1. Qué entrenamiento toca.
2. Qué serie viene ahora.
3. Qué se hizo anteriormente.
4. Qué peso, repeticiones y RIR registrar.
5. Cuánto descansar.
6. Qué se acaba de guardar.
7. Cómo progresa la semana.

La capa artística debe enriquecer estas respuestas, nunca ocultarlas.

## Restricciones

Conservar:

- React, TypeScript, Vite, HashRouter, Dexie e IndexedDB.
- Arquitectura offline-first y funcionamiento sin autenticación.
- Rutina, Códice y reglas de Nahuel y Carlos.
- Racha semanal, nunca diaria.
- XP segura: no premiar volumen extra, fallo muscular ni ignorar dolor.
- Temporizador persistente y recuperación de sesiones.
- Flujo principal de peso, repeticiones, RIR, guardado y descanso.
- Paleta general de acero, brasa, oro y fondo oscuro.

No añadir backend, Supabase ni dependencia de red. No crear remoto, publicar, desplegar ni hacer push. Preservar todo el trabajo existente; no resetear ni borrar el worktree.

No detenerse en un plan o mockup: implementar, probar, inspeccionar capturas y corregir hasta cumplir los criterios de aceptación.

## Diagnóstico de partida

- La aplicación se percibe más como un dashboard oscuro con skin pixel que como un mundo de juego.
- `PixelFrame` se usa para casi todo y genera una sucesión de cajas equivalentes.
- Campaña es una lista de tarjetas, no un mapa.
- Hoy reparte el protagonismo entre avatar, XP, llama, capítulo, seis semanas, camino y misión.
- La gamificación depende demasiado de nombres, barras y contadores.
- Los sprites son pequeños pictogramas y tienen poca presencia narrativa.
- La finalización informa, pero recompensa poco.
- Press Start 2P aparece a 8–9 px en navegación, etiquetas y acciones secundarias.
- Progreso puede seleccionar un ejercicio deshabilitado sin datos aunque existan registros de otro.
- En una primera sesión se puede guardar 0 kg y las repeticiones empiezan en el mínimo pese a recomendar la mitad del rango.
- Los modales no tienen salida visible común ni gestión completa del foco.
- Antes del inicio, Hoy afirma capítulo 1 y enciende la llama mientras Campaña muestra un estado bloqueado.
- No existe estado posterior al capítulo 6.
- Faltan Playwright, E2E, capturas de regresión y una vista interna del sistema visual.

## Prioridad 0 — Correcciones funcionales y accesibilidad

### Progreso

- Si hay ejercicios con datos, seleccionar automáticamente el utilizado más recientemente.
- Nunca dejar seleccionada una opción deshabilitada.
- Mostrar primero o exclusivamente ejercicios registrados; separar los ejercicios sin datos.
- Evitar una lista plana inmanejable y conservar la selección al volver.
- El estado vacío debe ofrecer una acción real para volver a la misión.

### Registro de la primera serie

- No prellenar el peso con `0` como si fuese una carga válida.
- Usar un campo vacío o estado «Introduce peso».
- Sin historial, preseleccionar el punto medio del rango de repeticiones.
- Modelar el tipo de carga: externa, peso corporal o asistencia.
- Impedir 0 kg en ejercicios de carga externa; permitirlo solo cuando sea semánticamente correcto.
- Mostrar validación inline y conservar entrada numérica directa y botones +/−.

### Modales

Refactorizar `PixelModal` para incluir:

- Botón de cierre visible y acción Cancelar/Volver cuando proceda.
- Foco inicial, trampa de foco y restauración del foco al cerrar.
- Escape cuando sea seguro.
- Bloqueo del scroll de fondo.
- Etiquetado accesible con `aria-labelledby` o equivalente.
- No depender de pulsar el overlay.
- Buen comportamiento a 360×800 y 200 % de zoom.

Verificar Técnica, Alternativa, Molestia, Omitir, Salir, Importar e Instalación.

## Prioridad 1 — Jerarquía de Hoy

En un día de entrenamiento, el primer viewport a 360×800 debe mostrar:

- Identidad compacta del perfil.
- Nombre y foco de la misión.
- Duración, ejercicios y series.
- Acción `EMPEZAR MISIÓN` o `CONTINUAR MISIÓN`.
- Estado semanal esencial.

La misión debe ser el hero, no el cuarto bloque. Fusionar cabecera, capítulo y misión en una composición de la forja, evitando tres tarjetas independientes.

Orden recomendado:

1. Hero de misión.
2. Camino semanal.
3. Información secundaria de capítulo/XP.

Eliminar el chip permanente `Local` de la cabecera. Mostrar guardado/offline de forma contextual después de guardar, al perder conexión, al exportar o ante un error real.

En descanso, crear una escena de campamento atmosférica sin perder claridad.

## Prioridad 1 — Dirección artística

Mantener fantasía industrial adulta, no infantil y sin copiar otros juegos.

Crear tres niveles visuales:

1. **Entorno:** fondo de forja, textura pixel sutil y siluetas de maquinaria.
2. **Panel informativo:** separación espacial o borde ligero, sin sombra por defecto.
3. **Objeto hero/interactivo:** marco trabajado, brasa/oro, volumen y sombra; reservado para misión, CTA y recompensa.

No encerrar cada fragmento en `PixelFrame`.

Ampliar los assets originales locales:

- Nahuel y Carlos: neutral, preparado, celebrando y recuperándose.
- Llama: apagada, rescoldo, encendida y al rojo.
- Yunque: golpe de 3–4 fotogramas.
- Chispas discretas.
- Hoguera animada.
- Cofre o sello de misión más expresivo.
- Nodos y elementos ambientales diferenciados por capítulo.

No usar emojis como iconos, imágenes remotas, fotos, personajes ajenos, glassmorphism, gradientes de IA ni sombras suaves genéricas. Animaciones breves por pasos y respeto estricto a reduced motion.

## Tipografía

Press Start 2P solo para logotipo, títulos cortos, kickers y sellos. Usar sans legible para navegación, acciones secundarias, nombres largos, datos, gráficas, ayudas y modales.

- Ningún dato crítico o control por debajo de 12 px en sans.
- Pixel pequeña solo en etiquetas decorativas breves.
- Verificar español, acentos, 360 px y zoom 200 %.

## Campaña

Transformarla en un mapa vertical real de seis capítulos:

- Camino visual continuo.
- Capítulo actual dominante.
- Capítulos anteriores resumidos como forjados.
- Próximo capítulo parcialmente visible.
- Futuro bloqueado mediante oscuridad, humo, compuertas o niebla pixel.
- Una evolución visual de la forja por capítulo.
- Semana 6 como checkpoint, nunca prueba máxima.

Evitar seis tarjetas equivalentes. Conservar semántica accesible.

## Gamificación y estados de campaña

En Hoy, el progreso semanal es dominante; el capítulo es contexto y XP/nivel son secundarios.

Estados coherentes de la Llama:

- Apagada/esperando antes de la campaña.
- Rescoldo durante una semana aún no cumplida.
- Al rojo cuando se alcanza el objetivo semanal.

No mostrar llama encendida junto a «Enciende la llama».

Implementar ciclo completo:

- **Prólogo:** fecha de comienzo, sin capítulo activo ni días perdidos.
- **Campaña:** semana y capítulo coherentes en Hoy y Campaña.
- **Después de semana 6:** «Bloque forjado», resumen de checkpoint y continuidad de la rutina sin fingir capítulo 6 eterno. No reiniciar sin confirmación.

Usar fechas inyectables/deterministas en pruebas.

## Entrenamiento activo

No rediseñarlo radicalmente: es la sección más fuerte.

- Conservar cabecera compacta, un ejercicio, controles grandes, guardado dominante y descanso limpio.
- Sustituir el carácter Unicode de salida por icono original o CSS consistente.
- Usar sans legible en acciones secundarias.
- Aclarar que «Máquina ocupada» abre alternativas.
- Mantener acciones secundarias lejos de Guardar.
- Añadir nota opcional breve por ejercicio o sesión sin entorpecer el flujo.

## Finalización

Crear un momento de recompensa:

1. Golpe de martillo.
2. Chispas.
3. Sello de misión completada o adaptada.
4. Cambio visible del camino semanal.
5. Evolución cosmética pequeña.
6. Estadísticas y XP como información secundaria.

Evitar que cuatro cajas genéricas sean el elemento principal. Una misión adaptada debe sentirse como una decisión inteligente, no como un premio inferior. Una misión extra puede mostrar +0 XP explicando positivamente que no era obligatoria.

## Perfil y onboarding

- Selección breve de perfil en primer inicio.
- Después, cambio de perfil en Perfil.
- Evitar cambio accidental con sesión activa.
- Tutorial opcional de una pantalla: misión, serie, RIR y Llama semanal.
- Permitir omitirlo.

## Vista interna de diseño

Crear una ruta solo de desarrollo, no visible en producción, con sprites/fotogramas, tipografías, botones, marcos, chips, modales, estados de misión, llama, nodos, guardado, offline, paleta y contraste.

## QA requerido

Añadir Playwright y E2E para:

1. Primer inicio y perfil.
2. Día programado y descanso.
3. Prólogo y post-campaña.
4. Inicio de misión y varias series.
5. Validación de peso.
6. Temporizador y recuperación tras recarga.
7. Técnica, alternativa y molestias.
8. Finalización normal y adaptada.
9. Progreso con selección automática de datos.
10. Nahuel/Carlos.
11. Build `/forja/`.
12. Primera carga online y reapertura offline.
13. Actualización del service worker sin interrumpir misión.

Capturas deterministas a 360×800, 390×844 y 430×932 de Hoy con misión, descanso, misión activa, temporizador, molestia, finalización, Campaña, Progreso y Perfil. Inspeccionarlas y corregir clipping, microtipografía, jerarquía, contraste, exceso de marcos y componentes genéricos.

## Criterios de aceptación

No finalizar hasta que:

1. Pasen unit tests y E2E.
2. Pase build con `VITE_BASE_PATH=/forja/`.
3. La PWA reabra offline tras una carga.
4. No haya overflow a 360, 390 y 430 px.
5. El CTA de misión sea visible en el primer viewport 360×800.
6. No haya controles críticos a 8–9 px.
7. Campaña parezca mapa, no lista de tarjetas.
8. Progreso seleccione un ejercicio con datos.
9. No se guarde accidentalmente 0 kg en carga externa.
10. Todos los modales tengan salida visible y foco correcto.
11. Llama y capítulo sean coherentes antes, durante y después.
12. La finalización tenga recompensa visual.
13. La app siga siendo rápida y utilizable con una mano.
14. No cambien la rutina ni las reglas de Nahuel/Carlos.
15. No se añada backend ni dependencia de red.
16. No se publique ni haga push.

## Proceso y entrega

1. Leer este documento completo y los documentos fuente.
2. Ejecutar build y pruebas actuales.
3. Guardar capturas «antes».
4. Corregir primero P0.
5. Refactorizar sistema visual y pantallas prioritarias.
6. Añadir assets y estados.
7. Añadir E2E y fechas deterministas.
8. Ejecutar tests, E2E y build.
9. Guardar capturas «después» e inspeccionarlas.
10. Iterar hasta cumplir todos los criterios.

Al terminar, informar decisiones artísticas, jerarquía, UX corregida, recursos añadidos, accesibilidad, pruebas, offline verificado, archivos modificados, limitaciones y comandos exactos de revisión.
