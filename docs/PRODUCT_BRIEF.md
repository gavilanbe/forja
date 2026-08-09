# FORJA — Product brief

## Promesa

Abrir FORJA en el gimnasio debe responder en segundos:

1. Qué toca hoy.
2. Qué ejercicio y serie vienen ahora.
3. Qué se hizo la vez anterior.
4. Cuánto descansar.
5. Si la serie está guardada en el dispositivo.
6. Cómo avanza la semana.

Registrar una serie debe requerir menos de cinco segundos.

## Concepto

FORJA presenta un bloque de seis semanas como una campaña de RPG portátil de 16 bits:

- Bloque: campaña.
- Semana: capítulo.
- Entrenamiento: misión.
- Ejercicio: etapa.
- Descanso: campamento.
- Racha semanal: Llama de la Forja.
- Récord personal: hito.

La capa de juego nunca sustituye los datos reales: ejercicio, series, repeticiones, peso, RIR y descanso permanecen dominantes.

## Bucle principal

Abrir → ver misión de hoy → iniciar → registrar serie → descanso automático → siguiente serie → completar misión → resumen → progreso semanal.

## Gamificación segura

- No hay racha diaria.
- Nahuel completa la semana con cinco sesiones previstas.
- Carlos completa la semana con tres sesiones previstas.
- Los campamentos no rompen la llama.
- El volumen extra y entrenar en días de descanso no dan XP.
- Los niveles y objetos son cosméticos.
- Una adaptación por dolor puede conservar la adherencia sin fingir series completadas.
- No se premia entrenar al fallo, ignorar dolor o añadir volumen.

## Pantallas esenciales

### Hoy

- Avatar y nivel.
- Estado de guardado/sincronización discreto.
- Llama semanal.
- Camino de siete días con misiones y campamentos.
- Tarjeta principal de la misión de hoy.
- Acción dominante `EMPEZAR MISIÓN`.
- Navegación inferior: Hoy, Campaña, Progreso, Códice y Perfil.

### Entrenamiento activo

- Un ejercicio cada vez.
- Prescripción visible.
- Rendimiento anterior.
- Peso, repeticiones y selector RIR grandes.
- Acción `GUARDAR SERIE`.
- Técnica, alternativa, máquina ocupada y molestia/dolor.
- Estado claro de guardado local.

### Descanso

- Cuenta atrás basada en timestamp absoluto.
- Añadir 15 s, pausar y omitir.
- Próxima serie y una indicación técnica.
- Sonido/vibración opcionales.

### Campaña

- Seis capítulos.
- Misiones completadas, adaptadas o pendientes.
- Semana 6 como checkpoint de evaluación, nunca como prueba máxima obligatoria.

### Progreso

- Peso y repeticiones por ejercicio.
- Cumplimiento semanal.
- Volumen, RIR, molestias e hitos.
- Gráficas que pertenezcan al lenguaje pixel art.

### Códice

- Por qué se incluye el ejercicio.
- Colocación.
- Ejecución.
- Errores frecuentes.
- Alternativas.
- Historial y notas.

## Identidad visual

RPG original de 16 bits con fantasía industrial: acero, brasas, maquinaria y mapas. Adulto, compacto y reconocible.

Paleta base:

- Fondo `#0B0F1A`
- Fondo profundo `#05070D`
- Superficie `#161D2E`
- Superficie elevada `#222B42`
- Borde acero `#3B4963`
- Texto `#F4E7C5`
- Texto secundario `#9AA7BD`
- Brasa `#FF873D`
- Oro `#FFD166`
- Completado `#50E3C2`
- Azul `#65A8FF`
- Advertencia `#F5B942`
- Peligro `#F25F5C`

Reglas:

- Grid de 8 px.
- Bordes nítidos de 2 px.
- Sombras duras desplazadas 4 px.
- Radios de 2–4 px.
- Tipografía pixel solo para títulos y etiquetas de juego.
- Tipografía sans muy legible para entrenamiento y números.
- Sprites originales incluidos localmente.
- Sin emojis, fotos de stock, glassmorphism o degradados morados.
- Sin copiar personajes o interfaces de videojuegos existentes.
- Animaciones breves mediante pasos discretos y respeto a `prefers-reduced-motion`.

## Calidad visual

La pantalla inicial debe servir como captura de lanzamiento. No debe parecer un dashboard, un wireframe, una plantilla Tailwind ni una app fitness convencional con iconos pixel añadidos.
