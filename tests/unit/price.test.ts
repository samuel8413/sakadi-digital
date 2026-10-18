import { describe, expect, it } from 'vitest';
import { formatAmount, formatPrice, type PriceFormat } from '../../src/domain/price.ts';

const as = (display: PriceFormat['display']): PriceFormat => ({
  display,
  locale: 'es-MX',
  currency: 'MXN',
});

describe('formatAmount', () => {
  it('formats whole pesos with the local grouping and a bare $ sign', () => {
    expect(formatAmount(150000, as('range'))).toBe('$150,000');
    expect(formatAmount(0, as('range'))).toBe('$0');
  });
});

describe('formatPrice', () => {
  it('shows a closed range with an en dash in range mode', () => {
    expect(formatPrice({ from: 3500, to: 6000, openEnded: false }, as('range'))).toEqual({
      label: '$3,500 – $6,000',
      amount: '$3,500 – $6,000',
      min: 3500,
      max: 6000,
    });
  });

  it('shows only the lower bound in from mode', () => {
    const tag = formatPrice({ from: 3500, to: 6000, openEnded: false }, as('from'));
    expect(tag?.label).toBe('Desde $3,500');
    expect(tag).toMatchObject({ prefix: 'Desde', amount: '$3,500', max: 6000 });
  });

  it('marks open upper bounds and drops max from structured data', () => {
    const tag = formatPrice({ from: 60000, to: 150000, openEnded: true }, as('range'));
    expect(tag?.label).toBe('$60,000 – $150,000+');
    expect(tag?.max).toBeUndefined();
    expect(formatPrice({ from: 10000, openEnded: true }, as('range'))?.label).toBe('Desde $10,000');
  });

  it('prints a fixed price as is, in either mode', () => {
    expect(formatPrice({ from: 12000, openEnded: false }, as('from'))?.label).toBe('$12,000');
    expect(formatPrice({ from: 12000, openEnded: false }, as('range'))?.label).toBe('$12,000');
  });

  it('appends the period and suffix as a qualifier', () => {
    const monthly = formatPrice({ from: 450, to: 800, openEnded: false, per: 'month' }, as('from'));
    expect(monthly).toMatchObject({ label: 'Desde $450 /mes', qualifier: '/mes', per: 'month' });

    const unit = formatPrice({ from: 15, to: 30, openEnded: false, per: 'item' }, as('range'));
    expect(unit?.label).toBe('$15 – $30 c/u');

    const licensed = formatPrice(
      { from: 800, to: 1500, openEnded: false, suffix: '+ licencia' },
      as('range'),
    );
    expect(licensed?.label).toBe('$800 – $1,500 + licencia');
  });

  it('passes free-text prices through without numbers', () => {
    expect(formatPrice({ label: '+30–50% del proyecto' }, as('from'))).toEqual({
      label: '+30–50% del proyecto',
      amount: '+30–50% del proyecto',
    });
  });

  it('hides every price, including free text, in hidden mode', () => {
    expect(formatPrice({ from: 1, to: 2, openEnded: false }, as('hidden'))).toBeUndefined();
    expect(formatPrice({ label: 'Se cotiza' }, as('hidden'))).toBeUndefined();
  });
});
