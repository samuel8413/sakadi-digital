# 0006. Auto-hospedar Montserrat con la API de fuentes de Astro

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

El logo usa una sans geométrica (Montserrat): "SAKADI" en negrita y apretada, "DIGITAL" y el lema con tracking amplio. El proyecto de referencia usa la pila de fuentes del sistema para no hacer peticiones de fuentes, pero aquí la tipografía es parte de la marca.

## Opciones

1. **Fuentes del sistema.** Cero costo; pierde la identidad del logo.
2. **Google Fonts por CDN.** Simple, pero agrega un origen de terceros (CSP, privacidad, una conexión extra).
3. **Paquete `@fontsource-variable/montserrat` + API de fuentes de Astro (`fontProviders.local()`).** La fuente viene del lockfile, sin red en build. Astro emite el `@font-face`, un respaldo con métricas ajustadas (sin salto de diseño), el `preload` y registra el hash del estilo en la CSP.

## Decisión

Opción 3, solo con el subconjunto latino del eje variable (cubre á é í ó ú ü ñ ¿ ¡) en un único archivo woff2 para todos los pesos.

## Consecuencias

- Una petición de fuente (~38 kB), precargada y desde el mismo origen.
- Dependabot actualiza la fuente junto con Astro.
- Si se agrega otro idioma con caracteres fuera del latín básico, hay que sumar el subconjunto `latin-ext`.
