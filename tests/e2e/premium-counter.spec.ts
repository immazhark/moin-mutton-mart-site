import {test,expect} from '@playwright/test';

for(const width of [360,390,768,1280,1920]){
  test('visual commerce counter at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await expect(page.getByRole('heading',{name:'Choose your cuts'})).toBeVisible();
    await expect(page.locator('.product-card')).toHaveCount(13);
    const hero=page.locator('.market-hero');
    await expect(hero).toBeInViewport();
    await expect(hero.getByRole('link',{name:'Explore cuts'})).toBeInViewport();
    await expect(hero.locator('img')).toBeVisible();
    expect(await hero.locator('img').evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
    await expect(page.locator('.categories img')).toHaveCount(2);
    await expect(page.locator('.categories')).toBeInViewport();
    await expect(hero.getByText('Cooking inspiration')).toBeVisible();
    const first=page.locator('.product-card').first();
    await expect(first.locator('.unit-amount')).toHaveText('500 g');
    expect(await first.locator('.unit-amount').evaluate(el=>getComputedStyle(el).whiteSpace)).toBe('nowrap');
    await expect(page.getByRole('button',{name:'Add Mutton with bone',exact:true})).toBeInViewport();
    const header=await page.locator('.site-header').boundingBox();
    expect(header?.height).toBeLessThan(100);
    const rect=await first.boundingBox();
    expect(rect?.height).toBeLessThan(265);
    // A compact photo-led hero now earns its space; retain immediate first-add access.
    await expect(page.locator('.product-card').nth(2).getByRole('heading')).toBeVisible();
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
  await sheet.locator('.review-stage').scrollIntoViewIfNeeded();
  console.log('MOIN_REVIEW_QA_SCREENSHOT '+(await page.screenshot({type:'jpeg',quality:60})).toString('base64'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(sheet.locator('.ready-check')).toHaveCSS('animation-name','none');
  await sheet.getByLabel('Cut or preparation (optional)').fill('Small pieces');
  await expect(state).toHaveText('Review your selection');
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toHaveCount(0);
});

test('compact rows safely fall back with enlarged text at 390px',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.addStyleTag({content:'html {font-size:200% !important}'});
  await page.getByRole('button',{name:'Add Mutton leg piece',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const increase=page.getByRole('button',{name:'Increase Mutton leg piece',exact:true});
  const bounds=await increase.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44);
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Review request'}).click();
  const sheet=page.getByRole('dialog');
  expect(await sheet.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
});

test('quantity guide is useful with native disclosure and reduced motion',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844},reducedMotion:'reduce'});
  try{
    const page=await context.newPage();await page.goto('/');
    const guide=page.locator('.quantity-guide');
    await expect(guide.locator('.guide-copy')).not.toBeVisible();
    await guide.locator('summary').click();
    await expect(guide.locator('.guide-copy')).toBeVisible();
    await expect(guide.locator('.guide-chevron')).toHaveCSS('transition-duration','0s');
    await guide.locator('summary').click();
    await expect(guide.locator('.guide-copy')).not.toBeVisible();
  }finally{await context.close();}
});


test('themed counter, signature artwork and motion preserve direct shopping',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(()=>{
    const original=Element.prototype.animate;
    const calls:string[]=[];
    Object.defineProperty(window,'__motionTestCalls',{value:calls});
    Element.prototype.animate=function(...args:Parameters<typeof original>){
      if(this instanceof HTMLElement&&this.dataset.motionTarget)calls.push(this.dataset.motionTarget);
      return original.apply(this,args);
    };
  });
  await page.goto('/');
  await expect(page.locator('.hero-seal')).toBeVisible();
  await expect(page.locator('.counter-group[data-theme]')).toHaveCount(3);
  await expect(page.locator('.product-card .cut-mark')).toHaveCount(13);
  await page.getByRole('button',{name:'Chicken',exact:true}).click();
  await expect(page.locator('.counter-group:visible')).toHaveAttribute('data-theme','chicken');
  await page.getByRole('button',{name:'All',exact:true}).click();
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await expect(page.getByRole('button',{name:'Increase Mutton with bone',exact:true})).toBeVisible();
  await expect(page.locator('[data-role="count"]')).toHaveText('1 item');
  const calls=()=>page.evaluate(()=>Reflect.get(window,'__motionTestCalls') as string[]);
  expect(await calls()).toContain('basket');
  expect(await calls()).toContain('category');
  await page.emulateMedia({reducedMotion:'reduce'});
  const before=(await calls()).length;
  await page.getByRole('button',{name:'Increase Mutton with bone',exact:true}).click();
  expect((await calls()).length).toBe(before);
  await page.getByRole('button',{name:'Review request'}).click();
  await expect(page.getByRole('dialog').locator('.receipt-intro')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('1 kg',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Check latest rates & availability'})).toBeVisible();
});
