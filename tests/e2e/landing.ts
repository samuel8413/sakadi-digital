import { readFileSync } from 'node:fs';
import { normalizeLanding } from '../../src/domain/normalize.ts';
import { catalogSchema } from '../../src/domain/schema/catalog.schema.ts';
import { siteConfigSchema } from '../../src/domain/schema/site-config.schema.ts';

/**
 * The model the build rendered, recomputed from the same content files, so e2e
 * assertions follow the content instead of hard-coding it.
 */
const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

export const siteConfig = siteConfigSchema.parse(readJson('../../content/site.config.json'));
export const landing = normalizeLanding(
  catalogSchema.parse(readJson('../../content/catalog.json')),
  siteConfig,
);
