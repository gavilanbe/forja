# Auditoría UX de FORJA iOS

## Dirección de producto

FORJA debe sentirse como una herramienta de entrenamiento tranquila con identidad RPG, no como un dashboard ni como un juego que interrumpe el entrenamiento. La prioridad visual siempre es:

1. Qué toca hacer ahora.
2. Qué dato necesita la persona para continuar.
3. Qué se ha guardado y qué ocurrirá después.
4. Contexto, progreso y ambientación.

## Problemas detectados en el primer corte

### Jerarquía y tamaños

- Había muchos títulos con tamaños fijos entre 21 y 48 puntos. Esto podía producir saltos visuales y mala adaptación a Dynamic Type.
- Casi todos los bloques se presentaban como tarjetas con el mismo peso, por lo que misión, ayuda y ajustes competían visualmente.
- El encabezado de Perfil dedicaba demasiado alto de pantalla a un avatar decorativo.
- Las tres métricas de Progreso podían comprimirse demasiado en iPhone estrecho o con texto grande.

### Onboarding y perfil

- La bienvenida no compartía la barra de acción persistente de los demás pasos.
- Crear un segundo perfil abría un flujo sin salida de cancelación.
- La numeración `0/5` era técnica; no comunicaba un progreso humano.
- El estudio de avatar mostraba todas las categorías a la vez y generaba un scroll largo, poco parecido a un creador de personaje.

### Entrenamiento

- El Stepper de repeticiones se superponía con un valor grande y dependía demasiado del layout interno de iOS.
- Peso, repeticiones, RIR, sugerencia y descanso competían en la misma zona.
- Las filas de series podían desbordar con Dynamic Type.
- Faltaba una acción clara para cerrar el teclado decimal.

### Claridad de producto

- Elegir casa o mixto podía sugerir que la rutina se transformaba, aunque la prescripción importada sigue siendo de gimnasio.
- La duración elegida es todavía una preferencia y no una reducción automática de volumen.
- Los perfiles son locales, no cuentas públicas o sociales.

## Cambios aplicados en esta revisión

- Escala tipográfica semántica y espaciado compartido.
- Superficies primarias y secundarias con distinta jerarquía.
- Onboarding con CTA persistente, pasos legibles y cancelación para perfiles adicionales.
- Estudio de avatar por categorías, resumen de selección y aleatorización.
- Hoy ordenado alrededor de la misión principal antes del contexto semanal.
- Controles explícitos de repeticiones y RIR, teclado cerrable y filas adaptativas.
- Perfil más compacto y métricas adaptativas.
- Mensajes honestos para casa/mixto y para funciones aún no automatizadas.

## Segunda revisión (senior iOS, sin Xcode)

Cambios acotados que hacen la app más coherente en iPhone real sin rediseñar por gusto:

- **Dynamic Type real en toda la app**: `forjaLabel(_:)` y `forjaTitle(_:)` seguían usando tamaños fijos (8–28 pt) en 47 puntos de uso. Ahora se traducen a estilos de texto del sistema (`caption2`, `caption`, `footnote`, `title3`, `title`…) manteniendo la firma, así que kickers, pills, cabeceras de grupo y el selector de días escalan con el ajuste de accesibilidad. Los sitios estrechos (tira semanal, etiquetas del gráfico, métricas, contadores) reciben `lineLimit(1)` + `minimumScaleFactor` para no desbordar.
- **Botones del sistema de diseño**: texto centrado y multilínea con padding horizontal en primario/secundario para que las etiquetas largas envuelvan en 320 pt en lugar de truncarse; el estilo compacto añade `contentShape` para que toda la cápsula sea pulsable.
- **Descanso en la misión**: háptico de éxito cuando el temporizador llega a cero en primer plano (antes solo avisaba la notificación en segundo plano; respeta la preferencia de hápticos), etiqueta «Descanso en pausa», botón «Saltar»/«Continuar» en lugar del ambiguo «Cerrar», «Pausa» deshabilitado al terminar, botones apilados con `ViewThatFits` cuando no caben, y lectura VoiceOver en minutos y segundos.
- **Registro de series**: campo de peso etiquetado para VoiceOver; el control de repeticiones es un único elemento ajustable (deslizar arriba/abajo) con áreas de pulsación de 44 × 52 pt; cada serie guardada se lee como una frase completa y la papelera sigue siendo un elemento aparte; la cabecera de etapa se lee como «Misión activa. Etapa 2 de 6».
- **Resumen de misión**: el avatar pasa a `maxWidth/maxHeight` para que no expulse el botón «Volver a la fragua» en iPhone SE con texto grande.
- **Hoy**: cabecera de identidad como un solo elemento accesible, barra de nivel y pulso semanal etiquetados, duración leída como «Entre 60 y 75 minutos», y las cifras de etapas/series se apilan cuando no caben.
- **Onboarding y editor de perfil**: botón de retroceso etiquetado, indicador «Paso x de y» como cabecera, selección de 3/4/5 días y días preferidos con rasgo `isSelected` y `contentShape`, sliders de duración con etiqueta y valor, tarjetas de objetivo/experiencia con rasgo `isSelected`, campo de nombre sin autocorrección. Se retira el hueco de 104 pt bajo el contenido, redundante con la barra de acción persistente.
- **Perfil**: selector de forjadores con rasgo `isSelected` y pista de acción; barra de nivel etiquetada.
- **Progreso**: métricas y resumen de sesión como elementos combinados; el resumen de detalle usa una rejilla adaptativa en lugar de un `HStack` fijo de tres columnas.
- **Códice**: el recuento de ejercicios sale del contenido cargado (no «33» fijo) y la ficha muestra el nombre del ejercicio como título de navegación.
- **Campaña**: cada capítulo del mapa se lee como una sola frase en VoiceOver.
- **Contrato con Fable**: el prompt y el brief distinguen el placeholder actual de `16 × 24` del futuro sprite de `48 × 72` y fijan dos escalas enteras: `2×` en creador/resumen y `1×` en Hoy/perfil/selector. Hoy y el selector ganan el espacio mínimo necesario para mostrar `48 × 72 pt` sin interpolación; Retina conserva el múltiplo físico entero. Los IDs de capa no cambian.

No se tocó `ForjaApp/Core`, ni IDs persistentes, ni reglas de dominio.

## Validación pendiente con Xcode

- iPhone SE o ancho equivalente a 320–360 pt.
- iPhone de 390 pt y Max de 430 pt.
- Dynamic Type en tamaños por defecto, XL y accesibilidad.
- VoiceOver y orden de foco durante una misión.
- Teclado decimal, temporizador en segundo plano y retorno desde bloqueo.
- Reduce Motion, Increase Contrast y orientación vertical en dispositivo real.
