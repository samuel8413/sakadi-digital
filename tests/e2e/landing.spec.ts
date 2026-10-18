import { expect, test } from '@playwright/test';
import { landing, siteConfig } from './landing.ts';

/** Behaviour that matters commercially: every offer is visible, linked and quotable. */

test('renders every service, plan and subscription package as a linkable card', async ({
  page,
}) => {
  await page.goto('/');
  const anchors = [
    ...landing.services,
    ...landing.maintenance.plans,
    ...landing.seo.plans,
    ...(landing.subscription?.packages ?? []),
  ].map((offering) => offering.anchor);

  for (const anchor of anchors) {
    await expect(page.locator(`#${anchor}`)).toHaveCount(1);
  }
});

test('guide recommendations jump to the recommended offering', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('#guia a[href^="#"]');
  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    const href = (await link.getAttribute('href')) ?? '';
    await expect(page.locator(href)).toHaveCount(1);
  }

  const first = links.first();
  const target = (await first.getAttribute('href')) ?? '';
  await first.click();
  await expect(page).toHaveURL(new RegExp(`${target}$`));
  await expect(page.locator(target)).toBeInViewport();
});

test('quote buttons carry a message naming the offering', async ({ page }) => {
  await page.goto('/');
  const service = landing.services[0]!;
  const button = page.locator(`#${service.anchor} .button`);
  await expect(button).toHaveAttribute('href', service.inquiryHref);

  if (siteConfig.contact.whatsapp) {
    expect(decodeURIComponent(service.inquiryHref)).toContain(service.name);
    await expect(button).toHaveAttribute('target', '_blank');
  } else if (!siteConfig.contact.email) {
    // No channel configured yet (blocked from deploy by the content audit): CTAs scroll to contact.
    expect(service.inquiryHref).toBe('#contacto');
  }
});

test('shows prices according to the display setting, with the tax note', async ({ page }) => {
  await page.goto('/');
  const firstPrice = landing.services[0]!.price;
  if (siteConfig.pricing.display === 'hidden') {
    expect(firstPrice).toBeUndefined();
    return;
  }
  await expect(page.locator(`#${landing.services[0]!.anchor}`)).toContainText(firstPrice!.amount);
  await expect(page.getByText(siteConfig.pricing.note).first()).toBeVisible();
});

test('the hero states the value proposition and offers a quote', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(landing.positioning.headline);
  await expect(page.locator('#inicio .button').first()).toHaveAttribute(
    'href',
    landing.contact.inquiryHref,
  );
});

test('does not overflow horizontally on small screens', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
