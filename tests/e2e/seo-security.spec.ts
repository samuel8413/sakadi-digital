import { expect, test } from '@playwright/test';
import { landing, siteConfig } from './landing.ts';

test('ships complete document metadata in Spanish', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(siteConfig.site.title);
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description?.length).toBeGreaterThan(50);
  expect(description?.length).toBeLessThanOrEqual(160);

  await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_MX');
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    landing.business.name,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
});

test('embeds a schema.org graph for the business, the site and the FAQ', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? '{}') as { '@context': string; '@graph': { '@type': string }[] };
  expect(data['@context']).toBe('https://schema.org');
  expect(data['@graph'].map((node) => node['@type'])).toEqual([
    'ProfessionalService',
    'WebSite',
    'FAQPage',
  ]);
});

test('serves robots.txt and a 404 page', async ({ page, request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  const body = await robots.text();
  expect(body).toContain('User-agent: *');
  // Builds without SITE_URL carry no Sitemap line; when present it must be absolute.
  for (const [, url] of body.matchAll(/^Sitemap:\s*(.*)$/gm)) {
    expect(url).toMatch(/^https?:\/\/\S+$/);
  }

  const missing = await page.goto('/definitivamente-no-existe');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página no encontrada');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('runs under its own Content Security Policy without violations', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  page.on('pageerror', (error) => violations.push(error.message));

  await page.goto('/');
  const csp = await page
    .locator('meta[http-equiv="content-security-policy"]')
    .getAttribute('content');
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("font-src 'self'");
  expect(csp).toContain('script-src');
  expect(csp).not.toContain("'unsafe-inline'");

  // Exercise the interactive code paths and the font so any blocked resource would surface.
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name: 'Modo oscuro' }).click();
  await page.locator('details').first().locator('summary').click();

  expect(violations).toEqual([]);
});

test('loads nothing from third parties', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (req) => origins.add(new URL(req.url()).origin));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect([...origins]).toEqual([new URL(page.url()).origin]);
});
