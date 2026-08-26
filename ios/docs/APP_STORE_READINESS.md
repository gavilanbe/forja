# Preparación para TestFlight y App Store

## Estado actual

- Licencia y primeros componentes de Xcode 26.3 configurados.
- Términos de App Store Connect aceptados por el titular.
- App ID, certificado Apple Distribution y perfil `FORJA App Store 1.0` creados.
- Archive 1.0 (build 1) firmado y exportado correctamente como IPA.
- Pendientes de titular: publicar la declaración jurídica de privacidad, confirmar derechos del contenido, completar DSA y aportar el contacto real de revisión.
- Pendiente técnico: subir el IPA con una credencial limitada de App Store Connect y esperar su procesamiento.

Xcode 26.3 está instalado y su paquete fue validado como software firmado por Apple y aceptado por Gatekeeper. GitHub Actions sigue cubriendo compilación, pruebas y revisión visual en Simulator. El archive de distribución se ha creado localmente con Xcode 26.3 y el SDK de iOS incluido.

## Validación técnica completada

- 11 pruebas XCTest superadas.
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
- Archive de distribución 1.0 (build 1) firmado con Apple Distribution y validado con `codesign`.
- IPA exportado mediante el método `app-store-connect`.

## Producto

- Validar onboarding con una persona que no conozca la rutina original.
- Decidir si la primera versión pública admite 3–5 días únicamente o incorpora constructor completo de rutinas.
- Añadir editor de calendario y de gimnasio con paridad completa respecto a la PWA.
- Sustituir los placeholders de personaje y, si Fable propone una dirección mejor, el icono provisional por assets finales.
- Revisar derechos del manual y añadir licencia OFL de Press Start 2P si se incorpora la fuente.

## QA iPhone

- Archive de distribución compilado con Xcode 26.3 y deployment target iOS 17.
- Repetir la matriz de simuladores con Xcode 26 antes del archivo final.
- Dispositivo físico: modo avión, segundo plano, bloqueo de pantalla y poca batería.
- VoiceOver, Dynamic Type, Increase Contrast y Reduce Motion.
- Exportar, eliminar e importar una copia PWA v2/v3.
- Verificar que doble toque y reintentos no duplican XP.

## App Store Connect

- Borrador completo de metadatos en `APP_STORE_METADATA_ES.md`, con límites comprobados y nombre diferenciado frente a apps «Forja» ya existentes.
- Páginas de marketing, soporte y privacidad desplegadas y verificadas públicamente.
- MX y SPF de `ngavilan.dev` presentes; confirmar que `support@ngavilan.dev` entrega correctamente antes de publicar.
- Nombre, subtítulo, descripción y palabras clave guardados en la versión 1.0.
- Sustituir o aprobar como final el icono provisional de 1024 × 1024 sin transparencia.
- Cinco capturas definitivas de iPhone de 6,9 pulgadas subidas.
- URL pública de privacidad y URL de soporte guardadas y comprobadas.
- Declaración de privacidad preparada como `Data Not Collected`; falta la publicación jurídica por el titular.
- Clasificación de edad calculada en 9+ y guardada. Declarado que FORJA no es un dispositivo médico.
- DSA para distribución en la UE.
- Notas de revisión explicando el modo local, la ausencia de cuenta y el flujo de molestia.
