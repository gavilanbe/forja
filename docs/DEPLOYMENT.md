# Despliegue

## Decisión inicial

GitHub Pages es suficiente para la primera versión porque FORJA es una PWA estática y local-first.

- Cuenta prevista: `gavilanbe`.
- Repositorio previsto: `forja`.
- URL: `https://gavilanbe.github.io/forja/`.
- Base de producción de Vite: `/forja/`.
- En desarrollo local: `/`.
- Router: `HashRouter`, para que rutas internas no produzcan 404 en Pages.

La configuración de Vite debe obtener la base de una variable de build, por ejemplo `VITE_BASE_PATH`, que el workflow fijará como `/forja/`.

## Qué permite GitHub Pages

- HTTPS.
- Instalación PWA.
- Service worker y caché offline.
- Despliegue automático desde `main`.
- Dominio personalizado más adelante.

## Qué no proporciona

- Servidor propio.
- Base de datos.
- Secretos privados en runtime.
- Procesos programados o envío de push desde backend.

Para la v1 no hace falta nada de eso. Si más adelante se necesita copia entre dispositivos, cuentas o entrenamientos compartidos, se puede añadir Supabase Auth + Postgres + RLS y mantener GitHub Pages como frontend.

Nunca incluir una service-role key de Supabase en el frontend. Una clave pública/anon solo es aceptable con políticas RLS correctamente verificadas.

## Cuenta de GitHub local

La CLI tiene varias cuentas configuradas. Antes de crear el remoto, comprobar y cambiar expresamente a:

```sh
gh auth switch --hostname github.com --user gavilanbe
gh auth status
```

No ejecutar la creación del remoto, commit, push o despliegue sin autorización explícita.

Cuando el usuario lo autorice, el flujo previsto será:

```sh
gh repo create gavilanbe/forja --public --source=. --remote=origin
git add -- <rutas confirmadas>
git commit -m "Initial FORJA PWA"
git push -u origin main
```

Después: GitHub → repositorio `forja` → Settings → Pages → Source: GitHub Actions.

El workflow de `.github/workflows/pages.yml` se ejecuta cuando existan archivos de aplicación y se haga push a `main`.

## Cuándo cambiar de hosting

Mantener GitHub Pages mientras el frontend pueda hablar directamente con un backend externo seguro.

Considerar Cloudflare Pages/Workers, Vercel o similar únicamente si se necesitan APIs propias, tareas programadas, SSR, lógica privada o notificaciones push generadas por servidor.
