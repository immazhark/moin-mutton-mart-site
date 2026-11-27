import {test,expect} from '@playwright/test';

test('unconfigured owner route fails closed without Firebase network requests',async({page})=>{
  const calls:string[]=[];
  page.on('request',r=>{if(/firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebaseapp\.com/.test(r.url()))calls.push(r.url());});
  for(const width of [320,360,390,430,1280]){
    await page.setViewportSize({width,height:844});
    await page.goto('/admin/');
    await expect(page.getByRole('heading',{name:'Owner access is not connected'})).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,nofollow');
    await expect(page.getByRole('button',{name:'Save changes'})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Continue with Google'})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  expect(calls).toEqual([]);
});
