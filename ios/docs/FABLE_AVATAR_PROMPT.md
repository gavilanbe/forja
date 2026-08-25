# Prompt para Fable — rediseño sustancial de avatares

Copia y pega desde “Encargo” hasta “Antes de producir”. Adjunta también `FABLE_ASSET_BRIEF.md` y, si Fable puede leer el proyecto, indícale la ruta `ForjaApp/DesignSystem/PixelAvatarView.swift` únicamente como referencia del contrato actual.

---

## Encargo

Quiero rediseñar sustancialmente el sistema de avatares de FORJA, una app de entrenamiento para iPhone con estética RPG pixel-art inspirada en la era de 16 bits. No quiero un retoque del placeholder actual: necesito una dirección artística nueva, reconocible y con calidad de producto publicado.

Trabaja solo en los personajes y sus assets. No rediseñes la UI, no cambies los nombres de las opciones persistentes y no generes todavía el App Icon.

## Sensación buscada

- “Forja industrial + fantasía sobria + entrenamiento contemporáneo”.
- Personajes con presencia y silueta clara, no chibi, infantil ni cómica.
- Heroicos pero humanos; la fuerza no debe depender de un único tipo de cuerpo.
- Cálidos, táctiles y legibles sobre fondos carbón y pergamino.
- Originales: no copiar Los Sims, Pokémon, Final Fantasy, Habbo ni ninguna franquicia.
- Pixel art auténtico: sin antialiasing, blur, ruido de IA, píxeles semitransparentes en contornos ni iluminación inconsistente.

## Resolución y sistema

- Lienzo lógico por fotograma: `48 × 72 px`, proporción 2:3 y fondo transparente.
- Escalado en la app únicamente por nearest-neighbor y múltiplos enteros cuando sea posible.
- Misma caja, anclaje de pies, altura de ojos y origen para todas las capas.
- Contorno consistente de 1–2 píxeles y una única dirección de luz.
- Paleta limitada y documentada; las zonas recoloreables deben usar índices estables.
- Capas separadas: cuerpo/piel, pelo, vestimenta, armadura, accesorio y aura.
- Ninguna capa puede contener partes de otra categoría ni fondos horneados.

## Identidad y variedad

Mantén exactamente estos IDs, porque se guardan en los perfiles:

- Cuerpo: `agile`, `athletic`, `strong`, `broad`.
- Piel: `skin-01` a `skin-05`.
- Pelo: `cropped`, `fade`, `curls`, `long`, `bun`, `shaved`.
- Vestimenta: `training`, `smith`, `ranger`, `mage`.
- Armadura: `none`, `leather`, `iron`, `obsidian`.
- Accesorio: `none`, `headband`, `glasses`, `earring`, `scar`.
- Aura: `none`, `ember`, `frost`, `storm`, `arcane`.

No etiquetes cuerpos, ropa o pelo por género. Todas las combinaciones deben funcionar con todos los tonos de piel y tipos de cuerpo. Evita que `broad` o `strong` parezcan automáticamente “mejores” y que `agile` parezca débil.

## Animaciones de la primera entrega

- `idle`: 4 frames, respiración sutil.
- `ready`: 2 frames, preparación antes de entrenar.
- `celebrate`: 6 frames, victoria contenida, no caricaturesca.
- `rest`: 4 frames, recuperación/campamento.
- `caution`: 2 frames, atención tras registrar molestia, sin representar lesión.

Incluye un frame estático representativo de cada estado para Reduce Motion.

## Contextos que debes demostrar

El renderer de sprites todavía no está implementado: la app actual dibuja un placeholder programático de `16 × 24`. Para los nuevos PNG, la integración usará nearest-neighbor y calculará `factor = max(1, floor(min(anchoDisponible / 48, altoDisponible / 72)))`. El origen se alineará a píxel físico; al usar un factor entero en puntos, Retina también produce un múltiplo físico entero.

Enséñame cada propuesta exactamente en estas dos escalas de uso, sin interpolación:

1. `2×` → `96 × 144 pt`: creador de avatar, bienvenida y resumen de misión.
2. `1×` → `48 × 72 pt`: identidad de Hoy, cabecera de perfil y selector de forjadores.

Incluye el PNG original `48 × 72 px` y mockups `@2x` y `@3x` de ambos tamaños. La cara, el pelo, el tipo de cuerpo y al menos un accesorio deben seguir siendo distinguibles a `1×`. No diseñes detalles esenciales que solo aparezcan a `2×`. Si la resolución no ofrece suficiente legibilidad, señálalo en la primera ronda antes de producir toda la matriz; no la cambies por tu cuenta.

## Entregables

Primera ronda, solo exploración:

- Tres direcciones artísticas realmente distintas, cada una con un personaje completo.
- Para cada dirección: `athletic` y `broad`, dos tonos de piel, tres peinados y dos vestimentas.
- Hoja de comparación en los tres tamaños de uso.
- Paleta propuesta y explicación de 4–6 decisiones visuales.
- Una prueba de apilado mostrando las capas separadas y después combinadas.

Después de elegir una dirección:

- PNG sprite sheets con transparencia por capa y animación.
- JSON con frame, duración, anclaje, layer ID y orden de apilado.
- Contact sheet con todas las combinaciones base.
- Archivo fuente editable y paleta maestra.
- Informe de QA indicando combinaciones revisadas y cualquier solapamiento pendiente.

## Criterios de aceptación

- Ningún salto entre frames ni al cambiar cuerpo, pelo o ropa.
- Todos los assets encajan en la misma caja y anclaje.
- Sin seams, halos, píxeles suavizados ni fondos residuales.
- Contraste legible sobre `#17130F`, `#211A16` y `#F1E1C2`.
- La silueta se reconoce a 48 × 72 px.
- Las cinco pieles mantienen detalle facial y contraste sin aclarar u oscurecer rasgos de manera inconsistente.
- El resultado parece una familia coherente, no assets generados por prompts separados.

## Antes de producir

No generes toda la matriz todavía. Primero entrega las tres direcciones y espera mi elección. Si alguna combinación o animación requiere cambiar el contrato técnico, señálalo antes de crear assets finales; no renombres IDs por tu cuenta.

---
