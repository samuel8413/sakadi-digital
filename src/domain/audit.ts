import type { RawCatalog } from './schema/catalog.schema.ts';
import type { SiteConfig } from './schema/site-config.schema.ts';

/**
 * Editorial checks that go beyond shape validation.
 *
 * Schema errors ("this is not a URL", "unknown plan id") always fail the
 * build. Audit findings are about *completeness*: they warn during development
 * and block only the production deployment (`content:check --strict`), so the
 * site can be developed before every channel and text is ready, without ever
 * publishing a page nobody can contact.
 */

export type IssueSeverity = 'error' | 'warning';

export interface ContentIssue {
  readonly severity: IssueSeverity;
  readonly path: string;
  readonly message: string;
}

export function auditContent(catalog: RawCatalog, config: SiteConfig): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const push = (severity: IssueSeverity, path: string, message: string) =>
    issues.push({ severity, path, message });

  const { contact } = config;
  if (!contact.whatsapp && !contact.email) {
    push(
      'error',
      'contact',
      'No contact channel (WhatsApp or email). Every "Cotizar" button would only scroll to the contact section.',
    );
  }
  if (!contact.whatsapp) {
    push(
      'warning',
      'contact.whatsapp',
      'No WhatsApp number. It is the primary channel for every call to action.',
    );
  }
  if (contact.whatsapp && !contact.whatsapp.startsWith('52')) {
    push(
      'warning',
      'contact.whatsapp',
      `"${contact.whatsapp}" does not start with Mexico's country code (52). Check it is intended.`,
    );
  }

  if (!config.site.description) {
    push(
      'warning',
      'site.description',
      'No meta description; the positioning lead will be used. Write one aimed at search results.',
    );
  }

  catalog.services.forEach((service, index) => {
    if (service.excludes.length === 0) {
      push(
        'warning',
        `services[${index}].excludes`,
        `"${service.name}" lists nothing under "No incluye". That list is what protects the scope.`,
      );
    }
  });

  const planTables = [
    ['maintenance.table.plans', catalog.maintenance.table.plans],
    ['seo.table.plans', catalog.seo.table.plans],
  ] as const;
  for (const [path, plans] of planTables) {
    if (plans.filter((plan) => plan.featured).length > 1) {
      push(
        'warning',
        path,
        'More than one plan is featured. Highlighting one recommended option reads clearer.',
      );
    }
  }

  if (catalog.faq.length === 0) {
    push('warning', 'faq', 'No FAQ entries. They answer objections before the first message.');
  }

  return issues;
}

export function hasBlockingIssues(issues: readonly ContentIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}
