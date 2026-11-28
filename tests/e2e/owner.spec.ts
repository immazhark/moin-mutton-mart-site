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

test('disconnected owner status is rendered without hydration or scripts, even with JavaScript off',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const page=await context.newPage();
    await page.goto('/admin/');
    await expect(page.getByRole('heading',{name:'Owner access is not connected'})).toBeVisible();
    await expect(page.locator('astro-island,script[src],script[type="module"]')).toHaveCount(0);
    await expect(page.getByRole('link',{name:'Back to the counter'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Continue with Google'})).toHaveCount(0);
  }finally{await context.close();}
});
