# 0002. Validar el catálogo con Zod y normalizarlo en un modelo de dominio

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

El catálogo de servicios cambia: precios por validar con la investigación de mercado, servicios nuevos, condiciones. Lo editan personas que no tocan componentes. Los errores típicos son de captura (un precio invertido, un id mal escrito en una recomendación, una tabla de planes con un valor de menos) y de omisión (publicar sin teléfono).

## Opciones

1. **Contenido en el marcado.** Cada cambio de precio es un cambio de componente; sin validación.
2. **Colecciones de contenido de Astro.** Validan con Zod, pero acoplan el dominio a Astro y no cubren bien la integridad entre colecciones ni los scripts de CLI.
3. **Esquema + normalizador propios.** Zod valida forma e integridad referencial; un normalizador puro produce un modelo canónico; una auditoría separa errores de completitud.

## Decisión

Opción 3. `content/catalog.json` (lo que se vende) y `content/site.config.json` (quién vende y cómo se presenta) se validan con `src/domain/schema/*` y se normalizan con `src/domain/normalize.ts`. Los componentes solo ven el `Landing` canónico.

- Las referencias se validan en el esquema: ids únicos en un solo espacio de nombres, recomendaciones y planes requeridos existentes, tablas de planes completas.
- Los precios se guardan como números y se formatean en build según `pricing.display`, así que cambiar de "Desde" a rangos, u ocultarlos, es una línea.
- La completitud (sin canal de contacto, servicio sin "no incluye") son _hallazgos de auditoría_: avisan en desarrollo y bloquean solo el despliegue. Se puede trabajar el sitio antes de tener el número de WhatsApp sin riesgo de publicar una página sin contacto.

## Consecuencias

- Editar el catálogo es editar JSON; el build dice qué está mal y dónde.
- El dominio es independiente del framework y está probado, con pruebas de contrato contra los archivos reales.
- Una prueba impide que palabras de las notas internas lleguen al archivo publicado.
- Zod corre solo en build; no llega nada al navegador.
