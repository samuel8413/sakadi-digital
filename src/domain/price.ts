import type { PriceTag } from './model.ts';
import type { RawPrice } from './schema/primitives.ts';
import type { PriceDisplay } from './schema/site-config.schema.ts';

/**
 * Turns catalog prices into display strings. Pure: the same price, display
 * mode and locale always produce the same label, so it is safe to unit test
 * and to run at build time.
 */

export interface PriceFormat {
  readonly display: PriceDisplay;
  readonly locale: string;
  readonly currency: string;
}

/** Copy is Spanish because the page is; the number format follows `locale`. */
const WORDS = { from: 'Desde', month: '/mes', item: 'c/u' } as const;

/** En dash with spaces, the typographic convention for ranges in Spanish. */
const RANGE_SEPARATOR = ' – ';

export function formatAmount(value: number, format: Pick<PriceFormat, 'locale' | 'currency'>) {
  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: format.currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Returns `undefined` when prices are hidden, so callers render nothing rather than an empty tag. */
export function formatPrice(price: RawPrice, format: PriceFormat): PriceTag | undefined {
  if (format.display === 'hidden') return undefined;
  if ('label' in price) return { label: price.label, amount: price.label };

  const money = (value: number) => formatAmount(value, format);
  const isRange = price.to !== undefined || price.openEnded;

  let prefix: string | undefined;
  let amount: string;
  if (!isRange) {
    amount = money(price.from);
  } else if (format.display === 'from' || price.to === undefined) {
    prefix = WORDS.from;
    amount = money(price.from);
  } else {
    amount = `${money(price.from)}${RANGE_SEPARATOR}${money(price.to)}${price.openEnded ? '+' : ''}`;
  }

  const qualifier =
    [price.per && WORDS[price.per], price.suffix].filter(Boolean).join(' ') || undefined;

  return {
    label: [prefix, amount, qualifier].filter(Boolean).join(' '),
    ...(prefix && { prefix }),
    amount,
    ...(qualifier && { qualifier }),
    min: price.from,
    ...(price.to !== undefined && !price.openEnded && { max: price.to }),
    ...(price.per && { per: price.per }),
  };
}
