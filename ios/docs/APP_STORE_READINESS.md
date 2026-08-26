# Preparación para TestFlight y App Store

## Bloqueos actuales

- Revisar y aceptar personalmente la licencia de Xcode 26.3 instalada en `/Applications/Xcode-26.3.0.app`.
- Aceptar personalmente los términos de App Store Connect que aparecen al entrar.
- Seleccionar el equipo de firma del Apple Developer Program en Xcode.

Xcode 26.3 está instalado y su paquete fue validado como software firmado por Apple y aceptado por Gatekeeper. GitHub Actions cubre mientras tanto la compilación sin firma, las pruebas y la revisión visual en Simulator. Esa compilación de CI sirve para QA, pero no es el binario de distribución: desde el 28 de abril de 2026 Apple exige Xcode 26 y el SDK de iOS 26 o posterior para nuevas subidas.

## Validación técnica completada

- 9 pruebas XCTest superadas.
- 7 chequeos deterministas del núcleo superados.
- Compilación sin firma para iOS Simulator con Xcode 16.4.
- Compilación Release separada y control automático de que los hooks de QA visual no entren en el binario.
- Capturas revisadas en iPhone SE (3.ª generación), iPhone 16 Pro y iPhone 16 Pro Max.
- Pipeline de capturas de ficha preparado para iPhone 16 Pro Max a 1320 × 2868, uno de los tamaños de 6,9 pulgadas aceptados por App Store Connect.
- Copias JPEG de máxima calidad generadas sin canal alfa; los PNG originales de Simulator conservan alfa y sirven solo para QA.
- Icono provisional original de 1024 × 1024, PNG opaco y sin esquinas preaplicadas.
- Datos de demostración para capturas aislados tras `#if DEBUG`; la compilación Release no los contiene.
- Cinco composiciones comerciales de 6,9 pulgadas generadas a 1320 × 2868, JPEG opaco.
- Marketing, privacidad y soporte publicados bajo `https://ngavilan.dev/forja/`.

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

- Borrador completo de metadatos en `APP_STORE_METADATA_ES.md`, con límites comprobados y nombre diferenciado frente a apps «Forja» ya existentes.
- Páginas de marketing, soporte y privacidad desplegadas y verificadas públicamente.
- MX y SPF de `ngavilan.dev` presentes; confirmar que `support@ngavilan.dev` entrega correctamente antes de publicar.
- Confirmar disponibilidad del nombre y copiar nombre, subtítulo, descripción y palabras clave desde el borrador.
- Sustituir o aprobar como final el icono provisional de 1024 × 1024 sin transparencia.
- Seleccionar y, si procede, componer las capturas definitivas de iPhone.
- Desplegar y comprobar la URL pública de privacidad y la URL de soporte.
- Declaración de privacidad: revisar que siga sin transmisión de datos.
- Cuestionario de edad y declaración de dispositivo médico: FORJA no es un dispositivo médico.
- DSA para distribución en la UE.
- Notas de revisión explicando el modo local, la ausencia de cuenta y el flujo de molestia.
