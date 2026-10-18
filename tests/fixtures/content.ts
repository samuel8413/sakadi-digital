import { catalogSchema, type RawCatalog } from '../../src/domain/schema/catalog.schema.ts';
import { siteConfigSchema, type SiteConfig } from '../../src/domain/schema/site-config.schema.ts';

/**
 * Smallest valid content: one of everything, so tests can override the one
 * field they are about and stay readable.
 */

export const rawConfig = () => ({
  business: { name: 'ACME DIGITAL', tagline: 'Lema', areaServed: 'México', locality: '' },
  site: {
    url: '',
    title: 'ACME',
    titleTemplate: '%s | ACME',
    description: 'Descripción',
    locale: 'es-MX',
  },
  contact: {
    whatsapp: '52 55 1234 5678',
    email: 'hola@acme.mx',
    messages: { general: 'Hola, quiero cotizar.', service: 'Hola, me interesa {servicio}.' },
  },
  pricing: { display: 'range', note: 'Antes de IVA.' },
});

const plan = (id: string, featured = false) => ({
  id,
  name: `Plan ${id}`,
  audience: 'Todos',
  price: { from: 100, to: 200, per: 'month' },
  featured,
});

export const rawCatalog = () => ({
  positioning: {
    headline: 'Titular',
    lead: 'Entrada',
    comparison: {
      caption: 'Comparativa',
      alternatives: ['Otro'],
      rows: [{ label: 'Velocidad', alternatives: ['Baja'], us: 'Alta' }],
    },
  },
  guide: { intro: 'Guía', items: [{ need: 'Necesito', recommend: ['landing', 'basico'] }] },
  services: [
    {
      id: 'landing',
      name: 'Landing',
      summary: 'Resumen',
      audience: 'Negocios',
      includes: ['Algo'],
      excludes: ['Otra cosa'],
      delivery: '1 semana',
      price: { from: 3500, to: 6000 },
      requiresPlan: 'basico',
    },
  ],
  maintenance: {
    intro: 'Mantenimiento',
    table: {
      plans: [plan('basico', true), plan('pro')],
      features: [{ label: 'Hosting', values: [true, 'Dedicado'] }],
    },
  },
  seo: {
    intro: 'SEO',
    audit: { label: 'Auditoría', description: 'Revisión', price: { from: 3000, to: 8000 } },
    table: { plans: [plan('seo-local')], features: [{ label: 'Reseñas', values: [false] }] },
  },
  subscription: {
    intro: 'Suscripción',
    packages: [
      {
        id: 'landing-suscripcion',
        name: 'Landing mensual',
        downPayment: { from: 0, to: 1000 },
        monthly: { from: 699, to: 999, per: 'month' },
        minTermMonths: 12,
        includes: 'Todo',
      },
    ],
  },
  addons: { intro: 'Extras', items: [{ name: 'Bilingüe', price: { label: '+30%' } }] },
  process: { steps: [{ title: 'Platicamos', description: 'Llamada' }] },
  faq: [{ question: '¿IVA?', answer: 'No.\n\nSon de\nreferencia.' }],
});

export const parseConfig = (overrides: (raw: ReturnType<typeof rawConfig>) => unknown = (r) => r) =>
  siteConfigSchema.parse(overrides(rawConfig()));

export const parseCatalog = (
  overrides: (raw: ReturnType<typeof rawCatalog>) => unknown = (r) => r,
): RawCatalog => catalogSchema.parse(overrides(rawCatalog()));

export type { RawCatalog, SiteConfig };
