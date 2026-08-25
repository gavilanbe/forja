# Ficha de App Store — español (borrador)

Este documento prepara la primera ficha pública sin escribir todavía en App Store Connect. Los textos respetan los límites vigentes de Apple a 25 de agosto de 2026.

## Identidad

- **Nombre preferido (22/30 caracteres):** `FORJA: Hipertrofia RPG`
- **Alternativa si no está disponible:** `FORJA: Diario de Gimnasio`
- **Subtítulo (29/30 caracteres):** `Constancia, series y progreso`
- **Bundle ID:** `dev.ngavilan.forja`
- **Versión inicial:** `1.0`
- **Precio:** gratis, sin compras dentro de la app
- **Idioma principal:** español de España
- **Categoría principal propuesta:** Salud y forma física
- **Categoría secundaria propuesta:** ninguna para la primera versión

El nombre definitivo depende de su disponibilidad cuando se cree el registro de la app en App Store Connect. No conviene publicar como «FORJA» a secas: ya existen al menos una app «Forja» de entretenimiento y otra «FORJA» de salud y forma física con una dirección oscura y naranja. El descriptor reduce confusión, pero antes de enviar hay que valorar también marca, icono y posicionamiento; esta búsqueda no sustituye una comprobación legal.

## Texto promocional

> Convierte seis semanas de hipertrofia en una campaña personal. Registra cada serie en segundos, entrena sin conexión y construye una constancia que puedas sostener.

## Descripción

FORJA convierte un programa de hipertrofia de seis semanas en una campaña personal con identidad RPG de 16 bits. No necesitas una cuenta, una suscripción ni cobertura en el gimnasio: tus datos se guardan en tu iPhone.

ENTRENA CON CLARIDAD

Consulta la misión del día, registra peso, repeticiones y RIR, controla los descansos y sella la sesión cuando termines. La interfaz prioriza la siguiente acción para que uses menos tiempo el teléfono y más tiempo entrenando.

PROGRESA SIN ATAJOS

FORJA aplica una doble progresión conservadora: puede sugerir el siguiente paso, pero nunca cambia tus cargas automáticamente. El XP premia las series previstas y la constancia semanal; añadir volumen por añadir no da ventaja.

UNA CAMPAÑA DE SEIS SEMANAS

Cada semana es un capítulo. Los entrenamientos son misiones y los descansos son campamentos que no rompen tu Llama de la Forja. La sexta semana es un punto de evaluación, no una prueba de máximos.

TU FORJADOR, TU RITMO

Crea perfiles locales, elige objetivo, experiencia, frecuencia, días preferidos y duración. Personaliza tu avatar por capas y consulta tu campaña, progreso, historial y códice de ejercicios.

PRIVADO Y SIN CONEXIÓN

La versión 1.0 no usa cuentas, publicidad, analítica ni servidores propios. Tu perfil y tus entrenamientos permanecen en el dispositivo. Puedes exportar una copia JSON o importar una copia compatible de FORJA web cuando tú decidas.

ENTRENAMIENTO RESPONSABLE

Puedes registrar una molestia y adaptar o detener una sesión sin perder la adherencia. FORJA organiza y registra el entrenamiento; no ofrece diagnósticos ni sustituye el consejo de profesionales sanitarios.

## Palabras clave

`gimnasio,rutina,repeticiones,rir,fuerza,fitness,offline,hábito,pesas,diario`

No se repiten términos que ya aparecen en el nombre o el subtítulo.

## URLs previstas

- **Soporte:** `https://ngavilan.dev/forja/support`
- **Privacidad:** `https://ngavilan.dev/forja/privacy`
- **Marketing opcional:** `https://ngavilan.dev/forja`

Estas rutas deben publicarse y comprobarse sin autenticación antes de introducirlas en App Store Connect.

## Privacidad en App Store Connect

Respuesta propuesta, sujeta a una última revisión del binario Release:

- «No, no recopilamos datos de esta app».
- Sin tracking.
- Sin publicidad ni analítica.
- Sin SDK de terceros que transmita datos.
- Los datos de salud y forma física permanecen en el dispositivo y solo salen mediante una exportación iniciada por la persona.
- Las notificaciones de descanso son locales.

## Información para App Review

- **Cuenta de demostración:** no necesaria; la app no usa cuentas ni inicio de sesión.
- **Acceso:** al abrirla se crea un perfil local mediante el onboarding.
- **Red:** no necesaria para el uso normal.
- **Importación:** opcional; no hace falta un archivo para revisar la app.
- **Notificaciones:** opcionales y únicamente locales para el final del descanso.
- **Dispositivo médico:** no. La app es un registro y organizador de entrenamiento.
- **Cifrado no exento:** no; el proyecto ya declara `ITSAppUsesNonExemptEncryption = NO` en Debug y Release.
- **Contacto de revisión:** completar personalmente en App Store Connect con nombre, correo y teléfono internacional reales.

### Notas propuestas para el equipo de revisión

> FORJA funciona completamente en local y no requiere una cuenta ni credenciales de demostración. Al abrir la app por primera vez, complete el breve onboarding para crear un perfil local. Puede recorrer Hoy, Campaña, Progreso, Códice y Perfil sin conexión. Las notificaciones son opcionales y solo avisan localmente del final de un descanso. La app permite registrar molestias para adaptar o detener una sesión, pero no realiza diagnósticos ni se presenta como dispositivo médico. La importación y exportación JSON son acciones manuales mediante el selector de archivos de iOS.

## Pendiente antes de copiar la ficha

1. Confirmar la disponibilidad del nombre.
2. Publicar y revisar las páginas de soporte y privacidad.
3. Confirmar derechos sobre rutina, textos del códice, fuente y assets definitivos.
4. Revisar las respuestas de privacidad contra el binario Release final.
5. Completar el cuestionario de edad, DSA y contacto de revisión personalmente.
6. Seleccionar las capturas definitivas de 6,9 pulgadas obtenidas con Xcode 26.
