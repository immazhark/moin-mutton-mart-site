import { test, expect } from '@playwright/test';

for (const width of [320, 360, 390, 430, 1280]) {
  test(`request journey and no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 850 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Choose your cuts' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.getByRole('button', { name: 'Chicken', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Mutton with bone', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByLabel('Search the range').fill('paya');
    await expect(page.getByRole('heading', { name: 'Paya' })).toBeVisible();
    await page.getByLabel('Search the range').fill('');

    await page.getByRole('button', { name: 'Add Mutton with bone', exact: true }).click();
    await page.getByRole('button', { name: 'Increase Mutton with bone', exact: true }).click();
    await page.getByRole('button', { name: 'Review request' }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('1 kg', { exact: true })).toBeVisible();
    await sheet.getByLabel('Cut or preparation (optional)').fill('Medium curry pieces');
    await sheet.getByRole('button', { name: 'Pickup', exact: true }).click();
    const url = await sheet.getByRole('link', { name: 'Continue on WhatsApp' }).getAttribute('href');
    expect(new URL(url!).pathname).toBe('/918143730054');
    const text = new URL(url!).searchParams.get('text')!;
    expect(text).toContain('Cut: Medium curry pieces');
    expect(text).toContain('Pickup chahiye.');

    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Review request' })).toBeFocused();

    await page.getByRole('button', { name: 'Review request' }).click();
    await page.goBack(); // Back closes the sheet and keeps the basket
    await expect(sheet).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Review request' })).toBeVisible();

    await page.getByRole('button', { name: 'Review request' }).click();
    await sheet.getByRole('button', { name: 'Remove Mutton with bone' }).click();
    await expect(sheet.getByText('Nothing selected yet.')).toBeVisible();
  });
}
