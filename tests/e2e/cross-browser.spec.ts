import {test,expect} from '@playwright/test';

test('mobile customer native review, keyboard focus, fresh unpriced handoff and saved draft',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByText('Live rates unavailable · ask the shop')).toBeVisible();
  const add=page.getByRole('button',{name:'Add Mutton with bone',exact:true});
  await add.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Increase Mutton with bone',exact:true})).toBeFocused();
  const opener=page.getByRole('button',{name:'Review request'});
  await opener.click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  await dialog.getByLabel('Cut or preparation (optional)').fill('چھوٹے ٹکڑے');
  await dialog.getByRole('button',{name:'Pickup',exact:true}).click();
  await dialog.getByRole('button',{name:'Check latest rates & availability'}).click();
  const link=dialog.getByRole('link',{name:'Continue as unpriced enquiry'});
  await expect(link).toBeVisible();
  const url=new URL((await link.getAttribute('href'))!);
  expect(url.pathname).toBe('/918143730054');
  expect(url.searchParams.get('text')).toContain('چھوٹے ٹکڑے');
  expect(url.searchParams.get('text')).toContain('Pickup chahiye.');
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.reload();
  await expect(opener).toBeVisible();
  await opener.click();
  await expect(dialog.getByLabel('Cut or preparation (optional)')).toHaveValue('');
  await expect(link).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('native contact and true 404 work with scripts disabled',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:700}});
  try{
    const page=await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('link',{name:'Ask on WhatsApp',exact:true})).toBeVisible();
    expect((await page.goto('/not-a-real-counter-route/'))?.status()).toBe(404);
    await expect(page.getByRole('link',{name:'Back to the counter',exact:true})).toBeVisible();
    await page.getByRole('link',{name:'Back to the counter',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Choose your cuts'})).toBeVisible();
  }finally{await context.close();}
});
