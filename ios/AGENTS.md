# FORJA iOS — reglas del proyecto

## Fuente de verdad

- La PWA original en `/Users/nahuelgavilan/forja` es la referencia funcional.
- Este proyecto es una implementación nativa paralela. No modificar la PWA desde aquí.
- `ForjaApp/Core` contiene dominio y persistencia sin dependencias de SwiftUI.
- `ForjaApp/Features` contiene las pantallas SwiftUI.
- Los identificadores de ejercicios, avatares y cosméticos son contratos persistentes: no renombrarlos sin migración.

## No negociables

- Offline-first: guardar una serie nunca espera a la red.
- Cada mutación crítica se persiste de forma atómica.
- El temporizador se basa en una fecha final absoluta, no en ejecución continua en segundo plano.
- No premiar volumen extra, dolor ni entrenar al fallo.
- Las sugerencias de progresión se explican y nunca se aplican automáticamente.
- Mantener importación compatible con copias JSON de la PWA.
- La UI pública no debe depender de perfiles llamados Nahuel o Carlos.
- Respetar Dynamic Type, VoiceOver, Reduce Motion, contraste y objetivos táctiles de 44 pt.
- No añadir analítica, publicidad, backend o HealthKit sin autorización explícita.
- No hacer commit, push, deploy, envío a TestFlight ni App Store sin autorización explícita.

## Assets

- El avatar se compone por capas con IDs estables: cuerpo, piel, pelo, color de pelo, ropa, armadura, accesorio y aura.
- Los placeholders programáticos pueden reemplazarse por sprites de Fable sin cambiar modelos o datos.
- Mantener pixel snapping y escalado entero; nunca suavizar pixel art.

## Verificación

- Ejecutar `swift test` para el núcleo.
- Con Xcode disponible: compilar en un simulador iPhone, ejecutar pruebas UI y revisar al menos 360, 390 y 430 pt de ancho.
- Probar cierre/reapertura, segundo plano, notificaciones, importación, modo avión y Dynamic Type.
