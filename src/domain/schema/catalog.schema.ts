import { z } from 'zod';
import { nonEmptyText, optionalText, priceSchema, slugId, stringList } from './primitives.ts';

/**
 * Schema for `content/catalog.json`: what SAKADI DIGITAL sells, as published.
 *
 * It mirrors the client-facing parts of the internal catalog
 * (`catalogo-servicios.md`): services, recurring plans, add-ons, process and
 * terms. Internal notes (margins, roles, capacity, pending tasks) never belong
 * here, because everything in this file is rendered.
 *
 * Shape errors and broken references (a guide entry pointing at a service that
 * does not exist) fail validation. Completeness is the audit's job.
 */

const textBlockSchema = z.strictObject({
  title: nonEmptyText,
  description: nonEmptyText,
});

const comparisonSchema = z
  .strictObject({
    /** Accessible table caption. */
    caption: nonEmptyText,
    /** Column headers for the alternatives, left to right. Our column is always last. */
    alternatives: stringList.min(1),
    rows: z
      .array(
        z.strictObject({
          label: nonEmptyText,
          alternatives: stringList.min(1),
          us: nonEmptyText,
        }),
      )
      .min(1),
  })
  .superRefine((comparison, ctx) => {
    comparison.rows.forEach((row, index) => {
      if (row.alternatives.length !== comparison.alternatives.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['rows', index, 'alternatives'],
          message: `Row "${row.label}" has ${row.alternatives.length} values but there are ${comparison.alternatives.length} alternatives.`,
        });
      }
    });
  });

const serviceSchema = z.strictObject({
  id: slugId,
  name: nonEmptyText,
  /** Short ribbon on the card: "Para empezar", "Más pedido". */
  badge: optionalText.optional(),
  summary: nonEmptyText,
  /** "Para quién". */
  audience: nonEmptyText,
  includes: stringList.min(1),
  /** "No incluye". As important as what is included: it protects the scope. */
  excludes: stringList.default([]),
  delivery: nonEmptyText,
  price: priceSchema,
  /** Priced variations: extra products, upgrades, phases. */
  extras: z.array(z.strictObject({ label: nonEmptyText, price: priceSchema })).default([]),
  /** Technology, in one line. */
  stack: optionalText.optional(),
  /** Costs the client pays to third parties (Shopify plan, payment fees). */
  thirdPartyCosts: optionalText.optional(),
  /** Id of the minimum maintenance plan the service must be paired with. */
  requiresPlan: slugId.optional(),
  featured: z.boolean().default(false),
});

const planSchema = z.strictObject({
  id: slugId,
  name: nonEmptyText,
  audience: nonEmptyText,
  price: priceSchema,
  featured: z.boolean().default(false),
});

/** `true` renders as included, `false` as not included, text as itself. */
const featureValueSchema = z.union([z.boolean(), nonEmptyText]);

/**
 * Plans are written as the comparison table they are in the catalog (one row
 * per feature, one value per plan), which keeps every plan answering the same
 * questions. The normaliser turns it into one feature list per plan.
 */
const planTableSchema = z
  .strictObject({
    plans: z.array(planSchema).min(1),
    features: z
      .array(z.strictObject({ label: nonEmptyText, values: z.array(featureValueSchema) }))
      .min(1),
  })
  .superRefine((table, ctx) => {
    table.features.forEach((feature, index) => {
      if (feature.values.length !== table.plans.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['features', index, 'values'],
          message: `Feature "${feature.label}" has ${feature.values.length} values but there are ${table.plans.length} plans.`,
        });
      }
    });
  });

const subscriptionPackageSchema = z.strictObject({
  id: slugId,
  name: nonEmptyText,
  downPayment: priceSchema,
  monthly: priceSchema,
  minTermMonths: z.number().int().min(1).max(60),
  includes: nonEmptyText,
});

export const catalogSchema = z
  .strictObject({
    positioning: z.strictObject({
      /** The value proposition. Rendered as the page's only `h1`. */
      headline: nonEmptyText,
      lead: nonEmptyText,
      proofPoints: z.array(textBlockSchema).max(4).default([]),
      comparison: comparisonSchema,
    }),
    guide: z.strictObject({
      intro: nonEmptyText,
      items: z
        .array(
          z.strictObject({
            need: nonEmptyText,
            /** Service or plan ids, in the order they should be recommended. */
            recommend: z.array(slugId).min(1),
            note: optionalText.optional(),
          }),
        )
        .min(1),
    }),
    services: z.array(serviceSchema).min(1),
    maintenance: z.strictObject({
      intro: nonEmptyText,
      quote: optionalText.optional(),
      table: planTableSchema,
      rules: stringList.default([]),
    }),
    seo: z.strictObject({
      intro: nonEmptyText,
      audit: z.strictObject({ label: nonEmptyText, description: nonEmptyText, price: priceSchema }),
      table: planTableSchema,
      rules: stringList.default([]),
    }),
    subscription: z.strictObject({
      intro: nonEmptyText,
      packages: z.array(subscriptionPackageSchema).min(1),
      rules: stringList.default([]),
    }),
    addons: z.strictObject({
      intro: nonEmptyText,
      items: z
        .array(
          z.strictObject({
            name: nonEmptyText,
            price: priceSchema,
            featured: z.boolean().default(false),
          }),
        )
        .min(1),
    }),
    process: z.strictObject({
      steps: z.array(textBlockSchema).min(1),
      payments: z.array(z.strictObject({ when: nonEmptyText, scheme: nonEmptyText })).default([]),
      guarantees: stringList.default([]),
    }),
    faq: z.array(z.strictObject({ question: nonEmptyText, answer: nonEmptyText })).default([]),
  })
  .superRefine((catalog, ctx) => {
    // Every offering shares one id namespace: ids become DOM anchors and guide targets.
    const offerings = [
      ...catalog.services.map((s, i) => ({ id: s.id, path: ['services', i, 'id'] })),
      ...catalog.maintenance.table.plans.map((p, i) => ({
        id: p.id,
        path: ['maintenance', 'table', 'plans', i, 'id'],
      })),
      ...catalog.seo.table.plans.map((p, i) => ({
        id: p.id,
        path: ['seo', 'table', 'plans', i, 'id'],
      })),
      ...catalog.subscription.packages.map((p, i) => ({
        id: p.id,
        path: ['subscription', 'packages', i, 'id'],
      })),
    ];

    const seen = new Set<string>();
    for (const { id, path } of offerings) {
      if (seen.has(id)) ctx.addIssue({ code: 'custom', path, message: `Duplicate id "${id}".` });
      seen.add(id);
    }

    catalog.guide.items.forEach((item, i) => {
      item.recommend.forEach((id, j) => {
        if (!seen.has(id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['guide', 'items', i, 'recommend', j],
            message: `Unknown offering "${id}". Use the id of a service, plan or subscription package.`,
          });
        }
      });
    });

    const maintenanceIds = new Set(catalog.maintenance.table.plans.map((p) => p.id));
    catalog.services.forEach((service, i) => {
      if (service.requiresPlan && !maintenanceIds.has(service.requiresPlan)) {
        ctx.addIssue({
          code: 'custom',
          path: ['services', i, 'requiresPlan'],
          message: `Unknown maintenance plan "${service.requiresPlan}".`,
        });
      }
    });
  });

export type RawCatalog = z.output<typeof catalogSchema>;
