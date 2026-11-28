import {test,expect} from '@playwright/test';

test('unknown paths return a genuine 404 with a native route back to the shop',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:700}});
  try{
    const page=await context.newPage();
    const response=await page.goto('/not-a-real-counter-route/');
    expect(response?.status()).toBe(404);
    expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
    await expect(page.getByRole('heading',{name:'This page is not on the counter'})).toBeVisible();
    const home=page.getByRole('link',{name:'Back to the counter',exact:true});
    await expect(home).toHaveAttribute('href','/');
    const box=await home.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('link',{name:'Call the shop'})).toHaveAttribute('href','tel:+918143730054');
    expect(await page.locator('script[src]').count()).toBe(0);
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex,nofollow');
    await home.click();
    await expect(page.getByRole('heading',{name:'Choose your cuts'})).toBeVisible();
  }finally{await context.close();}
});

test('public HTML has one primary heading, declared language and no duplicate IDs',async({page})=>{
  for(const path of ['/','/privacy/','/admin/','/404.html']){
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang',/^en(?:-IN)?$/);
    await expect(page.locator('h1')).toHaveCount(1);
    const duplicates=await page.evaluate(()=>{
      const seen=new Set<string>(),dupes=new Set<string>();
      for(const el of document.querySelectorAll('[id]')){
        if(seen.has(el.id))dupes.add(el.id);seen.add(el.id);
      }
      return [...dupes];
    });
    expect(duplicates).toEqual([]);
  }
});
