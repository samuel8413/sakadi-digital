import { z } from 'zod';
import {
  nonEmptyText,
  optionalEmail,
  optionalPhone,
  optionalText,
  optionalUrl,
} from './primitives.ts';

/**
 * Schema for `content/site.config.json`: who is selling and how the page is
 * presented (brand, contact channels, metadata, price display). It changes on
 * a different rhythm than the catalog: a new phone number or a decision to hide
 * prices should not mean touching the service list.
 */

/** Placeholder replaced with the service or plan name in WhatsApp/email messages. */
export const SERVICE_PLACEHOLDER = '{servicio}';

export const PRICE_DISPLAYS = ['range', 'from', 'hidden'] as const;
export type PriceDisplay = (typeof PRICE_DISPLAYS)[number];

export const siteConfigSchema = z.strictObject({
  business: z.strictObject({
    name: nonEmptyText,
    tagline: nonEmptyText,
    /** Where clients can be served, for copy and JSON-LD `areaServed`. */
    areaServed: nonEmptyText,
    /** City shown in the footer and JSON-LD address. Optional while the business is remote-only. */
    locality: optionalText.optional(),
  }),
  site: z.strictObject({
    /** Canonical origin. Overridden by the SITE_URL env var in CI; may be empty locally. */
    url: optionalUrl,
    /** `<title>` of the home page. */
    title: nonEmptyText,
    /** Other pages (404). `%s` is replaced with the page name. */
    titleTemplate: nonEmptyText.refine((t) => t.includes('%s'), 'titleTemplate must contain %s'),
    /** Meta description. Empty falls back to the positioning lead. */
    description: optionalText,
    /** BCP 47. Drives `<html lang>`, Open Graph locale and number formatting. */
    locale: nonEmptyText.default('es-MX'),
    /** Public repository of this site. Rendered in the footer when set. */
    repositoryUrl: optionalUrl.optional(),
  }),
  contact: z.strictObject({
    /** Sentence shown above the contact channels. */
    lead: optionalText.optional(),
    /** WhatsApp Business number with country code. Preferred channel for every CTA. */
    whatsapp: optionalPhone,
    email: optionalEmail,
    /** Attention hours. Leave empty rather than promise a response time you cannot keep. */
    hours: optionalText.optional(),
    messages: z.strictObject({
      /** Pre-filled message for the general "Cotizar" buttons. */
      general: nonEmptyText,
      /** Pre-filled message for a specific service or plan. Must contain {servicio}. */
      service: nonEmptyText.refine(
        (t) => t.includes(SERVICE_PLACEHOLDER),
        `contact.messages.service must contain ${SERVICE_PLACEHOLDER}`,
      ),
    }),
    /** Questions shown next to the channels so the first message already has what a quote needs. */
    prompts: z.array(nonEmptyText).max(6).default([]),
  }),
  social: z
    .strictObject({
      facebook: optionalUrl.optional(),
      instagram: optionalUrl.optional(),
      linkedin: optionalUrl.optional(),
      tiktok: optionalUrl.optional(),
    })
    .default({}),
  pricing: z.strictObject({
    /**
     * `range` shows "$3,500 – $6,000", `from` shows "Desde $3,500", `hidden`
     * removes amounts from the page and the structured data.
     */
    display: z.enum(PRICE_DISPLAYS).default('from'),
    currency: z.literal('MXN').default('MXN'),
    /** Disclaimer next to every price list (tax, reference prices). */
    note: nonEmptyText,
  }),
});

export type SiteConfig = z.output<typeof siteConfigSchema>;
