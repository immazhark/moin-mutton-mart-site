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
    await sheet.getByRole('button',{name:'Check latest rates & availability'}).click();
    const fallback=sheet.getByRole('link',{name:'Continue as unpriced enquiry'});
    await expect(fallback).toBeVisible();
    const url = await fallback.getAttribute('href');
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

test('review Back, Forward, repeated close and final-item removal keep focus usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Mutton with bone', exact: true }).click();
  const opener = page.getByRole('button', { name: 'Review request' });
  const sheet = page.getByRole('dialog');
  await opener.click();
  await expect(sheet).toBeVisible();
  await page.goBack();
  await expect(sheet).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.goForward();
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await opener.click();
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Remove Mutton with bone' }).click();
  await expect(sheet.getByText('Nothing selected yet.')).toBeVisible();
  await sheet.getByRole('button', { name: 'Back to the counter' }).click();
  await expect(sheet).not.toBeVisible();
  await expect(page.getByLabel('Search the range')).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/sheet-open/);
  await page.goForward();
  await expect(sheet).not.toBeVisible();
});

test('editing during a clipboard write invalidates its feedback', async ({ page }) => {
  await page.addInitScript(() => {
    let complete: (() => void) | undefined;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: () => new Promise<void>((resolve) => { complete = resolve; }),
    } });
    window.addEventListener('moin-test-finish-copy', () => complete?.());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Mutton with bone', exact: true }).click();
  await page.getByRole('button', { name: 'Review request' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Copy request', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Copying…' })).toBeDisabled();
  await sheet.getByLabel('Cut or preparation (optional)').fill('Small pieces');
  await page.evaluate(() => window.dispatchEvent(new Event('moin-test-finish-copy')));
  await expect(sheet.getByRole('button', { name: 'Copy request', exact: true })).toBeEnabled();
  await expect(sheet.getByRole('status', { name: 'Clipboard status' })).not.toContainText('Copied.');
  await sheet.getByRole('button', { name: 'Copy request', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('moin-test-finish-copy')));
  await expect(sheet.getByRole('status', { name: 'Clipboard status' })).toContainText('Copied.');
  await sheet.getByLabel('Cut or preparation (optional)').fill('Large pieces');
  await expect(sheet.getByRole('status', { name: 'Clipboard status' })).not.toContainText('Copied.');
});

test('expired basket is removed rather than restored', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('moin-request-v2', JSON.stringify({ version: 2, startedAt: Date.now() - 25 * 60 * 60 * 1000, items: [{ productId: 'mutton-bone', quantity: 500 }] }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('moin-request-v2'))).toBeNull();
  await expect(page.getByRole('button', { name: 'Review request' })).toHaveCount(0);
});

test('editing invalidates a previously checked unpriced handoff',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Review request'}).click();
  const sheet=page.getByRole('dialog');
  await sheet.getByRole('button',{name:'Check latest rates & availability'}).click();
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toBeVisible();
  await sheet.getByLabel('Cut or preparation (optional)').fill('Thin slices');
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toHaveCount(0);
  await sheet.getByLabel('Cut or preparation (optional)').fill('');
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toHaveCount(0);
  await sheet.getByRole('button',{name:'Check latest rates & availability'}).click();
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toBeVisible();
});

test('handoff approval expires without polling',async({page})=>{
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Review request'}).click();
  const sheet=page.getByRole('dialog');
  await sheet.getByRole('button',{name:'Check latest rates & availability'}).click();
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toBeVisible();
  await page.clock.fastForward(15001);
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toHaveCount(0);
  await expect(sheet.getByRole('button',{name:'Check latest rates & availability'})).toBeEnabled();
});

test('handoff grant is scoped to one open review and every raw edit',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  const open=page.getByRole('button',{name:'Review request'});
  await open.click();
  const sheet=page.getByRole('dialog');
  const check=sheet.getByRole('button',{name:'Check latest rates & availability'});
  const link=sheet.getByRole('link',{name:'Continue as unpriced enquiry'});
  await check.click();await expect(link).toBeVisible();
  await sheet.getByRole('button',{name:'Close',exact:true}).click();
  await expect(sheet).not.toBeVisible();
  await open.click();
  await expect(link).toHaveCount(0);
  await check.click();await expect(link).toBeVisible();
  await sheet.getByLabel('Cut or preparation (optional)').fill(' ');
  await expect(link).toHaveCount(0);
  await check.click();await expect(link).toBeVisible();
  await page.goBack();await expect(sheet).not.toBeVisible();
  await page.goForward();await expect(sheet).toBeVisible();
  await expect(link).toHaveCount(0);
});
