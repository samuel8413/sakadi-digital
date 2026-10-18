# Arquitectura

Cómo está armado el sitio y por qué. Las decisiones individuales, con las alternativas consideradas, están en [`adr/`](adr/).

## El problema

Presentar el catálogo de servicios de SAKADI DIGITAL como una página rápida, accesible e indexable, que convierta visitas en mensajes de WhatsApp. El catálogo cambia (precios, servicios nuevos, condiciones) y lo editan personas que no tocan componentes. Un error de captura debe fallar antes de publicarse, y la página nunca debe salir sin un canal de contacto.

Todo lo que sigue sale de esas restricciones. Lo que no las sirve se dejó fuera.

## Capas

```
content/*.json  ──▶  domain/schema (Zod)  ──▶  domain/normalize  ──▶  data/landing.ts  ──▶  components  ──▶  HTML
   entrada            validar forma             modelo canónico       raíz de composición    presentación
                      y referencias
```

### 1. Contenido (`content/`)

Dos archivos con ritmos de cambio distintos:

- `catalog.json`: lo que se vende. Refleja la parte pública de `catalogo-servicios.md`: servicios (para quién, incluye, no incluye, entrega, precio), planes de mantenimiento y SEO como tablas comparativas, suscripción, complementos, proceso y preguntas frecuentes.
- `site.config.json`: quién vende y cómo se presenta: marca, WhatsApp y correo, mensajes prellenados, redes, metadatos y el modo de mostrar precios.

Separarlos permite cambiar un teléfono u ocultar precios sin tocar la lista de servicios, y viceversa.

### 2. Dominio (`src/domain/`)

TypeScript puro, sin Astro ni navegador. Aquí vive la corrección; tiene ~98% de cobertura.

- `schema/` describe los archivos con Zod. Objetos estrictos (llaves desconocidas fallan), cadenas vacías se vuelven `undefined`, URLs, correos y teléfonos se validan (el teléfono se guarda como dígitos, el formato que necesita `wa.me`). El catálogo valida además **integridad referencial**: ids únicos entre servicios, planes y paquetes; recomendaciones de la guía y planes requeridos que existan; tablas de planes con un valor por plan.
- `price.ts` convierte precios del catálogo en etiquetas (`Desde $3,500`, `$450 – $800 /mes`) según el modo de `pricing.display` y la configuración regional, separando prefijo, monto y calificador para la tipografía.
- `contact.ts` arma los enlaces: WhatsApp con mensaje que nombra el servicio, luego correo, luego la sección de contacto. También da formato legible a números mexicanos.
- `normalize.ts` ensambla el `Landing` canónico: anclas con prefijo (`servicio-`, `plan-`, `paquete-`) para que nunca choquen con las secciones, referencias resueltas, tablas de planes convertidas en listas por plan. Determinista: sin reloj ni IO.
- `audit.ts` produce hallazgos editoriales (sin canal de contacto, servicio sin "no incluye", varios planes destacados). Son avisos en desarrollo y errores bloqueantes en el despliegue.

Los componentes nunca tocan el JSON crudo. Reciben el modelo canónico.

### 3. Datos (`src/data/landing.ts`)

La raíz de composición. Es el único módulo que importa los JSON: valida, normaliza, registra hallazgos y exporta `landing`, `siteConfig` y `buildYear`. Astro lo evalúa una vez por build.

### 4. Presentación (`src/components/`, `src/layouts/`, `src/pages/`)

Componentes Astro organizados por rol:

- `brand/` el isotipo en SVG (`BrandMark`) y el logo completo con wordmark (`BrandLogo`).
- `ui/` primitivas sin conocimiento del dominio (`Section`, `Card`, `ButtonLink`, `Price`, `ExternalLink`, `Icon`).
- `catalog/` piezas del catálogo (`ServiceCard`, `PlanCard`, `FeatureValue`, `RuleList`).
- `sections/` un componente por sección de la página. Las opcionales no se renderizan si están vacías.
- `layout/` encabezado, pie, selector de tema, skip link.
- `seo/` metadatos y JSON-LD.

`pages/index.astro` solo compone. Deriva la navegación de la misma lista que decide qué se renderiza, así que no pueden desincronizarse.

Los estilos son por componente más una hoja de tokens (`styles/tokens.css`) con dos capas: la paleta primitiva muestreada del logo y roles semánticos que cambian con el tema. Los componentes solo usan roles semánticos.

## Aspectos transversales

### Marca

- **Color**: tinta `#133d39`, bosque `#416a5c`, salvia `#7fa282`, cielo `#85c4d3` y crema `#faf3e8`, muestreados del logo. En claro el fondo es crema y el texto tinta; en oscuro el fondo es una tinta más profunda y el texto crema. Salvia y cielo no alcanzan 4.5:1 sobre crema, así que en claro solo decoran (nodos, viñetas, resaltados).
- **Tipografía**: Montserrat, la del logo. Peso 800 para el titular (como "SAKADI"), tracking amplio en mayúsculas para etiquetas (como "DIGITAL" y el lema).
- **Isotipo**: redibujado como SVG con la misma geometría que el logo ([ADR 0008](adr/0008-logo-as-inline-svg.md)). En modo oscuro el nodo tinta pasa a crema para no desaparecer.

### Tipos

TypeScript estricto con `noUncheckedIndexedAccess` y `erasableSyntaxOnly` (Node ejecuta los scripts sin paso de compilación). Los esquemas Zod son la fuente de los tipos crudos; el modelo canónico está escrito a mano para que se lea como dominio. `astro check` revisa las plantillas.

### Rendimiento

HTML estático sin runtime de framework. Un solo script pequeño (tema), empaquetado y con hash. Montserrat se sirve desde el propio sitio, solo el subconjunto latino (cubre el español), con `preload` y una fuente de respaldo con métricas ajustadas para evitar saltos de diseño. Hojas de estilo pequeñas en línea. Contenido de menor prioridad ("Qué no incluye", respuestas de FAQ) en `<details>` nativo, sin JavaScript.

### Accesibilidad

Landmarks, un solo `h1`, secciones etiquetadas por su encabezado, skip link, foco visible, `aria-pressed` en el selector de tema, texto para lectores de pantalla en enlaces externos y en los botones "Cotizar" repetidos (cada uno nombra su servicio), `role="list"` donde `list-style: none` quitaría la semántica en Safari, tabla comparativa con `caption` y región desplazable enfocable, soporte de movimiento reducido y tokens de color ≥ 4.5:1. La suite e2e corre axe con WCAG 2.2 AA en ambos esquemas de color y falla ante cualquier violación.

### SEO

`<title>` y descripción propios, URL canónica, Open Graph y Twitter con imagen 1200×630 generada del logo, `lang="es-MX"`, JSON-LD `ProfessionalService` con `OfferCatalog` (precios en MXN, `valueAddedTaxIncluded: false`, planes mensuales como `UnitPriceSpecification`), `WebSite` y `FAQPage`, sitemap y robots.txt. Las URLs absolutas solo se emiten si hay URL de sitio configurada; un build local nunca anuncia un origen equivocado. Con `pricing.display: "hidden"` los montos desaparecen también del JSON-LD.

### Seguridad

GitHub Pages no permite cabeceras HTTP, así que la CSP va en `<meta>`. Astro aplica hash a todo script y estilo que emite (incluida la CSS de la fuente); el único script en línea escrito a mano (arranque del tema) calcula y registra su propio hash. Política `default-src 'none'` con permisos explícitos (`img-src`, `font-src 'self'`), sin `unsafe-inline`. Sin formularios (`form-action 'none'`), sin analítica, sin terceros: la suite verifica que todas las peticiones vayan al mismo origen. Ver [ADR 0005](adr/0005-csp-on-github-pages.md).

### Despliegue

Dos workflows. `ci.yml` en pushes y PRs: contenido, lint, formato, tipos, unitarias con cobertura, build y Playwright contra el artefacto. `deploy.yml` en `main` y manual: reutiliza `ci.yml`, corre la auditoría en modo estricto, construye con la URL de `actions/configure-pages` y publica. Ver [ADR 0004](adr/0004-github-pages-deployment.md).

## Estrategia de pruebas

| Capa           | Herramienta                     | Qué demuestra                                                                                                                |
| -------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Dominio        | Vitest                          | Esquemas, integridad referencial, precios, enlaces de contacto, normalización, auditoría, JSON-LD. Contratos con `content/`. |
| Sitio generado | Playwright + axe                | WCAG 2.2 AA, landmarks, metadatos, JSON-LD, robots/404, CSP sin violaciones, sin terceros, tema, fuente, anclas, CTAs.       |
| Estático       | `astro check`, ESLint, Prettier | Tipos de plantillas, reglas de accesibilidad, estilo.                                                                        |

Las pruebas e2e recalculan el modelo desde los mismos archivos de contenido, así que siguen al contenido en lugar de fijarlo. No hay snapshots de componentes a propósito.

## Cómo extender

- **Servicio nuevo**: agrégalo a `services` en `catalog.json` con un `id` en kebab-case. Aparece con su tarjeta, su ancla, su botón de WhatsApp y su oferta en JSON-LD. Nada más cambia.
- **Plan nuevo**: agrega el plan y un valor por cada fila de `features`; el esquema avisa si falta alguno.
- **Páginas por servicio** (para SEO por servicio): una ruta `pages/servicios/[id].astro` con `getStaticPaths` sobre `landing.services`. El modelo ya tiene todo lo necesario.
- **Formulario o analítica**: requieren abrir la CSP (`form-action`, `connect-src`, `script-src`) en `astro.config.ts` y, en el caso de datos personales, el aviso de privacidad. Esa fricción es intencional.
- **Segundo idioma**: el i18n de Astro y un `content/catalog.en.json` entrarían en la capa de datos; `price.ts` ya formatea según `site.locale`.

## Notas de herramientas

- **Node 24** fijado en `.nvmrc` y `engines`; ejecuta `scripts/*.ts` nativamente (por eso los imports usan `.ts` explícito).
- **Astro 7** detecta agentes de código y manda `astro preview` a segundo plano; la config de Playwright usa `--ignore-lock` para mantenerlo en primer plano.
- **ESLint 10** con `typescript-eslint` estricto y `eslint-plugin-astro` (recommended + jsx-a11y strict). El `overrides` de `package.json` alinea `eslint-plugin-jsx-a11y` con ESLint 10 mientras publica una versión compatible.
- **Dependabot** agrupa Astro (y la fuente) y las herramientas por separado, semanalmente.
