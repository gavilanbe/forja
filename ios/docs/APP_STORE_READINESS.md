# Preparación para TestFlight y App Store

## Bloqueos del equipo actual

- Descargar e instalar Xcode 26.x completo; la descarga oficial requiere que el titular autentique su Apple Account.
- Seleccionar el equipo de firma del Apple Developer Program.

El Mac ya dispone de espacio suficiente y es compatible con Xcode 26.3. GitHub Actions cubre mientras tanto la compilación sin firma, las pruebas y la revisión visual en Simulator. Esa compilación de CI sirve para QA, pero no es el binario de distribución: desde el 28 de abril de 2026 Apple exige Xcode 26 y el SDK de iOS 26 o posterior para nuevas subidas.

## Validación técnica completada

- 9 pruebas XCTest superadas.
- 7 chequeos deterministas del núcleo superados.
- Compilación sin firma para iOS Simulator con Xcode 16.4.
- Capturas revisadas en iPhone SE (3.ª generación), iPhone 16 Pro y iPhone 16 Pro Max.
- Icono provisional original de 1024 × 1024, PNG opaco y sin esquinas preaplicadas.
- Datos de demostración para capturas aislados tras `#if DEBUG`; la compilación Release no los contiene.

## Producto

- Validar onboarding con una persona que no conozca la rutina original.
- Decidir si la primera versión pública admite 3–5 días únicamente o incorpora constructor completo de rutinas.
- Añadir editor de calendario y de gimnasio con paridad completa respecto a la PWA.
- Sustituir los placeholders de personaje y, si Fable propone una dirección mejor, el icono provisional por assets finales.
- Revisar derechos del manual y añadir licencia OFL de Press Start 2P si se incorpora la fuente.

## QA iPhone

- Compilar el archivo de distribución con Xcode 26, SDK de iOS 26 y deployment target iOS 17.
- Repetir la matriz de simuladores con Xcode 26 antes del archivo final.
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
