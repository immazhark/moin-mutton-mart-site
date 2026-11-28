import {test,expect} from '@playwright/test';
import {readdirSync,readFileSync,lstatSync} from 'node:fs';
import {join,relative} from 'node:path';

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

test('the ordinary deployment artifact contains no QA harnesses, source maps or private files',()=>{
  const root=join(process.cwd(),'dist');
  const visit=(directory:string):string[]=>readdirSync(directory).flatMap(name=>{
    const path=join(directory,name),entry=lstatSync(path);
    expect(entry.isSymbolicLink(),relative(root,path)).toBe(false);
    return entry.isDirectory()?visit(path):[path];
  });
  const files=visit(root);
  const names=files.map(path=>relative(root,path).replaceAll('\\','/'));
  expect(names).toEqual(expect.arrayContaining(['index.html','admin/index.html','privacy/index.html','404.html','_headers','robots.txt','sitemap.xml']));
  for(const [i,name] of names.entries()){
    expect(name).not.toMatch(/(?:^|\/)(?:\.env[^/]*|\.git|reference|tests|firebase|docs|node_modules)(?:\/|$)|\.map$/);
    if(!/\.(?:html|js|mjs|css)$/.test(name))continue;
    const content=readFileSync(files[i],'utf8');
    expect(content,name).not.toMatch(/qa-lose-ack|qa-create-owner|qa-probe-auth|Synthetic lost acknowledgement|qa-emulator-network|127\.0\.0\.1:8088|127\.0\.0\.1:9099/);
    if(name.endsWith('.html'))expect(content,name).toMatch(/<meta[^>]+name=["']robots["'][^>]+content=["']noindex,nofollow["']/i);
  }
});

test('brand link includes its visible identity and pending handoff is not an empty or actionable link',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveAccessibleName(/Moin Mutton Mart\s+Mallepally, Hyderabad/);
  const pending=page.locator('#review-handoff');
  await expect(pending).toHaveText('Continue on WhatsApp');
  await expect(pending).toBeHidden();
  expect(await pending.getAttribute('href')).toBeNull();
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Review request'}).click();
  await expect(pending).toBeHidden();
  expect(await pending.getAttribute('href')).toBeNull();
  await page.getByRole('button',{name:'Check latest rates & availability'}).click();
  await expect(pending).toBeVisible();
  await expect(pending).toHaveAccessibleName('Continue as unpriced enquiry');
  await page.getByLabel('Cut or preparation (optional)').fill('Small pieces');
  await expect(pending).toBeHidden();
  expect(await pending.getAttribute('href')).toBeNull();
});


test('each public route declares a small, resolvable local brand icon',async({page,request})=>{
  for(const path of ['/','/privacy/','/admin/','/404.html']){
    await page.goto(path);
    const icon=page.locator('head link[rel="icon"]');
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute('type','image/png');
    const href=await icon.getAttribute('href');
    expect(href).toMatch(/^\/(?!\/)/);
    const response=await request.get(href!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    const bytes=await response.body();
    expect(bytes.length).toBeLessThan(15_000);
    expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  }
});

test('privacy clear control reserves its space without scripting and only enables with JavaScript',async({browser,page})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const offline=await context.newPage();
    await offline.goto('/privacy/');
    const control=offline.getByRole('button',{name:'Clear saved basket'});
    await expect(control).toBeVisible();
    await expect(control).toBeDisabled();
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(offline.getByText('Remove this site’s stored data in your browser settings')).toBeVisible();
  }finally{await context.close();}
  await page.goto('/privacy/');
  await expect(page.getByRole('button',{name:'Clear saved basket'})).toBeEnabled();
});
