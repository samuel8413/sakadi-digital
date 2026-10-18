import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

for (const scheme of ['light', 'dark'] as const) {
  test(`has no WCAG 2.2 AA violations in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');

    // Expand collapsed content ("Qué no incluye", FAQ) so it is audited too.
    await page.locator('details').evaluateAll((els) => {
      els.forEach((el) => ((el as HTMLDetailsElement).open = true));
    });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test('the 404 page has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/no-existe');
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('exposes the expected landmarks and heading outline', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const h2s = await page.getByRole('heading', { level: 2 }).allTextContents();
  expect(h2s).toEqual(expect.arrayContaining(['¿Qué necesitas?', 'Mantenimiento y hosting']));
});

test('skip link is the first focusable element and moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('every external link opens safely and announces itself', async ({ page }) => {
  await page.goto('/');
  const external = page.locator('a[href^="http"]');
  for (const link of await external.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
    const href = (await link.getAttribute('href')) ?? '';
    expect(await link.locator('.visually-hidden').count(), href).toBeGreaterThanOrEqual(1);
  }
});

test('repeated call-to-action buttons have distinct accessible names', async ({ page }) => {
  await page.goto('/');
  const names = await page
    .locator('#servicios .button')
    .evaluateAll((els) => els.map((el) => el.textContent.replace(/\s+/g, ' ').trim()));
  expect(names.length).toBeGreaterThan(1);
  expect(new Set(names).size).toBe(names.length);
});
