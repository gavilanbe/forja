# Paridad y límites del primer corte nativo

## Ya trasladado

| Área | Estado nativo |
| --- | --- |
| Perfil | Alta de varios perfiles locales, nombre libre, objetivo, experiencia, lugar, frecuencia, días, duración y edición posterior |
| Avatar | Editor por capas con IDs estables y placeholders procedurales de 16 bits |
| Hoy | Semana, misión programada, descanso, sesión activa y misión opcional |
| Entrenamiento | Series, peso, repeticiones, RIR, progresión conservadora, descansos, notificación, hápticos y pantalla activa |
| Seguridad | Molestia con continuar/adaptar/detener; sin diagnóstico ni subida automática |
| Campaña | Seis capítulos, objetivo semanal y descanso sin castigo |
| Progreso | Métricas, gráfico semanal, historial por ejercicio y detalle de misiones |
| Códice | Las 33 fichas completas de la PWA |
| Datos | Archivo local protegido, exportación nativa e importación de copias PWA v1-v3 |
| App Store | Privacy Manifest, borradores de soporte/privacidad, esquema compartido y bundle ID preparado |

## Límites deliberados de esta fase

- Los perfiles son locales en el iPhone. No son cuentas online ni perfiles sociales.
- La importación desde la PWA es una migración puntual; no existe sincronización continua entre web e iPhone.
- Objetivo, experiencia y lugar quedan guardados y visibles, pero la rutina base conserva la prescripción original de gimnasio. Falta un catálogo estructurado de variantes para generar planes de casa con rigor.
- La duración elegida es una preferencia y no recorta series automáticamente: hacerlo sin una regla de programación validada sería engañoso.
- Las copias antiguas conservan calendario personalizado, gimnasio y rutinas propias en la base, pero todavía no tienen editores nativos completos.
- No se han añadido HealthKit, Apple Watch, nube, analítica, cuenta ni compras. Cada integración ampliaría permisos, privacidad y QA sin ser necesaria para la primera versión gratuita.
- La app requiere iOS 17 o posterior.

## Pendiente antes de beta externa

1. Instalar Xcode 26.x y compilar contra el SDK de iOS 26.
2. Revisar visualmente en tres anchos de iPhone y en dispositivo real.
3. Incorporar sprites y App Icon finales de Fable siguiendo `FABLE_ASSET_BRIEF.md`.
4. Decidir si la 1.0 se limita honestamente a gimnasio o incluye variantes estructuradas para casa.
5. Completar editores de calendario, máquinas/incrementos y rutina propia si se consideran imprescindibles para la 1.0.
6. Publicar las páginas de soporte y privacidad y completar la ficha de App Store Connect.
