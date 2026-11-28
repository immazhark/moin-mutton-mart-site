import {test,expect} from '@playwright/test';
import {initializeTestEnvironment,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,Timestamp} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
import {products} from '../../src/data/products';
import type {Availability} from '../../src/lib/catalogue/contract';

if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8088')throw Error('Refusing non-local Firestore');
let env:RulesTestEnvironment;
const stamp=new Timestamp(1,0);
async function seed(revision:number,rate:number,availability:Availability='available'){
  await env.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'public','catalogue'),{
      schemaVersion:1,revision,operationId:'qa-'+revision,updatedAt:stamp,acceptingRequests:true,showPrices:true,
      offers:Object.fromEntries(products.map(p=>[p.id,{enabled:true,pricePaise:p.id==='mutton-bone'?rate:100000,priceVisibility:'inherit',availability:p.id==='mutton-bone'?availability:'available',stockQuantity:null,priceUpdatedAt:stamp,availabilityUpdatedAt:stamp}]))
    });
  });
}
test.beforeAll(async()=>{
  env=await initializeTestEnvironment({projectId:'demo-moin-security',firestore:{host:'127.0.0.1',port:8088,rules:readFileSync(new URL('../../firebase/firestore.rules',import.meta.url),'utf8')}});
  await env.clearFirestore();
});
test.afterAll(async()=>{await env?.cleanup();});
test('configured catalogue reviews changed rates, preserves blocked stock through outage, and recovers',async({page})=>{
  // Browser cannot contact any external service; never send the WhatsApp message.
  const external:string[]=[];
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1'&&['4322','8088'].includes(url.port))return route.continue();
    external.push(url.origin);return route.abort();
  });
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('Synthetic clipboard denial'))}}));
  await seed(1,100000);
  await page.setViewportSize({width:360,height:844});
  await page.goto('/');
  await expect(page.getByText('Current rates and stock · subject to confirmation')).toBeVisible({timeout:15000});
  await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
  await page.getByRole('button',{name:'Review request'}).click();
  const sheet=page.getByRole('dialog');
  await sheet.getByRole('button',{name:'Delivery',exact:true}).click();
  await sheet.getByLabel('Cut or preparation (optional)').fill('Medium curry pieces & తెలుగు');
  const check=sheet.getByRole('button',{name:'Check latest rates & availability'});
  const continueLink=sheet.getByRole('link',{name:'Continue on WhatsApp'});
  const fallback=sheet.getByRole('link',{name:'Continue as unpriced enquiry'});
  await seed(2,120000);
  await check.click();
  await expect(sheet.getByText('Please review the current rates and availability for: Mutton with bone.')).toBeVisible();
  await expect(sheet.getByText(/Estimated total:.*600/)).toBeVisible();
  await expect(continueLink).toHaveCount(0);
  await check.click();
  await expect(continueLink).toBeVisible();
  const href=await continueLink.getAttribute('href');
  expect(href).toBeTruthy();
  const url=new URL(href!);
  expect(url.pathname).toBe('/918143730054');
  const message=url.searchParams.get('text')??'';
  expect(message).toContain('Quantity: 500 g');
  expect(message).toContain('Cut: Medium curry pieces & తెలుగు');
  expect(message).toContain('Delivery chahiye');
  expect(message).toMatch(/Andaza:.*600/);

  await seed(3,120000,'sold_out');
  await sheet.getByLabel('Cut or preparation (optional)').fill('Thin slices');
  await sheet.getByRole('button',{name:'Copy request'}).click();
  await expect(sheet.getByRole('textbox',{name:'Request text'})).toBeVisible();
  await check.click();
  await expect(sheet.getByText('Some selections are not currently requestable.',{exact:false})).toBeVisible();
  await expect(continueLink).toHaveCount(0);
  await expect(sheet.getByRole('button',{name:'Copy request'})).toBeDisabled();
  await expect(sheet.getByRole('textbox',{name:'Request text'})).toHaveCount(0);
  await expect(sheet.getByRole('button',{name:'Increase Mutton with bone'})).toBeDisabled();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('qa-emulator-network',{detail:'offline'})));
  await expect(page.locator('html')).toHaveAttribute('data-qa-network','offline');
  await check.click();
  await expect(sheet.getByText('Previously restricted selections could not be rechecked.',{exact:false})).toBeVisible();
  await expect(fallback).toHaveCount(0);
  await expect(sheet.getByRole('button',{name:'Copy request'})).toBeDisabled();

  await seed(4,120000);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('qa-emulator-network',{detail:'online'})));
  await expect(page.locator('html')).toHaveAttribute('data-qa-network','online');
  await check.click();
  await expect(sheet.getByText('Please review the current rates and availability for: Mutton with bone.')).toBeVisible();
  await check.click();
  await expect(continueLink).toBeVisible();

  await sheet.getByLabel('Cut or preparation (optional)').fill('Curry pieces');
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('qa-emulator-network',{detail:'offline'})));
  await expect(page.locator('html')).toHaveAttribute('data-qa-network','offline');
  await check.click();
  await expect(fallback).toBeVisible();
  const unpriced=new URL((await fallback.getAttribute('href'))!).searchParams.get('text')??'';
  expect(unpriced).not.toContain('Andaza:');
  expect(unpriced).toContain('Rate aur total confirm kar dijiye.');
  expect(external).toEqual([]);
});
