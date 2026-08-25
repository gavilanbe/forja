# Preparación para TestFlight y App Store

## Bloqueos del equipo actual

- Instalar Xcode 26.x completo.
- Liberar espacio suficiente para Xcode, un runtime de simulador y DerivedData.
- Seleccionar el equipo de firma del Apple Developer Program.

## Producto

- Validar onboarding con una persona que no conozca la rutina original.
- Decidir si la primera versión pública admite 3–5 días únicamente o incorpora constructor completo de rutinas.
- Añadir editor de calendario y de gimnasio con paridad completa respecto a la PWA.
- Sustituir placeholders de personaje y app icon por assets finales.
- Revisar derechos del manual y añadir licencia OFL de Press Start 2P si se incorpora la fuente.

## QA iPhone

- Compilar con iOS 26 SDK y deployment target iOS 17.
- Simuladores equivalentes a 360, 390 y 430 pt de ancho.
- Dispositivo físico: modo avión, segundo plano, bloqueo de pantalla y poca batería.
- VoiceOver, Dynamic Type, Increase Contrast y Reduce Motion.
- Exportar, eliminar e importar una copia PWA v2/v3.
- Verificar que doble toque y reintentos no duplican XP.

## App Store Connect

- Nombre, subtítulo, descripción y palabras clave.
- Icono 1024 × 1024 sin transparencia.
- Capturas de iPhone.
- URL pública de privacidad y URL de soporte.
- Declaración de privacidad: revisar que siga sin transmisión de datos.
- Cuestionario de edad y declaración de dispositivo médico: FORJA no es un dispositivo médico.
- DSA para distribución en la UE.
- Notas de revisión explicando el modo local, la ausencia de cuenta y el flujo de molestia.
