/** Deterministic, DOM-safe identifier from free text ("Tienda en Línea / 4A" -> "tienda-en-linea-4a"). */
export function slugify(...parts: readonly string[]): string {
  return parts
    .join(' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
