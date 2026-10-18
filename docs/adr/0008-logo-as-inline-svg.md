# 0008. Redibujar el isotipo como SVG en línea

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

El logo existe como JPEG (1376×768, fondo crema). En una página con modo oscuro, un JPEG con fondo crema se ve como un recuadro, y el nodo tinta desaparece sobre fondo oscuro. Además, una imagen rasterizada se ve borrosa en pantallas de alta densidad si no se sirve en varios tamaños.

## Opciones

1. **Usar el JPEG** con `<Image>` responsive.
2. **PNG con transparencia.** Resuelve el fondo, no el nodo oscuro ni la nitidez.
3. **Redibujar el isotipo como SVG** con la misma geometría (seis nodos y sus arcos, incluido el corte donde un arco pasa por detrás de otro) y escribir el wordmark como texto en Montserrat.

## Decisión

Opción 3. `BrandMark.astro` es el isotipo en línea; sus colores vienen de los tokens, y el nodo tinta usa `--logo-ink`, que pasa a crema en modo oscuro. `BrandLogo.astro` compone isotipo + wordmark. `public/favicon.svg` tiene la misma geometría, con un `@media (prefers-color-scheme: dark)` propio. El JPEG original se conserva en `src/assets/brand/` para la imagen de Open Graph (1200×630).

## Consecuencias

- Logo nítido a cualquier tamaño, sin peticiones extra, legible por lectores de pantalla y con tema.
- Si el logo cambia, hay que actualizar `BrandMark.astro` y `favicon.svg` (la geometría está en ambos).
- El wordmark depende de que Montserrat cargue; el respaldo con métricas ajustadas mantiene el espacio mientras tanto.
