# 0004. Desplegar con GitHub Actions y resolver URLs con `configure-pages`

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

GitHub Pages sirve un repositorio como `https://<usuario>.github.io/`, `https://<usuario>.github.io/<repo>/` o bajo un dominio propio. Astro necesita `site` y `base` en build para URLs canónicas, sitemap, rutas de assets y `robots.txt`.

## Opciones

1. **Fijar `site` y `base`** en `astro.config`. Se rompe al renombrar o al agregar dominio.
2. **Pages por rama** (`gh-pages`). Requiere commitear el build; sin protección de entorno.
3. **GitHub Actions con `actions/configure-pages`**, que expone `origin` y `base_path`, pasados al build como `SITE_URL` y `BASE_PATH`.

## Decisión

Opción 3, igual que el proyecto de referencia. El workflow de despliegue reutiliza `ci.yml` (producción no puede saltarse un check que los PRs sí pasan), corre la auditoría en modo `--strict` y despliega con `concurrency: pages` sin cancelación.

## Consecuencias

- Renombrar, hacer fork o agregar dominio no cambia código.
- Los términos de GitHub Pages desaconsejan usarlo como hosting de un negocio en línea. Para una landing informativa es zona gris; [DEPLOYMENT.md](../DEPLOYMENT.md) documenta Cloudflare Pages como alternativa sin cambios de código, con cabeceras HTTP reales.
- `public/.nojekyll` se conserva por si se usa el modo por rama.
