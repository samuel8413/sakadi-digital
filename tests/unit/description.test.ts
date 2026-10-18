import { describe, expect, it } from 'vitest';
import { toMetaDescription } from '../../src/seo/description.ts';

describe('toMetaDescription', () => {
  it('leaves short text untouched apart from whitespace normalisation', () => {
    expect(toMetaDescription('  Hello\n world ')).toBe('Hello world');
  });

  it('truncates on a word boundary within the limit', () => {
    const long = 'word '.repeat(60).trim();
    const result = toMetaDescription(long, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/wor…$/);
  });

  it('drops trailing punctuation before the ellipsis', () => {
    expect(toMetaDescription('Alpha beta, gamma delta epsilon', 12)).toBe('Alpha beta…');
  });
});
