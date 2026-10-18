import { expect, test } from '@playwright/test';

test.describe('theme toggle', () => {
  test('flips the theme, persists it, and survives reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Modo oscuro' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('follows the system preference when nothing is stored', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
    await expect(page.getByRole('button', { name: 'Modo oscuro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('the logo stays visible in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const fill = await page
      .locator('.site-header .brand-mark circle')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    // The ink node turns cream (#faf3e8) on the dark background.
    expect(fill).toBe('rgb(250, 243, 232)');
  });
});

test('in-page navigation reaches every section', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('navigation', { name: 'Secciones' }).getByRole('link');
  expect(await links.count()).toBeGreaterThan(3);
  for (const link of await links.all()) {
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^#[a-z-]+$/);
    await expect(page.locator(href ?? '')).toHaveCount(1);
  }
});

test('"Qué no incluye" opens on demand', async ({ page }) => {
  await page.goto('/');
  const details = page.locator('#servicios details').first();
  await expect(details).toHaveJSProperty('open', false);
  await details.locator('summary').click();
  await expect(details).toHaveJSProperty('open', true);
  await expect(details.getByRole('listitem').first()).toBeVisible();
});

test('Montserrat is self-hosted and loaded', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('700 16px Montserrat'))).toBe(true);
  const preload = page.locator('link[rel="preload"][as="font"]');
  await expect(preload).toHaveCount(1);
  expect(await preload.getAttribute('href')).toMatch(/^\/_astro\/fonts\//);
});
