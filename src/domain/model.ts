/**
 * Canonical domain model consumed by the UI.
 *
 * Everything here is already validated, trimmed, formatted and shaped for
 * presentation: prices are display strings, contact links are final hrefs,
 * references between offerings are resolved. Components must never reach back
 * into the raw JSON.
 */

export interface PriceTag {
  /** The whole price as one string: "Desde $450 /mes", "$3,500 – $6,000", "+30–50% del proyecto". */
  readonly label: string;
  /** The same price split for typesetting: a small prefix, the amount, a small qualifier. */
  readonly prefix?: string;
  readonly amount: string;
  readonly qualifier?: string;
  /** Numeric bounds for structured data. Absent for free-text prices. */
  readonly min?: number;
  readonly max?: number;
  readonly per?: 'month' | 'item';
}

/** Pointer to another offering on the page (guide recommendations, required plans). */
export interface OfferingRef {
  readonly id: string;
  readonly name: string;
  /** In-page anchor of the offering's card, without `#`. */
  readonly anchor: string;
}

export interface PricedItem {
  readonly label: string;
  /** Absent when prices are hidden. */
  readonly price?: PriceTag;
}

export interface Service {
  readonly id: string;
  readonly anchor: string;
  readonly name: string;
  readonly badge?: string;
  readonly summary: string;
  readonly audience: string;
  readonly includes: readonly string[];
  readonly excludes: readonly string[];
  readonly delivery: string;
  readonly price?: PriceTag;
  readonly extras: readonly PricedItem[];
  readonly stack?: string;
  readonly thirdPartyCosts?: string;
  readonly requiredPlan?: OfferingRef;
  readonly featured: boolean;
  /** WhatsApp/email link with a message naming this service. */
  readonly inquiryHref: string;
}

export interface PlanFeature {
  readonly label: string;
  /** `true` included, `false` not included, text for anything more specific. */
  readonly value: boolean | string;
}

export interface Plan {
  readonly id: string;
  readonly anchor: string;
  readonly name: string;
  readonly audience: string;
  readonly price?: PriceTag;
  readonly featured: boolean;
  readonly features: readonly PlanFeature[];
  readonly inquiryHref: string;
}

export interface SubscriptionPackage {
  readonly id: string;
  readonly anchor: string;
  readonly name: string;
  readonly downPayment?: PriceTag;
  readonly monthly?: PriceTag;
  readonly minTermMonths: number;
  readonly includes: string;
  readonly inquiryHref: string;
}

export interface TextBlock {
  readonly title: string;
  readonly description: string;
}

export interface Comparison {
  readonly caption: string;
  readonly alternatives: readonly string[];
  readonly rows: readonly {
    readonly label: string;
    readonly alternatives: readonly string[];
    readonly us: string;
  }[];
}

export interface GuideItem {
  readonly need: string;
  readonly recommendations: readonly OfferingRef[];
  readonly note?: string;
}

export interface FaqEntry {
  readonly question: string;
  /** The answer split into paragraphs. */
  readonly answer: readonly string[];
}

export interface WhatsAppChannel {
  /** Digits only, with country code. */
  readonly number: string;
  /** Human-readable: "+52 55 1234 5678". */
  readonly display: string;
  readonly href: string;
}

export interface EmailChannel {
  readonly address: string;
  readonly href: string;
}

export interface Contact {
  readonly lead?: string;
  readonly whatsapp?: WhatsAppChannel;
  readonly email?: EmailChannel;
  readonly hours?: string;
  readonly prompts: readonly string[];
  /** Best available link for a general quote request. Falls back to the contact section. */
  readonly inquiryHref: string;
}

export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'linkedin', 'tiktok'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export interface Business {
  readonly name: string;
  readonly tagline: string;
  readonly areaServed: string;
  readonly locality?: string;
  /** Public social profiles, in display order. */
  readonly social: readonly { readonly network: SocialNetwork; readonly url: string }[];
}

export interface Landing {
  readonly business: Business;
  readonly contact: Contact;
  /** Disclaimer shown next to price lists. Absent when prices are hidden. */
  readonly pricingNote?: string;
  readonly positioning: {
    readonly headline: string;
    readonly lead: string;
    readonly proofPoints: readonly TextBlock[];
    readonly comparison: Comparison;
  };
  readonly guide: { readonly intro: string; readonly items: readonly GuideItem[] };
  readonly services: readonly Service[];
  readonly maintenance: {
    readonly intro: string;
    readonly quote?: string;
    readonly plans: readonly Plan[];
    readonly rules: readonly string[];
  };
  readonly seo: {
    readonly intro: string;
    readonly audit: PricedItem & { readonly description: string };
    readonly plans: readonly Plan[];
    readonly rules: readonly string[];
  };
  readonly subscription: {
    readonly intro: string;
    readonly packages: readonly SubscriptionPackage[];
    readonly rules: readonly string[];
  };
  readonly addons: {
    readonly intro: string;
    readonly items: readonly (PricedItem & { readonly featured: boolean })[];
  };
  readonly process: {
    readonly steps: readonly TextBlock[];
    readonly payments: readonly { readonly when: string; readonly scheme: string }[];
    readonly guarantees: readonly string[];
  };
  readonly faq: readonly FaqEntry[];
}
