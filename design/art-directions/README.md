# Direcciones artísticas de FORJA — laboratorio comparativo

Tres direcciones audiovisuales completas y deliberadamente distintas para el
rediseño de la capa visual. La lógica de producción no se ha tocado: todo vive
en `src/devart/` y solo existe en desarrollo.

## Cómo compararlas en vivo

```bash
npm run dev
# abrir http://localhost:5173/#/dev/art-directions
```

Pestañas: dirección (A/B/C) × sección (Art bible · Sprites · Motion lab ·
Data-viz · Vertical slice). La vertical slice tiene sus seis pantallas: Hoy,
Registro, Descanso, Campaña, Progreso y Final. El Motion lab reproduce las
siete secuencias interactivas por dirección.

## Direcciones

- `a-monumental/` — **A · Forja Monumental.** Fantasía industrial
  cinematográfica: personajes 48×48 protagonistas, luz única de fragua,
  placas de hierro, golpes con anticipación/impacto/sacudida. Datos como
  raíl remachado, calderas de presión, hogares y lingotes.
- `b-codice/` — **B · Códice Táctico.** Instrumentación de herrería:
  blueprint, pergamino, latón calibrado y lacre. Sprites 32×32 de manual
  técnico, movimiento mecánico de compás, datos como instrumentos y libro
  mayor.
- `c-arcade/` — **C · Acero Arcade.** Recreativa de los 90: contornos de
  2px, contraste alto, hit-stop, flashes y recompensas expresivas. Datos
  como racks de discos, medidores de calor y muros de medallas.

## Contenido de cada carpeta

- `01-art-bible*.png` — biblia visible (paleta, luz, materiales, tipografía,
  resolución, contornos, dithering, escala, fps, reglas de movimiento y
  reduced motion).
- `02-sprites*.png` — avatares (7 estados animados), atrezzo, sellos y los
  seis ambientes de capítulo.
- `03-data-viz*.png` — visualizaciones de forja con valores reales legibles.
- `04-slice-*.png` — las seis pantallas de la vertical slice a 390×844.
- `motion-1..7.webm` — grabaciones de las siete secuencias del motion lab:
  1 guardar serie · 2 iniciar descanso · 3 récord · 4 adaptar misión ·
  5 completar entrenamiento · 6 llama semanal · 7 desbloquear capítulo.

Regenerar todo: `node scripts/art-capture.mjs` (con el dev server activo).
