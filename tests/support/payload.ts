import {expect,type Page} from '@playwright/test';
import {gzipSync} from 'node:zlib';

/** Browser-observed local resources, gzipped independently at level 9.
 * Not a claim about CDN transfer, timing, Lighthouse, or physical devices. */
export async function measureCounter(page:Page){
  const resources=await page.evaluate(()=>({
    urls:[...new Set(performance.getEntriesByType('resource').map(e=>e.name))],
    inlineJS:[...document.querySelectorAll('script:not([src])')].map(e=>e.textContent??''),
    inlineCSS:[...document.querySelectorAll('style')].map(e=>e.textContent??''),
    logo:(document.querySelector('.brand img') as HTMLImageElement|null)?.currentSrc??'',
  }));
  const origin=new URL(page.url()).origin;
  const gz=(v:Buffer|string)=>gzipSync(v,{level:9}).byteLength;
  let js=resources.inlineJS.reduce((sum,x)=>sum+gz(x),0);
  let css=resources.inlineCSS.reduce((sum,x)=>sum+gz(x),0);
  const inlineCssBytes=resources.inlineCSS.reduce((sum,x)=>sum+Buffer.byteLength(x),0);
  const html=await page.request.get(page.url());
  let firstView=gz(await html.body());
  let logoBytes=0;
  const assets:{file:string;bytes:number;gzip:number}[]=[];
  for(const name of resources.urls){
    const url=new URL(name);
    if(url.origin!==origin)continue; // never re-fetch live data just to measure it
    const response=await page.request.get(url.href);
    expect(response.ok()).toBe(true);
    const body=await response.body();
    const extension=url.pathname.split('.').pop();
    const compressed=['js','mjs','css','svg','json'].includes(extension??'')?gz(body):body.byteLength;
    firstView+=compressed;
    if(extension==='js'||extension==='mjs'){
      js+=compressed;
      expect(body.toString()).not.toMatch(/@firebase\/firestore|WebChannelConnection|FirestoreClient|firebase\/auth/);
    }
    if(extension==='css')css+=compressed;
    if(name===resources.logo)logoBytes=body.byteLength;
    assets.push({file:url.pathname,bytes:body.byteLength,gzip:compressed});
  }
  const result={jsGzipBytes:js,cssGzipBytes:css,inlineCssBytes,firstViewStaticEstimateBytes:firstView,logoBytes,assets};
  console.log('COUNTER_PAYLOAD '+JSON.stringify(result));
  expect(logoBytes).toBeGreaterThan(0);
  expect(logoBytes).toBeLessThanOrEqual(90000);
  expect(inlineCssBytes).toBeLessThanOrEqual(14000);
  expect(css).toBeLessThanOrEqual(60000);
  expect(firstView).toBeLessThanOrEqual(500000);
  expect(js).toBeLessThanOrEqual(60000);
  return result;
}
