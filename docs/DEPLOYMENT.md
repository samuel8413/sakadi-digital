# Despliegue

## Configuración inicial (una vez)

1. Crea un repositorio en GitHub y sube este proyecto.
2. **Settings > Pages > Build and deployment > Source**: elige **GitHub Actions**.
3. Llena `contact.whatsapp` o `contact.email` en `content/site.config.json`. Sin al menos uno, el despliegue se bloquea a propósito.
4. Opcional: agrega un dominio propio en la misma pantalla de Pages. El código no cambia.

## Qué pasa al hacer push a `main`

`.github/workflows/deploy.yml`:

1. **Calidad** (reutiliza `ci.yml`): contenido, lint, formato, `astro check`, unitarias con cobertura, build y Playwright con axe.
2. **Build de producción**: `content:check --strict` (bloquea si no hay canal de contacto), luego `astro build` con `SITE_URL` y `BASE_PATH` tomados de `actions/configure-pages`.
3. **Despliegue** al entorno `github-pages`.

También se puede lanzar a mano desde la pestaña Actions.

## Verificación local antes del push

```sh
npm run validate                 # contenido, lint, formato, tipos, unitarias
npm run build                    # base "/", sin URLs canónicas
npm run test:e2e                 # contra dist/ (requiere: npx playwright install chromium)
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e   # alternativa con el Chrome instalado

# Simular un sitio de proyecto
SITE_URL=https://usuario.github.io BASE_PATH=/sakadi-digital npm run build
npm run preview                  # luego abre http://localhost:4321/sakadi-digital/
```

## Antes de publicar el negocio en GitHub Pages

Los [términos de GitHub Pages](https://docs.github.com/pages/getting-started-with-github-pages/github-pages-limits) indican que Pages no está pensado como hosting gratuito para operar un negocio en línea ni sitios cuyo fin principal sean transacciones comerciales. Una landing informativa sin pagos suele estar en zona gris. Si prefieres no depender de esa interpretación, **Cloudflare Pages** (la opción que el propio catálogo recomienda para clientes) sirve este mismo `dist/` sin cambios:

- Build command: `npm run content:check:strict && npm run build`
- Output directory: `dist`
- Variables: `SITE_URL=https://tu-dominio.mx`, `NODE_VERSION=24`

Además, Cloudflare permite cabeceras HTTP reales con un archivo `public/_headers`, lo que habilita `frame-ancestors`, HSTS y la CSP como cabecera (ver [ADR 0005](adr/0005-csp-on-github-pages.md)).

## Problemas comunes

| Síntoma                                                            | Causa                                                             | Solución                                                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| El despliegue falla en "Validate content (strict)"                 | Errores editoriales bloqueantes (p. ej. sin WhatsApp ni correo)   | Corre `npm run content:check` y corrige `content/`.                                |
| Assets 404 en `<usuario>.github.io/<repo>/`                        | Pages no está en "GitHub Actions", o el build no tuvo `BASE_PATH` | Revisa Settings > Pages. El workflow define `BASE_PATH`; no lo fijes en el código. |
| URL canónica incorrecta tras agregar un dominio propio             | Build en caché                                                    | Vuelve a correr el workflow; `configure-pages` lee el dominio actual.              |
| `robots.txt` no se toma en cuenta                                  | Sitio de proyecto: los buscadores solo leen la raíz del dominio   | Esperado. Usa un sitio de usuario o dominio propio.                                |
| Playwright: "Process from config.webServer exited early"           | Otro `astro preview` en segundo plano tiene el lock del puerto    | `npx astro preview stop` y vuelve a correr.                                        |
| `playwright install` falla con `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` | Proxy que intercepta TLS                                          | `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. No desactives la verificación TLS.   |

## Notas de seguridad para quien opera

- El sitio no tiene servidor, formularios ni scripts de terceros. La superficie de ataque es el repositorio: protege `main` exigiendo el check de `CI` y revisa los PRs de Dependabot.
- Permisos mínimos en los workflows: `contents: read` en todo, `pages: write` e `id-token: write` solo en el despliegue.
- El número de WhatsApp y el correo quedan públicos en la página y en el JSON-LD. Usa los del negocio, no personales.
