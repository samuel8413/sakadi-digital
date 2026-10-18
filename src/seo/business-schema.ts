import type { Landing, PriceTag } from '../domain/model.ts';

/**
 * Builds the schema.org graph for the landing page: the business as a
 * `ProfessionalService` with its offer catalog, the `WebSite`, and the FAQ.
 * Pure and testable; the component only serialises it.
 */

export interface BusinessSchemaContext {
  /** Canonical page URL, when known. */
  readonly url?: string;
  /** Absolute URL of the logo image. */
  readonly logoUrl?: string;
  readonly description: string;
  readonly locale: string;
  readonly currency: string;
}

/** Offers carry a price specification only when amounts are published. Taxes are never included (precios antes de IVA). */
function priceSpecification(price: PriceTag | undefined, currency: string) {
  if (price?.min === undefined) return undefined;
  return {
    '@type': price.per === 'month' ? 'UnitPriceSpecification' : 'PriceSpecification',
    priceCurrency: currency,
    minPrice: price.min,
    ...(price.max !== undefined && { maxPrice: price.max }),
    ...(price.per === 'month' && { unitText: 'MON' }),
    valueAddedTaxIncluded: false,
  };
}

export function buildBusinessSchema(landing: Landing, context: BusinessSchemaContext) {
  const { business, contact, services, maintenance, seo, faq } = landing;
  const businessId = context.url ? `${context.url}#negocio` : '#negocio';

  const offers = [
    ...services.map((s) => ({ name: s.name, description: s.summary, price: s.price })),
    ...[...maintenance.plans, ...seo.plans].map((p) => ({
      name: p.name,
      description: p.audience,
      price: p.price,
    })),
  ].map((offer) => {
    const specification = priceSpecification(offer.price, context.currency);
    return {
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: offer.name, description: offer.description },
      ...(specification && { priceSpecification: specification }),
    };
  });

  const sameAs = business.social.map((entry) => entry.url);

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'ProfessionalService',
      '@id': businessId,
      name: business.name,
      slogan: business.tagline,
      description: context.description,
      ...(context.url && { url: context.url }),
      ...(context.logoUrl && { logo: context.logoUrl, image: context.logoUrl }),
      areaServed: { '@type': 'Country', name: business.areaServed },
      ...(business.locality && {
        address: { '@type': 'PostalAddress', addressLocality: business.locality },
      }),
      ...(contact.email && { email: contact.email.address }),
      ...(contact.whatsapp && { telephone: `+${contact.whatsapp.number}` }),
      currenciesAccepted: context.currency,
      knowsLanguage: context.locale,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios digitales',
        itemListElement: offers,
      },
      ...(sameAs.length > 0 && { sameAs }),
    },
    {
      '@type': 'WebSite',
      name: business.name,
      inLanguage: context.locale,
      publisher: { '@id': businessId },
      ...(context.url && { url: context.url }),
    },
  ];

  if (faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      inLanguage: context.locale,
      mainEntity: faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: { '@type': 'Answer', text: entry.answer.join('\n\n') },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Serialises for a `<script type="application/ld+json">` without enabling tag breakout. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
