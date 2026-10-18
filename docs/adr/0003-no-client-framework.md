# 0003. No enviar framework de UI al cliente

Estado: aceptada. Fecha: 2026-10-17.

## Contexto

La página tiene una sola interacción con estado (el selector de tema). Lo demás es lectura, anclas y enlaces a WhatsApp. Los visitantes llegan sobre todo desde el celular.

## Opciones

1. **Islas de React** para las partes interactivas: ~45 kB para un botón.
2. **TypeScript en `<script>` de Astro.** Empaquetado y con hash; sin runtime.
3. **Cero JavaScript.** El tema seguiría solo al sistema.

## Decisión

Opción 2 para el tema. El contenido secundario ("Qué no incluye", respuestas de FAQ) usa `<details>` nativo; la navegación usa anclas; los CTA son enlaces.

## Consecuencias

- JavaScript casi nulo: la mayor palanca de rendimiento y de simplicidad de la CSP.
- Una calculadora de paquetes o un filtro de servicios (ideas del catálogo) podrían agregarse como isla solo en ese componente. La decisión es reversible por componente.
