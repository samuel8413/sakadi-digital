/**
 * The `Sitemap` directive is defined as a fully-qualified URL (sitemaps.org,
 * RFC 9309 §2.2.3): a path-only value such as `/sitemap-index.xml` is invalid
 * and Lighthouse reports it. When no site URL is configured (local build,
 * CI preview) the directive is therefore omitted rather than emitted relative —
 * the same rule canonical and Open Graph URLs follow, so a build never
 * advertises an origin it cannot know.
 */
export function buildRobotsTxt(site: URL | undefined, base = '/'): string {
  const path = `${base.replace(/\/$/, '')}/sitemap-index.xml`;
  const lines = ['User-agent: *', 'Allow: /'];
  if (site) lines.push('', `Sitemap: ${new URL(path, site).href}`);
  return `${lines.join('\n')}\n`;
}
