# 0001. Usar Astro como generador de sitio estático

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

Una landing de contenido casi estático que debe cargar rápido en celulares de gama media, posicionar en Google y publicarse en un hosting de archivos estáticos. Es también la primera muestra de trabajo del negocio: tiene que demostrar lo que se vende ("sitios rápidos, seguros y que sí aparecen en Google"). El catálogo recomienda Astro para landings.

## Opciones

1. **Next.js (export estático).** Stack familiar; framework y toolchain pesados para una página, y la optimización de imágenes necesita un loader propio en hosting estático.
2. **WordPress o un constructor (Wix).** Justo lo que el posicionamiento critica: lento, con plugins o con lock-in.
3. **Astro.** HTML estático por defecto, imágenes y fuentes optimizadas en build, hash de CSP integrado, sitemap, estilos por componente y plantillas tipadas. Islas disponibles si algún día hace falta interactividad.
4. **HTML a mano.** Lo más simple, pero el contenido viviría en el marcado, sin validación ni reutilización.

## Decisión

Astro 7, sin integraciones de framework de UI.

## Consecuencias

- Rendimiento de primer nivel sin esfuerzo: sin hidratación ni runtime.
- El contenido vive en JSON validado; el marcado se genera.
- La misma base sirve como "starter kit" de landings para clientes, como sugiere el catálogo.
- Astro 7 requiere Node 22.12+; el proyecto fija Node 24 en `.nvmrc`.
