import {
  fillServiceMessage,
  formatPhone,
  inquiryHref,
  mailtoHref,
  whatsappHref,
} from './contact.ts';
import {
  SOCIAL_NETWORKS,
  type Landing,
  type OfferingRef,
  type Plan,
  type Service,
} from './model.ts';
import { formatPrice, type PriceFormat } from './price.ts';
import type { RawCatalog } from './schema/catalog.schema.ts';
import type { RawPrice } from './schema/primitives.ts';
import type { SiteConfig } from './schema/site-config.schema.ts';

/** Anchor prefixes keep offering ids from colliding with section ids (`seo` the section vs `seo-local` the plan). */
export const ANCHOR_PREFIX = { service: 'servicio', plan: 'plan', package: 'paquete' } as const;

/**
 * Plan names are short ("Básico") and only read well under their section
 * heading. Messages leave the page, so they say what kind of plan it is.
 */
export const PLAN_KIND = { maintenance: 'plan de mantenimiento', seo: 'plan' } as const;

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0);
}

type RawPlanTable = RawCatalog['maintenance']['table'];

/**
 * Turns the validated catalog plus site config into the canonical `Landing`.
 * Pure and deterministic: same inputs, same output, no clock, no IO.
 */
export function normalizeLanding(catalog: RawCatalog, config: SiteConfig): Landing {
  const format: PriceFormat = {
    display: config.pricing.display,
    locale: config.site.locale,
    currency: config.pricing.currency,
  };
  // Prices are optional everywhere: offerings quoted case by case carry none.
  const price = (raw: RawPrice | undefined) => raw && formatPrice(raw, format);

  const channels = { whatsapp: config.contact.whatsapp, email: config.contact.email };
  const { general, service: serviceTemplate } = config.contact.messages;
  /** `article` reads before the name in the message only: "Me interesa el plan…", "Cotización: plan…". */
  const inquiry = (name: string, article?: string) =>
    inquiryHref(
      channels,
      fillServiceMessage(serviceTemplate, article ? `${article} ${name}` : name),
      `Cotización: ${name} — ${config.business.name}`,
    );

  const refs = new Map<string, OfferingRef>();
  /** References are validated by the catalog schema; a miss here is a bug, not a content error. */
  const resolve = (id: string): OfferingRef => {
    const ref = refs.get(id);
    if (!ref) throw new Error(`Unresolved offering "${id}" passed schema validation.`);
    return ref;
  };
  const register = (prefix: string, item: { id: string; name: string }): OfferingRef => {
    const ref = { id: item.id, name: item.name, anchor: `${prefix}-${item.id}` };
    refs.set(item.id, ref);
    return ref;
  };

  const plans = (table: RawPlanTable, kind: string): Plan[] =>
    table.plans.map((plan, index) => ({
      ...register(ANCHOR_PREFIX.plan, plan),
      audience: plan.audience,
      price: price(plan.price),
      featured: plan.featured,
      features: table.features.map((feature) => {
        const value = feature.values[index];
        // Row length equals plan count by schema; guard the invariant instead of asserting it.
        if (value === undefined)
          throw new Error(`Feature "${feature.label}" has no value for ${plan.id}.`);
        return { label: feature.label, value };
      }),
      inquiryHref: inquiry(`${kind} ${plan.name}`, 'el'),
    }));

  const maintenancePlans = plans(catalog.maintenance.table, PLAN_KIND.maintenance);
  const seoPlans = plans(catalog.seo.table, PLAN_KIND.seo);

  const packages = catalog.subscription?.packages.map((pkg) => ({
    ...register(ANCHOR_PREFIX.package, pkg),
    downPayment: price(pkg.downPayment),
    monthly: price(pkg.monthly),
    minTermMonths: pkg.minTermMonths,
    includes: pkg.includes,
    inquiryHref: inquiry(pkg.name),
  }));

  const services: Service[] = catalog.services.map((service) => ({
    ...register(ANCHOR_PREFIX.service, service),
    badge: service.badge,
    summary: service.summary,
    audience: service.audience,
    includes: service.includes,
    excludes: service.excludes,
    delivery: service.delivery,
    price: price(service.price),
    extras: service.extras.map((extra) => ({ label: extra.label, price: price(extra.price) })),
    thirdPartyCosts: service.thirdPartyCosts,
    requiredPlan: service.requiresPlan ? resolve(service.requiresPlan) : undefined,
    featured: service.featured,
    inquiryHref: inquiry(service.name),
  }));

  const social = SOCIAL_NETWORKS.flatMap((network) => {
    const url = config.social[network];
    return url ? [{ network, url }] : [];
  });

  return {
    business: { ...config.business, social },
    contact: {
      lead: config.contact.lead,
      whatsapp: channels.whatsapp
        ? {
            number: channels.whatsapp,
            display: formatPhone(channels.whatsapp),
            href: whatsappHref(channels.whatsapp, general),
          }
        : undefined,
      email: channels.email
        ? {
            address: channels.email,
            href: mailtoHref(channels.email, `Cotización — ${config.business.name}`, general),
          }
        : undefined,
      hours: config.contact.hours,
      prompts: config.contact.prompts,
      inquiryHref: inquiryHref(channels, general, `Cotización — ${config.business.name}`),
    },
    pricingNote: config.pricing.display === 'hidden' ? undefined : config.pricing.note,
    positioning: catalog.positioning,
    guide: {
      intro: catalog.guide.intro,
      items: catalog.guide.items.map((item) => ({
        need: item.need,
        recommendations: item.recommend.map(resolve),
        note: item.note,
      })),
    },
    services,
    maintenance: {
      intro: catalog.maintenance.intro,
      quote: catalog.maintenance.quote,
      plans: maintenancePlans,
      rules: catalog.maintenance.rules,
    },
    seo: {
      intro: catalog.seo.intro,
      audit: {
        label: catalog.seo.audit.label,
        description: catalog.seo.audit.description,
        price: price(catalog.seo.audit.price),
      },
      plans: seoPlans,
      rules: catalog.seo.rules,
    },
    subscription: catalog.subscription &&
      packages && {
        intro: catalog.subscription.intro,
        packages,
        rules: catalog.subscription.rules,
      },
    addons: {
      intro: catalog.addons.intro,
      items: catalog.addons.items.map((item) => ({
        label: item.name,
        price: price(item.price),
        featured: item.featured,
      })),
    },
    process: catalog.process,
    faq: catalog.faq.map((entry) => ({
      question: entry.question,
      answer: splitParagraphs(entry.answer),
    })),
  };
}
