import {test,expect,type Locator} from '@playwright/test';

async function target(locator:Locator){
  const box=await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}
async function unobscured(locator:Locator){
  await locator.focus();
  await expect.poll(async()=>locator.evaluate(el=>{
    const r=el.getBoundingClientRect();
    if(r.width<=0||r.height<=0||r.top<0||r.bottom>innerHeight)return false;
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return !!hit&&(el===hit||el.contains(hit));
  })).toBe(true);
}

for(const width of [320,360,375,390,414,430,768,1024,1280,1440,1920]){
  test(`counter and review touch geometry at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    const add=page.getByRole('button',{name:'Add Mutton with bone',exact:true});
    await target(add);
    await add.click();
    const decrease=page.getByRole('button',{name:'Reduce Mutton with bone',exact:true});
    const increase=page.getByRole('button',{name:'Increase Mutton with bone',exact:true});
    await target(decrease);await target(increase);
    const left=(await decrease.boundingBox())!,right=(await increase.boundingBox())!;
    expect(right.x-left.x-left.width).toBeGreaterThanOrEqual(8);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Review request'}).click();
    const sheet=page.getByRole('dialog');
    await target(sheet.getByRole('button',{name:'Close',exact:true}));
    await target(sheet.getByRole('button',{name:'Reduce Mutton with bone',exact:true}));
    await target(sheet.getByRole('button',{name:'Increase Mutton with bone',exact:true}));
    await target(sheet.getByRole('button',{name:'Delivery',exact:true}));
    expect(await sheet.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  });
}
test('keyboard focus survives quantity controls and final removal',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to the range'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#catalogue')).toBeFocused();
  const add=page.getByRole('button',{name:'Add Mutton with bone',exact:true});
  await add.focus();await page.keyboard.press('Enter');
  const inc=page.getByRole('button',{name:'Increase Mutton with bone',exact:true});
  await expect(inc).toBeFocused();
  const dec=page.getByRole('button',{name:'Reduce Mutton with bone',exact:true});
  await dec.focus();await page.keyboard.press('Enter');
  await expect(add).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Review request'}).focus();
  await page.keyboard.press('Enter');
  const sheet=page.getByRole('dialog');
  await expect(sheet.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  const check=sheet.getByRole('button',{name:'Check latest rates & availability'});
  await check.focus();await page.keyboard.press('Enter');
  await expect(sheet.getByRole('link',{name:'Continue as unpriced enquiry'})).toBeFocused();
  await sheet.getByRole('button',{name:'Remove Mutton with bone'}).focus();
  await page.keyboard.press('Enter');
  await expect(sheet.getByRole('button',{name:'Back to the counter'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Search the range')).toBeFocused();
});
test('200% root text size, focused controls and forced colors remain usable',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.goto('/');
  await page.addStyleTag({content:'html { font-size: 200% !important; }'});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await unobscured(page.getByRole('button',{name:'Add Desi chicken',exact:true}));
  await page.getByRole('button',{name:'Review request'}).click();
  const sheet=page.getByRole('dialog');
  await expect.poll(()=>sheet.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await unobscured(sheet.getByLabel('Cut or preparation (optional)'));
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await expect(sheet.getByRole('button',{name:'Not sure yet'})).toHaveAttribute('aria-pressed','true');
  await expect(sheet.getByRole('button',{name:'Not sure yet'})).toHaveCSS('border-style','solid');
});
test('no JavaScript leaves an honest direct contact path and no inert basket buttons',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:844}});
  try{
    const page=await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading',{name:'Choose your cuts'})).toBeVisible();
    const link=page.getByRole('link',{name:'Ask on WhatsApp',exact:true});
    await expect(link).toBeVisible();
    expect(new URL((await link.getAttribute('href'))!).pathname).toBe('/918143730054');
    await expect(page.getByRole('button',{name:'Add Mutton with bone',exact:true})).not.toBeVisible();
    await expect(page.getByRole('link',{name:'Call',exact:true})).toBeVisible();
  }finally{await context.close();}
});
