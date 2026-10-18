import { describe, expect, it } from 'vitest';
import { auditContent, hasBlockingIssues } from '../../src/domain/audit.ts';
import { parseCatalog, parseConfig } from '../fixtures/content.ts';

const paths = (issues: ReturnType<typeof auditContent>) => issues.map((i) => i.path);

describe('auditContent', () => {
  it('has nothing to report on complete content', () => {
    expect(auditContent(parseCatalog(), parseConfig())).toEqual([]);
  });

  it('blocks deployment when there is no way to contact the business', () => {
    const issues = auditContent(
      parseCatalog(),
      parseConfig((raw) => ({ ...raw, contact: { ...raw.contact, whatsapp: '', email: '' } })),
    );
    expect(hasBlockingIssues(issues)).toBe(true);
    expect(paths(issues)).toEqual(['contact', 'contact.whatsapp']);
  });

  it('warns, without blocking, when only email is available', () => {
    const issues = auditContent(
      parseCatalog(),
      parseConfig((raw) => ({ ...raw, contact: { ...raw.contact, whatsapp: '' } })),
    );
    expect(hasBlockingIssues(issues)).toBe(false);
    expect(paths(issues)).toEqual(['contact.whatsapp']);
  });

  it('flags a WhatsApp number outside Mexico', () => {
    const issues = auditContent(
      parseCatalog(),
      parseConfig((raw) => ({ ...raw, contact: { ...raw.contact, whatsapp: '+1 415 555 2671' } })),
    );
    expect(issues[0]?.message).toContain('country code (52)');
  });

  it('warns about missing scope lists, several featured plans, no FAQ and no description', () => {
    const catalog = parseCatalog((raw) => {
      raw.services[0]!.excludes = [];
      raw.maintenance.table.plans[1]!.featured = true;
      return { ...raw, faq: [] };
    });
    const config = parseConfig((raw) => ({ ...raw, site: { ...raw.site, description: '' } }));
    const issues = auditContent(catalog, config);
    expect(hasBlockingIssues(issues)).toBe(false);
    expect(paths(issues)).toEqual([
      'site.description',
      'services[0].excludes',
      'maintenance.table.plans',
      'faq',
    ]);
  });
});
