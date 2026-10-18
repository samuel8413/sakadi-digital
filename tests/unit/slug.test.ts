import { describe, expect, it } from 'vitest';
import { slugify } from '../../src/domain/slug.ts';

describe('slugify', () => {
  it('strips accents and punctuation into a DOM-safe id', () => {
    expect(slugify('Tienda en Línea / 4A')).toBe('tienda-en-linea-4a');
    expect(slugify('¿Qué necesitas?', 'título')).toBe('que-necesitas-titulo');
  });
});
