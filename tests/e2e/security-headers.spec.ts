import {test,expect} from '@playwright/test';
test('preview headers protect documents, preserve cache separation and keep CSP staged',async({page,request})=>{
  for(const path of ['/','/privacy/','/admin/','/admin/index.html']){
    const response=await request.get(path);
    expect(response.ok()).toBe(true);
    const h=response.headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('no-referrer');
    expect(h['permissions-policy']).toContain('camera=()');
    expect(h['x-robots-tag']).toBe('noindex, nofollow');
    expect(h['content-security-policy']).toBeUndefined();
    expect(h['content-security-policy-report-only']).toContain("script-src 'self'");
    expect(h['content-security-policy-report-only']).not.toContain("'unsafe-inline'");
    expect(h['cross-origin-opener-policy']).toBeUndefined();
    if(path.startsWith('/admin'))expect(h['cache-control']).toBe('no-store');
  }
  const response=await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('button',{name:'Add Mutton with bone',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Review request'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(()=>{
    document.addEventListener('securitypolicyviolation',event=>{
      if(event.disposition==='report'&&event.effectiveDirective.startsWith('script-src'))document.documentElement.dataset.qaCspReport='yes';
    });
    const script=document.createElement('script');
    script.textContent="document.documentElement.dataset.qaCspRan='yes'";
    document.head.append(script);
  });
  await expect(page.locator('html')).toHaveAttribute('data-qa-csp-ran','yes');
  await expect(page.locator('html')).toHaveAttribute('data-qa-csp-report','yes');
  const script=await page.locator('script[src*="/_astro/"],astro-island[component-url]').first().evaluate(el=>el.getAttribute('src')??el.getAttribute('component-url'));
  expect(script).toBeTruthy();
  const asset=await request.get(script!);
  expect(asset.ok()).toBe(true);
  expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  expect((await request.get('/_headers')).status()).toBe(404);
});
