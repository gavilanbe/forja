# Assets de App Store

Las capturas comerciales en `es-ES/6.9` se generan a partir de las capturas
limpias de iPhone 16 Pro Max producidas por CI. El resultado es JPEG opaco a
1320 x 2868, sin marcos de dispositivo ni afirmaciones sobre funciones que no
existen en la version 1.0.

Para regenerarlas:

```bash
ios/scripts/generate_app_store_screenshots.sh \
  /ruta/al/artifact/app-store-6.9 \
  ios/AppStoreAssets/es-ES/6.9
```

Orden propuesto para la ficha:

1. Hoy
2. Entrenamiento activo
3. Campana
4. Progreso
5. Perfil

