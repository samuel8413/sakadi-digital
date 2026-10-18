import { z } from 'zod';

/**
 * Shared Zod building blocks for the raw content files.
 *
 * Content is edited by hand, so every optional scalar treats `""` and
 * whitespace as "not provided" and normalises it to `undefined`. Downstream code
 * never has to distinguish between `""`, whitespace and a missing key.
 */

export const text = z.string().trim();

export const nonEmptyText = text.min(1, 'Value must not be empty');

export const optionalText = text.transform((value) => (value === '' ? undefined : value));

export const stringList = z.array(text.min(1));

/** Stable identifiers double as DOM anchors and WhatsApp message keys, so they are kebab-case. */
export const slugId = text.regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Ids must be kebab-case: lowercase letters, digits and single hyphens',
);

export const optionalUrl = text.transform((value, ctx) => {
  if (value === '') return undefined;
  const result = z.url({ protocol: /^https?$/ }).safeParse(value);
  if (!result.success) {
    ctx.addIssue({ code: 'custom', message: `Invalid http(s) URL: "${value}"` });
    return z.NEVER;
  }
  return result.data;
});

export const optionalEmail = text.transform((value, ctx) => {
  if (value === '') return undefined;
  const result = z.email().safeParse(value);
  if (!result.success) {
    ctx.addIssue({ code: 'custom', message: `Invalid email address: "${value}"` });
    return z.NEVER;
  }
  return result.data;
});

/**
 * International phone number, stored as digits only (the shape `wa.me` links
 * need). Spaces, dashes, dots, parentheses and a leading `+` are accepted for
 * readability and stripped. E.164 allows at most 15 digits.
 */
export const optionalPhone = text.transform((value, ctx) => {
  if (value === '') return undefined;
  const digits = value.replace(/[\s().+-]/g, '');
  if (!/^[1-9]\d{9,14}$/.test(digits)) {
    ctx.addIssue({
      code: 'custom',
      message: `Invalid phone "${value}". Use the international format with country code, e.g. "52 55 1234 5678".`,
    });
    return z.NEVER;
  }
  return digits;
});

/** Whole pesos; centavos are noise in a price list. Zero is valid ("enganche desde $0"). */
export const amount = z.number().int('Amounts are whole pesos').nonnegative();

/**
 * A price as written in the catalog. Either a numeric range (formatted at
 * build time according to `pricing.display`) or a free label for prices that
 * are not amounts ("+30–50% del proyecto").
 */
export const priceSchema = z.union([
  z
    .strictObject({
      from: amount,
      to: amount.optional(),
      /** The upper bound is open ("$150,000+"). */
      openEnded: z.boolean().default(false),
      /** Recurring or unit prices. Omitted means a one-off payment. */
      per: z.enum(['month', 'item']).optional(),
      /** Short qualifier after the amount: "+ licencia", "+ costo de API". */
      suffix: optionalText.optional(),
    })
    .refine((price) => price.to === undefined || price.to > price.from, {
      message: 'price.to must be greater than price.from',
      path: ['to'],
    }),
  z.strictObject({ label: nonEmptyText }),
]);

export type RawPrice = z.output<typeof priceSchema>;
