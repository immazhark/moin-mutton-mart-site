import {test,expect} from '@playwright/test';

for(const width of [360,390,768,1280,1920]){
  test('compact text-first counter at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await expect(page.getByRole('heading',{name:'Choose your cuts'})).toBeVisible();
    await expect(page.locator('.product-card')).toHaveCount(13);
    await expect(page.locator('.product-photo')).toHaveCount(0);
    const first=page.locator('.product-card').first();
    await expect(first.locator('.unit-amount')).toHaveText('500 g');
    expect(await first.locator('.unit-amount').evaluate(el=>getComputedStyle(el).whiteSpace)).toBe('nowrap');
    await expect(page.getByRole('button',{name:'Add Mutton with bone',exact:true})).toBeInViewport();
    const rect=await first.boundingBox();
    expect(rect?.height).toBeLessThan(265);
    await expect(page.locator('.product-card').nth(2).getByRole('heading')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Chicken',exact:true}).click();
    await expect(page.locator('.product-card:visible')).toHaveCount(3);
    await expect(page.locator('.counter-group:visible')).toHaveCount(1);
    await expect(page.locator('.counter-group:visible .group-title')).toHaveText('Chicken');
    await page.getByRole('button',{name:'All',exact:true}).click();
    await expect(page.locator('.product-card:visible')).toHaveCount(13);
    await expect(page.locator('.counter-group:visible')).toHaveCount(3);
  });
}
test('review readiness is explicit and immediately reset by edits',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Review request'}).click();
  const sheet=page.getByRole('dialog');
  const state=sheet.locator('[data-role="review-state"]');
  await expect(state).toHaveText('Review your selection');
  await sheet.getByRole('button',{name:'Check latest rates & availability'}).click();
  await expect(state).toHaveText('Ready to enquire');
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toBeVisible();
  await sheet.getByLabel('Cut or preparation (optional)').fill('Small pieces');
  await expect(state).toHaveText('Review your selection');
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toHaveCount(0);
});
