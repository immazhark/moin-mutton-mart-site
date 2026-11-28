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
