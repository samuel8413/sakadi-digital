# 0007. Contacto por enlaces de WhatsApp prellenados, sin formularios

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

Los clientes objetivo (micronegocios y pymes en México) prefieren WhatsApp. El sitio es estático: un formulario necesitaría un backend o un servicio de terceros, abriría la CSP (`form-action`, `connect-src`) y recolectaría datos personales que exigen aviso de privacidad (LFPDPPP).

## Opciones

1. **Formulario con servicio externo** (Formspree, Netlify Forms).
2. **Solo un número visible.**
3. **Enlaces `wa.me` con mensaje prellenado** en cada CTA, con el nombre del servicio o plan; correo como respaldo; la sección de contacto como último recurso.

## Decisión

Opción 3. `src/domain/contact.ts` arma los enlaces; cada tarjeta tiene su propio mensaje ("Hola, SAKADI DIGITAL. Me interesa Catálogo Digital…"). La sección de contacto agrega las preguntas del cuestionario de descubrimiento para que el primer mensaje ya traiga lo necesario.

## Consecuencias

- Cero backend, cero datos guardados por el sitio y CSP intacta.
- El negocio sabe desde el primer mensaje qué servicio interesa.
- Sin canal configurado, la auditoría bloquea el despliegue: nunca se publica una página sin forma de contacto.
- Medir conversiones requeriría analítica, que hoy no se envía (ver ADR 0005).
