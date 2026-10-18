# Editar el contenido

Todo lo que muestra el sitio sale de dos archivos JSON en `content/`. Nunca hace falta tocar componentes para cambiar lo que se dice.

```sh
npm run content:check          # valida + lista hallazgos
npm run content:check:strict   # lo que corre el despliegue; falla con errores bloqueantes
npm run dev                    # verlo en vivo
```

Las llaves desconocidas fallan la validación a propósito, para que un error de dedo no desaparezca en silencio. Las cadenas vacías (`""`) cuentan como "no hay dato".

## Regla de oro

Todo lo que está en `catalog.json` **se publica**. Lleva solo lo que el cliente debe leer. Márgenes, roles internos, capacidad, pendientes y notas de estrategia se quedan en `catalogo-servicios.md`. Una prueba revisa que ciertas palabras internas no aparezcan.

## `content/site.config.json`

| Llave                             | Para qué                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `business.name`, `tagline`        | Nombre y lema. Encabezado, pie, metadatos y JSON-LD.                                                           |
| `business.areaServed`, `locality` | País atendido y ciudad (opcional). JSON-LD y pie.                                                              |
| `site.url`                        | Origen canónico para builds locales. El despliegue lo sobrescribe. Déjalo vacío si no estás seguro.            |
| `site.title`                      | `<title>` de la página principal.                                                                              |
| `site.titleTemplate`              | Otras páginas (404). `%s` se reemplaza por el nombre de la página.                                             |
| `site.description`                | Meta descripción (se recorta a 155 caracteres). Vacía usa la entrada del posicionamiento.                      |
| `site.locale`                     | `es-MX`. Define `lang`, el locale de Open Graph y el formato de números.                                       |
| `site.repositoryUrl`              | Si se llena, el pie muestra "Código fuente".                                                                   |
| `contact.whatsapp`                | Número de WhatsApp Business **con lada de país**: `"52 55 1234 5678"`. Espacios, guiones y `+` se aceptan.     |
| `contact.email`                   | Correo. Respaldo cuando no hay WhatsApp.                                                                       |
| `contact.hours`                   | Horario de atención. Mejor vacío que prometer tiempos que no se pueden cumplir.                                |
| `contact.messages.general`        | Mensaje prellenado de los botones generales ("Cotiza tu proyecto").                                            |
| `contact.messages.service`        | Mensaje prellenado por servicio. Debe contener `{servicio}`, que se reemplaza por el nombre del servicio.      |
| `contact.prompts`                 | Hasta 6 preguntas que se muestran junto al contacto, para que el primer mensaje traiga lo necesario.           |
| `social.*`                        | URLs de Facebook, Instagram, LinkedIn, TikTok. Vacías no se muestran.                                          |
| `pricing.display`                 | `"from"` (Desde $3,500), `"range"` ($3,500 – $6,000) o `"hidden"` (sin montos, ni en la página ni en JSON-LD). |
| `pricing.note`                    | Aviso junto a los precios (IVA, precios de referencia).                                                        |

## `content/catalog.json`

### Precios

Un precio es un rango numérico o una etiqueta libre:

```jsonc
{ "from": 3500, "to": 6000 }                          // $3,500 – $6,000  /  Desde $3,500
{ "from": 60000, "to": 150000, "openEnded": true }    // $60,000 – $150,000+
{ "from": 10000, "openEnded": true, "per": "month" }  // Desde $10,000 /mes
{ "from": 15, "to": 30, "per": "item" }               // $15 – $30 c/u
{ "from": 800, "to": 1500, "suffix": "+ licencia" }   // $800 – $1,500 + licencia
{ "label": "+30 a 50% del proyecto" }                 // tal cual
```

Pesos enteros, antes de IVA. `to` debe ser mayor que `from`.

Todos los precios son opcionales (servicios, extras, planes, auditoría, suscripción y complementos). Sin precio, la oferta se muestra sin monto y se cotiza caso por caso. Recuerda que `catalog.json` es público en el repositorio: un precio oculto con `pricing.display: "hidden"` sigue visible en el código fuente.

### Secciones

| Llave                            | Notas                                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `positioning.headline`           | La propuesta de valor. Es el único `h1` de la página.                                                                                                                              |
| `positioning.proofPoints[]`      | Hasta 4 `{ title, description }`.                                                                                                                                                  |
| `positioning.comparison`         | Tabla contra alternativas. Cada fila lleva un valor por alternativa, más el nuestro (`us`).                                                                                        |
| `guide.items[]`                  | "¿Qué necesitas?": `need` y `recommend` (ids de servicios, planes o paquetes, en orden). Un id inexistente falla la validación.                                                    |
| `services[]`                     | `id` (kebab-case, único), `name`, `badge?`, `summary`, `audience`, `includes[]`, `excludes[]`, `delivery`, `price`, `extras[]?`, `thirdPartyCosts?`, `requiresPlan?`, `featured?`. |
| `services[].excludes`            | "Qué no incluye". Igual de importante que lo que sí: protege el alcance. Vacío genera aviso.                                                                                       |
| `services[].requiresPlan`        | Id de un plan de **mantenimiento**. La tarjeta enlaza al plan.                                                                                                                     |
| `maintenance.table`, `seo.table` | `plans[]` y `features[]`. Cada `features[].values` lleva un valor por plan, en orden: `true` (incluido), `false` (no incluido) o texto.                                            |
| `subscription`                   | Opcional. Sin esta llave la página no muestra la sección de suscripción. `packages[]`: `downPayment`, `monthly`, `minTermMonths`, `includes`.                                      |
| `addons.items[]`                 | `name`, `price`, `featured?` (se resalta).                                                                                                                                         |
| `process`                        | `steps[]`, `payments[]` (`when`, `scheme`), `guarantees[]`.                                                                                                                        |
| `faq[]`                          | `question`, `answer`. Párrafos separados por una línea en blanco (`\n\n`).                                                                                                         |

Los ids se convierten en anclas (`#servicio-lp-esencial`, `#plan-estandar`, `#paquete-landing-suscripcion`) y en el mensaje de WhatsApp de cada tarjeta. Cambiar un id rompe enlaces compartidos: hazlo solo si es necesario.

## Hallazgos que puedes ver

| Hallazgo                              | Severidad | Significado                                              |
| ------------------------------------- | --------- | -------------------------------------------------------- |
| `contact`: sin canal de contacto      | error     | Ni WhatsApp ni correo. **El despliegue está bloqueado.** |
| `contact.whatsapp`: sin WhatsApp      | aviso     | Los botones usarán correo.                               |
| `contact.whatsapp`: no empieza con 52 | aviso     | Revisa la lada de país.                                  |
| `site.description` vacía              | aviso     | Se usa la entrada del posicionamiento como descripción.  |
| `services[n].excludes` vacío          | aviso     | Ese servicio no dice qué no incluye.                     |
| varios planes destacados              | aviso     | Destacar uno solo se lee más claro.                      |
| `faq` vacío                           | aviso     | No hay preguntas frecuentes.                             |
