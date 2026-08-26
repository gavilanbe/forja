# FORJA para iPhone

Implementación nativa de FORJA en SwiftUI. Convive con la PWA original y conserva sus principios: entrenamiento local-first, campaña de seis semanas, registro honesto, progresión conservadora y estética RPG de 16 bits.

## Qué incluye esta base

- Creación de perfiles sin nombres predefinidos.
- Objetivo, experiencia, disponibilidad, duración y días de entrenamiento.
- Estudio de avatar por capas preparado para sprites definitivos de Fable.
- Rutina estructurada de FORJA y códice importados desde la PWA.
- Hoy, entrenamiento, descanso, campaña, progreso, códice y perfil.
- Persistencia JSON atómica completamente local.
- Importación de copias PWA v1–v3 y exportación nativa.
- Temporizador mediante fecha final absoluta, notificaciones locales y hápticos.
- Núcleo independiente de SwiftUI con pruebas mediante Swift Package Manager.

## Abrir el proyecto

1. Instala Xcode 26.x.
2. Abre `ForjaIOS.xcodeproj`.
3. En Signing & Capabilities, selecciona el equipo de `nahuelgavilanbe@gmail.com`.
4. Comprueba el identificador `dev.ngavilan.forja` y elige un simulador de iPhone.
5. Ejecuta la aplicación.

Antes de preparar un archivo para App Store, ejecuta:

```sh
ios/scripts/release_preflight.sh
```

El preflight exige Xcode 26, SDK de iOS 26, licencia aceptada, configuración de firma,
repositorio limpio, páginas públicas disponibles, pruebas verdes y un binario
Release sin los hooks de QA. Cuando todo pase, `archive_release.sh` crea el
archivo firmado sin subirlo. Necesita `FORJA_TEAM_ID`, el perfil
`FORJA App Store 1.0` instalado y, si la identidad vive en un llavero dedicado,
`FORJA_SIGNING_KEYCHAIN`. Ninguno de esos valores se guarda en el proyecto.

El proyecto apunta a iOS 17 o posterior. Esto permite una base moderna sin obligarnos a usar SwiftData: el almacén es explícito, portable y compatible con las copias de la PWA.

## Validación sin Xcode

```sh
swift run forja-core-checks
```

Este verificador cubre los recursos importados, planificación, niveles, temporizador absoluto, doble pulsación, cierre de misión, borrado/XP y copias nativas usando solo las Command Line Tools.

La suite XCTest queda en `Tests/ForjaCoreTests` para ejecutarla con Xcode completo. La interfaz iOS necesita el SDK incluido con Xcode y no se puede compilar con unas Command Line Tools sin `UIKit`, `SwiftUI` para iOS ni `XCTest`.

## Datos y privacidad

FORJA no necesita cuenta, servidor ni conexión. Los datos viven en el dispositivo y solo salen cuando la persona exporta deliberadamente una copia. Consulta `docs/PRIVACY_POLICY_DRAFT.md` antes de publicar.

## Assets definitivos

Los personajes actuales son placeholders nativos por capas. `docs/FABLE_ASSET_BRIEF.md` define nombres, tamaños y contratos para sustituirlos sin romper perfiles existentes. `docs/FABLE_AVATAR_PROMPT.md` contiene el encargo listo para copiar en Fable.

## UX

`docs/UX_AUDIT.md` explica la jerarquía de producto, los problemas encontrados, los cambios aplicados y las comprobaciones visuales pendientes cuando Xcode esté disponible.
