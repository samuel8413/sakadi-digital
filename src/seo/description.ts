/** Search engines truncate around 155-160 characters; cut on a word boundary so the snippet reads cleanly. */
export const META_DESCRIPTION_MAX = 155;

export function toMetaDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max / 2 ? lastSpace : cut.length).replace(/[,.;:]$/, '')}…`;
}
