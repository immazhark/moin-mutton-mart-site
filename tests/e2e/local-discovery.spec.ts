import {test,expect} from '@playwright/test';
test('local discovery is static and factual without making previews indexable',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const page=await context.newPage();
    for(const path of ['/','/privacy/','/admin/']){
      const response=await page.goto(path);
      expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,nofollow');
      if(path!=='/admin/'){
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://moinmuttonmart.in'+path);
      }else await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    }
    await page.goto('/');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content','https://moinmuttonmart.in/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content','https://moinmuttonmart.in/images/logo.png');
    const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent()??'');
    const store=graph['@graph'].find((n:Record<string,unknown>)=>n['@type']==='Store');
    expect(store.telephone).toBe('+918143730054');
    expect(store).not.toHaveProperty('openingHoursSpecification');
    expect(store.address).not.toHaveProperty('streetAddress');
    expect(store).not.toHaveProperty('geo');
    await expect(page.getByRole('heading',{name:'Visit the shop'})).toBeVisible();
    await expect(page.getByText('Opening hours: call to confirm.')).toBeVisible();
    const maps=page.getByRole('link',{name:'Search Mallepally on Maps'});
    expect(new URL((await maps.getAttribute('href'))!).searchParams.get('query')).toBe('Mallepally, Hyderabad, India');
    await expect(page.getByRole('link',{name:'Instagram',exact:true})).toHaveAttribute('href','https://www.instagram.com/moin_mutton_mart/');
    await expect(page.getByRole('heading',{name:'Before you order'})).toBeVisible();
    await expect(page.getByText('How do I know today’s rate?',{exact:true})).toBeVisible();
    const robots=await page.request.get('/robots.txt');
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).not.toMatch(/Disallow:\s*\//i);
    expect(await robots.text()).not.toMatch(/Sitemap:/i);
    const sitemap=await page.request.get('/sitemap.xml');
    expect(sitemap.ok()).toBe(true);
    expect(sitemap.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(await sitemap.text()).toContain('<loc>https://moinmuttonmart.in/</loc>');
    expect(await sitemap.text()).not.toContain('/admin');
    expect(await sitemap.text()).not.toContain('pages.dev');
  }finally{await context.close();}
});
