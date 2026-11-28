import {test,expect} from '@playwright/test';
import {measureCounter} from '../support/payload';
test('cold public preview meets static payload budget without loading owner SDK',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByText('Live rates unavailable · ask the shop')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await measureCounter(page);
});
