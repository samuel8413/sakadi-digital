import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { auditContent } from '../../src/domain/audit.ts';
import { normalizeLanding } from '../../src/domain/normalize.ts';
import { catalogSchema } from '../../src/domain/schema/catalog.schema.ts';
import { siteConfigSchema } from '../../src/domain/schema/site-config.schema.ts';
import { parseCatalog, parseConfig, rawCatalog, rawConfig } from '../fixtures/content.ts';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

/**
 * Contract tests against the real content files. They guard the two files the
 * owners edit by hand, so a typo fails here instead of in a deploy.
 */
describe('content files', () => {
  const catalog = catalogSchema.parse(readJson('../../content/catalog.json'));
  const config = siteConfigSchema.parse(readJson('../../content/site.config.json'));

  it('match their schemas', () => {
    expect(catalog.services.length).toBeGreaterThan(0);
    expect(config.business.name).not.toBe('');
  });

  it('normalise into a landing with every section populated', () => {
    const landing = normalizeLanding(catalog, config);
    expect(landing.services.every((s) => s.includes.length > 0)).toBe(true);
    expect(landing.maintenance.plans.length).toBeGreaterThan(0);
    expect(landing.seo.plans.length).toBeGreaterThan(0);
    expect(landing.guide.items.every((i) => i.recommendations.length > 0)).toBe(true);
  });

  it('protect the scope of every service with a "no incluye" list', () => {
    const findings = auditContent(catalog, config).filter((i) => i.path.endsWith('.excludes'));
    expect(findings).toEqual([]);
  });

  it('never publish internal notes from the working catalog', () => {
    const text = JSON.stringify(catalog).toLowerCase();
    for (const internal of ['esposa', 'margen', 'tiempo completo', 'rfc', 'resico', 'subcontrat']) {
      expect(text, internal).not.toContain(internal);
    }
  });
});

describe('catalog schema', () => {
  it('rejects unknown keys so typos do not silently disappear', () => {
    expect(() => parseCatalog((raw) => ({ ...raw, typo: true }))).toThrow();
  });

  it('rejects guide entries that point at an offering that does not exist', () => {
    const result = catalogSchema.safeParse({
      ...rawCatalog(),
      guide: { intro: 'g', items: [{ need: 'n', recommend: ['no-existe'] }] },
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('Unknown offering \\"no-existe\\"');
  });

  it('rejects duplicate ids across services and plans', () => {
    const raw = rawCatalog();
    raw.services[0]!.id = 'basico';
    expect(catalogSchema.safeParse(raw).success).toBe(false);
  });

  it('rejects a required plan that is not a maintenance plan', () => {
    const raw = rawCatalog();
    raw.services[0]!.requiresPlan = 'seo-local';
    const result = catalogSchema.safeParse(raw);
    expect(JSON.stringify(result.error?.issues)).toContain('Unknown maintenance plan');
  });

  it('rejects plan tables whose rows do not have one value per plan', () => {
    const raw = rawCatalog();
    raw.maintenance.table.features[0]!.values = [true];
    const result = catalogSchema.safeParse(raw);
    expect(JSON.stringify(result.error?.issues)).toContain('has 1 values but there are 2 plans');
  });

  it('rejects comparison rows with the wrong number of alternatives', () => {
    const raw = rawCatalog();
    raw.positioning.comparison.rows[0]!.alternatives = ['a', 'b'];
    expect(catalogSchema.safeParse(raw).success).toBe(false);
  });

  it('rejects inverted price ranges and non-kebab ids', () => {
    const raw = rawCatalog();
    raw.services[0]!.price = { from: 6000, to: 3500 };
    raw.services[0]!.id = 'Landing Page';
    const messages = catalogSchema.safeParse(raw).error?.issues.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes('greater than'))).toBe(true);
    expect(messages.some((m) => m.includes('kebab-case'))).toBe(true);
  });
});

describe('site config schema', () => {
  it('normalises phone numbers to digits and rejects malformed ones', () => {
    expect(parseConfig().contact.whatsapp).toBe('525512345678');
    const bad = rawConfig();
    bad.contact.whatsapp = '55-12';
    expect(siteConfigSchema.safeParse(bad).success).toBe(false);
  });

  it('treats empty strings as not provided', () => {
    const config = parseConfig((raw) => ({ ...raw, contact: { ...raw.contact, email: '' } }));
    expect(config.contact.email).toBeUndefined();
    expect(config.business.locality).toBeUndefined();
  });

  it('requires the {servicio} placeholder and %s in the title template', () => {
    const raw = rawConfig();
    raw.contact.messages.service = 'Hola';
    raw.site.titleTemplate = 'ACME';
    const messages = siteConfigSchema.safeParse(raw).error?.issues.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes('{servicio}'))).toBe(true);
    expect(messages.some((m) => m.includes('%s'))).toBe(true);
  });

  it('rejects invalid email and URLs with a readable message', () => {
    const raw = { ...rawConfig(), social: { facebook: 'ftp://x' } };
    raw.contact.email = 'no-es-correo';
    const messages = siteConfigSchema.safeParse(raw).error?.issues.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes('Invalid email'))).toBe(true);
    expect(messages.some((m) => m.includes('Invalid http(s) URL'))).toBe(true);
  });
});
