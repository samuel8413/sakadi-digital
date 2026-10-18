import rawCatalog from '../../content/catalog.json';
import rawSiteConfig from '../../content/site.config.json';
import { auditContent } from '../domain/audit.ts';
import type { Landing } from '../domain/model.ts';
import { normalizeLanding } from '../domain/normalize.ts';
import { catalogSchema } from '../domain/schema/catalog.schema.ts';
import { siteConfigSchema, type SiteConfig } from '../domain/schema/site-config.schema.ts';

/**
 * Composition root for content.
 *
 * This is the only module that touches the JSON files. It runs once per build
 * (Astro evaluates it at prerender time), validates both files, and exposes the
 * typed domain objects to the components. Schema failures throw and stop the
 * build with a readable message; editorial findings are logged and left to the
 * `content:check` script to enforce in CI.
 */

export const siteConfig: SiteConfig = siteConfigSchema.parse(rawSiteConfig);

const validatedCatalog = catalogSchema.parse(rawCatalog);

export const landing: Landing = normalizeLanding(validatedCatalog, siteConfig);

/** Build year for the footer. Static sites are rebuilt on deploy. */
export const buildYear: number = new Date().getFullYear();

for (const issue of auditContent(validatedCatalog, siteConfig)) {
  console.warn(`[content:${issue.severity}] ${issue.path}: ${issue.message}`);
}
