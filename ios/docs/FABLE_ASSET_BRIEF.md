# Brief para Fable — sistema visual de avatares FORJA

## Objetivo

Sustituir los placeholders programáticos por personajes 16-bit de alta calidad sin cambiar perfiles guardados ni lógica SwiftUI. La identidad debe sentirse industrial, cálida y heroica; nunca infantil ni una copia de una franquicia existente.

## Contrato técnico

- Lienzo base recomendado: `48 × 72 px` por fotograma, fondo transparente. Mantiene la proporción 2:3 actual y permite una mejora visible en cara, pelo, ropa y accesorios.
- El renderer definitivo aún no está implementado: el placeholder actual se dibuja en una cuadrícula programática de `16 × 24`. Al integrar estos assets, debe usar nearest-neighbor y un múltiplo entero en puntos: `factor = max(1, floor(min(anchoDisponible / 48, altoDisponible / 72)))`. Después debe alinear el origen a píxel físico. En una pantalla Retina, cada píxel lógico del asset ocupará automáticamente `factor × escalaPantalla` píxeles físicos, también un número entero.
- Escalas previstas: `2×` (`96 × 144 pt`) en creador, bienvenida y resumen de misión; `1×` (`48 × 72 pt`) en Hoy, cabecera de perfil y selector de perfiles. Las cajas admiten esas medidas sin recortar. Cualquier detalle debe leerse a `1×`.
- Punto de anclaje constante: centro de los pies en todos los fotogramas.
- Paleta limitada y compartida. Las zonas recoloreables deben usar colores índice estables.
- Entrega preferida: PNG sprite sheet + JSON de metadatos por capa.
- Alternativa: PNG separado por fotograma y capa.
- Espacio de color sRGB.
- Sin sombras exteriores horneadas; la app dibuja aura y sombra de suelo.

## Capas persistentes

Los IDs siguientes ya pueden quedar guardados en dispositivos. El asset debe mapearlos; no renombrarlos.

### Cuerpo

- `agile`
- `athletic`
- `strong`
- `broad`

### Piel

- `skin-01` a `skin-05`

### Pelo

- `cropped`
- `fade`
- `curls`
- `long`
- `bun`
- `shaved`

Colores: `hair-01` a `hair-06`.

### Vestimenta

- `training`
- `smith`
- `ranger`
- `mage`

Colores: `cloth-ember`, `cloth-gold`, `cloth-forest`, `cloth-ocean`, `cloth-violet`, `cloth-ash`.

### Armadura

- `none`
- `leather`
- `iron`
- `obsidian`

### Accesorio

- `none`
- `headband`
- `glasses`
- `earring`
- `scar`

### Aura

- `none`
- `ember`
- `frost`
- `storm`
- `arcane`

## Estados y animaciones

Primera entrega:

1. `idle` — 4 fotogramas, respiración muy leve.
2. `ready` — 2 fotogramas, postura previa a misión.
3. `celebrate` — 6 fotogramas, victoria sobria.
4. `rest` — 4 fotogramas, campamento/recuperación.
5. `caution` — 2 fotogramas, aparece tras registrar molestia; sin dramatizar lesión.

Segunda entrega opcional:

- `hammer`
- `level-up`
- `walk`
- `chapter-complete`

## Reglas de producto

- Ninguna silueta se etiqueta con género.
- Todas las combinaciones deben funcionar con todos los tonos de piel.
- Armaduras y auras son cosméticas: no representan fuerza real ni ventajas.
- Evitar premio visual por dolor, entrenar al fallo o volumen extra.
- Mantener legibilidad sobre fondos carbón y pergamino.
- Preparar una versión estática por animación para Reduce Motion.

## Revisión

Entregar primero una matriz con los cuatro cuerpos, cinco pieles y seis peinados usando `training` + `cloth-ember`. Se valida silueta, contraste y encaje antes de producir el resto de combinaciones.
