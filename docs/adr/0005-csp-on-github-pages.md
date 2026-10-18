# 0005. Enviar una Content Security Policy estricta como meta tag

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

GitHub Pages no permite cabeceras HTTP personalizadas, así que una CSP solo puede ir en `<meta http-equiv>`, donde `frame-ancestors`, `report-uri` y `sandbox` se ignoran. Astro 7 aplica hash a todo script y estilo que emite cuando `security.csp` está activo, incluida la CSS de su API de fuentes. No cubre scripts `is:inline` escritos a mano.

## Opciones

1. **Sin CSP.**
2. **CSP permisiva** con `'unsafe-inline'`: parece política, protege poco.
3. **CSP estricta con hashes**, con el único script en línea (arranque del tema, que debe correr antes del primer pintado) registrando su propio hash.

## Decisión

Opción 3: `default-src 'none'`, `img-src 'self' data:`, `font-src 'self'`, `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`, `upgrade-insecure-requests`, más los `script-src` y `style-src` con hash de Astro.

- Sin formularios ni analítica ni embeds de terceros; el contacto sale por enlaces (ADR 0007).
- Fuente auto-hospedada (ADR 0006), así que `font-src` es solo `'self'`.
- El marcado de imágenes usa atributos `data-`, no estilos en línea.
- La suite e2e ejercita las rutas interactivas y falla ante cualquier violación de CSP o petición a otro origen.

## Consecuencias

- Agregar un script, fuente o imagen externa exige editar `astro.config.ts` a propósito. Esa fricción es la idea (por ejemplo, agregar GA4 o Meta Pixel).
- La protección contra clickjacking no está disponible en Pages; con Cloudflare Pages y `_headers` sí.
