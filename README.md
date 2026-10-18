# SAKADI DIGITAL — landing page

Landing page de servicios digitales de **SAKADI DIGITAL** (_Tecnología que conecta_), generada estáticamente con [Astro](https://astro.build) y publicada en GitHub Pages. El catálogo vive en JSON validado; la página es la capa de presentación encima de él.

El proyecto sigue las mismas prácticas que el portafolio [samuel8413.github.io](https://github.com/samuel8413/samuel8413.github.io): dominio sin framework y probado, contenido validado en build, CSP estricta, accesibilidad verificada en CI y decisiones documentadas. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) y los [ADR](docs/adr/).

## Qué incluye

- HTML estático, sin framework en el cliente. El único JavaScript es el selector de tema.
- Catálogo (`content/catalog.json`) validado con Zod: un error de captura o una referencia rota (una recomendación que apunta a un servicio inexistente) detiene el build con un mensaje claro.
- Marca del logo: paleta muestreada del logo, isotipo redibujado en SVG (nítido, cambia con el tema) y Montserrat auto-hospedada.
- Cada botón "Cotizar" abre WhatsApp con un mensaje que ya nombra el servicio. Sin formularios ni backend.
- Precios formateados en build según `pricing.display`: rango, "Desde" u ocultos.
- CSP estricta en `<meta>` con hashes, sin `unsafe-inline` y sin terceros.
- WCAG 2.2 AA verificado con axe en CI, en modo claro y oscuro, escritorio y móvil.
- JSON-LD `ProfessionalService` con catálogo de ofertas (MXN, antes de IVA) y `FAQPage`, Open Graph, sitemap, robots.txt, URLs canónicas.

## Inicio rápido

Requisitos: Node 24 (`.nvmrc`) y npm 10.

```sh
npm ci
npm run dev          # http://localhost:4321
```

Antes de abrir un pull request:

```sh
npm run validate     # contenido, lint, formato, tipos, pruebas unitarias
npm run build
npm run test:e2e     # Playwright + axe contra el sitio construido (primera vez: npx playwright install chromium)
```

Si `playwright install` no puede descargar el navegador (por ejemplo, detrás de un proxy que intercepta TLS), usa el Chrome instalado: `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.

## Editar el contenido

Dos archivos en `content/`:

| Archivo            | Qué es                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `catalog.json`     | Lo que se vende: servicios, planes, complementos, proceso, preguntas frecuentes.                      |
| `site.config.json` | Quién vende y cómo se presenta: marca, WhatsApp y correo, redes, metadatos, cómo se muestran precios. |

Después de editar, corre `npm run content:check`. El despliegue corre la misma revisión en modo `--strict` y **no publica** mientras haya errores bloqueantes (hoy: no hay WhatsApp ni correo configurado). Guía completa: [docs/CONTENT.md](docs/CONTENT.md).

> `catalog.json` sale de `../catalogo-servicios.md`, pero solo con lo que ve el cliente. Notas internas (márgenes, roles, capacidad, pendientes) nunca van ahí: todo lo que está en ese archivo se publica.

## Publicar en GitHub Pages

1. Sube el repositorio a GitHub.
2. En **Settings > Pages**, elige **Source: GitHub Actions**.
3. Configura `contact.whatsapp` o `contact.email` y haz push a `main`.

El workflow toma la URL y la ruta base de GitHub, así que funciona igual en `<usuario>.github.io`, `<usuario>.github.io/<repo>/` o un dominio propio. Detalles y alternativas (Cloudflare Pages): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

| Script                      | Para qué                                             |
| --------------------------- | ---------------------------------------------------- |
| `dev` / `build` / `preview` | Servidor de desarrollo, build de producción, `dist/` |
| `check`                     | Tipos de TypeScript y plantillas Astro               |
| `lint` / `lint:fix`         | ESLint (TypeScript estricto, Astro, jsx-a11y)        |
| `format` / `format:check`   | Prettier                                             |
| `test` / `test:coverage`    | Vitest para la capa de dominio y SEO                 |
| `test:e2e`                  | Playwright: accesibilidad, SEO, CSP, interacciones   |
| `content:check[:strict]`    | Valida y audita `content/*.json`                     |
| `validate`                  | Todo lo anterior excepto build y e2e                 |

## Estructura

```
content/            El catálogo y la configuración. Lo único que se edita seguido.
src/domain/         Modelo, esquemas, precios, contacto, normalizador, auditoría. Sin framework, con pruebas.
src/data/           Raíz de composición: carga, valida y expone el contenido tipado.
src/seo/            JSON-LD y metadatos.
src/components/     brand (isotipo, logo), ui, catalog (tarjetas), sections, layout, seo.
src/layouts/        Documento base (fuente, tema, CSP, metadatos).
src/pages/          index, 404, robots.txt.
src/styles/         Tokens de diseño (marca) y estilos globales.
scripts/            Validación de contenido por CLI.
tests/unit, e2e/    Vitest y Playwright.
docs/               Arquitectura, ADR, guías de contenido y despliegue.
```

## Licencia

El código es MIT. El nombre, el logo y el contenido comercial son de SAKADI DIGITAL. Ver [LICENSE](LICENSE).
