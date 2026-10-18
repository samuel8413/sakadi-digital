import { describe, expect, it } from 'vitest';
import { normalizeLanding } from '../../src/domain/normalize.ts';
import { buildBusinessSchema, serializeJsonLd } from '../../src/seo/business-schema.ts';
import { parseCatalog, parseConfig } from '../fixtures/content.ts';

const context = { description: 'D', locale: 'es-MX', currency: 'MXN' };
type Node = Record<string, unknown>;
const graphOf = (schema: ReturnType<typeof buildBusinessSchema>) => schema['@graph'] as Node[];

describe('buildBusinessSchema', () => {
  const landing = normalizeLanding(parseCatalog(), parseConfig());

  it('describes the business with its offer catalog, the site and the FAQ', () => {
    const graph = graphOf(buildBusinessSchema(landing, context));
    expect(graph.map((node) => node['@type'])).toEqual([
      'ProfessionalService',
      'WebSite',
      'FAQPage',
    ]);
    const business = graph[0]!;
    expect(business).toMatchObject({
      name: 'ACME DIGITAL',
      email: 'hola@acme.mx',
      telephone: '+525512345678',
      areaServed: { '@type': 'Country', name: 'México' },
    });
    expect(business.url).toBeUndefined();
  });

  it('prices offers in MXN, before tax, with monthly plans as unit prices', () => {
    const business = graphOf(buildBusinessSchema(landing, context))[0]!;
    const offers = (business.hasOfferCatalog as { itemListElement: Node[] }).itemListElement;
    expect(offers[0]!.priceSpecification).toEqual({
      '@type': 'PriceSpecification',
      priceCurrency: 'MXN',
      minPrice: 3500,
      maxPrice: 6000,
      valueAddedTaxIncluded: false,
    });
    expect(offers[1]!.priceSpecification).toMatchObject({
      '@type': 'UnitPriceSpecification',
      unitText: 'MON',
    });
  });

  it('publishes no amounts when prices are hidden, and links ids to the canonical URL', () => {
    const hidden = normalizeLanding(
      parseCatalog((raw) => ({ ...raw, faq: [] })),
      parseConfig((raw) => ({ ...raw, pricing: { ...raw.pricing, display: 'hidden' } })),
    );
    const graph = graphOf(
      buildBusinessSchema(hidden, {
        ...context,
        url: 'https://acme.mx/',
        logoUrl: 'https://acme.mx/l.jpg',
      }),
    );
    const business = graph[0]!;
    expect(JSON.stringify(business)).not.toContain('priceSpecification');
    expect(business['@id']).toBe('https://acme.mx/#negocio');
    expect(business.logo).toBe('https://acme.mx/l.jpg');
    expect(graph).toHaveLength(2);
  });

  it('serialises without allowing a closing script tag', () => {
    expect(serializeJsonLd({ text: '</script>' })).toBe('{"text":"\\u003c/script>"}');
  });
});
