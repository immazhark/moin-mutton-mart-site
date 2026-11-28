import {test,expect} from '@playwright/test';
import {initializeTestEnvironment,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDocFromServer,Timestamp} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
import {products} from '../../src/data/products';

if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8088'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('Refusing non-local emulators');
let env:RulesTestEnvironment;
const stamp=new Timestamp(1,0);
test.beforeAll(async()=>{
  env=await initializeTestEnvironment({projectId:'demo-moin-security',firestore:{host:'127.0.0.1',port:8088,rules:readFileSync(new URL('../../firebase/firestore.rules',import.meta.url),'utf8')}});
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'public','catalogue'),{
    schemaVersion:1,revision:1,operationId:'bootstrap',updatedAt:stamp,acceptingRequests:true,showPrices:true,
    offers:Object.fromEntries(products.map(p=>[p.id,{enabled:true,pricePaise:100000,priceVisibility:'inherit',availability:'available',stockQuantity:null,priceUpdatedAt:stamp,availabilityUpdatedAt:stamp}]))
  }));
});
test.afterAll(async()=>{await env?.cleanup();});
test('owner membership gates editing, session is separate from public, audited save and revocation work',async({page})=>{
  const external:string[]=[];
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1'&&['4322','8088','9099'].includes(url.port))return route.continue();
    external.push(url.origin);return route.abort();
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/admin/');
  await expect(page.getByRole('button',{name:'Continue with Google'})).toBeVisible({timeout:15000});
  await page.evaluate(()=>window.dispatchEvent(new Event('qa-create-owner')));
  await expect(page.getByRole('heading',{name:'Access not authorised'})).toBeVisible({timeout:15000});
  const html=page.locator('html');
  await expect(html).not.toHaveAttribute('data-qa-owner-user','absent');
  const uid=await html.getAttribute('data-qa-owner-user');
  expect(uid).toBeTruthy();
  await expect(html).toHaveAttribute('data-qa-public-user','absent');
  await expect(page.getByRole('button',{name:'Save changes'})).toHaveCount(0);
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'admins',uid!),{active:true}));
  await page.reload();
  await expect(page.getByRole('heading',{name:"Today's counter"})).toBeVisible({timeout:15000});
  await expect(html).toHaveAttribute('data-qa-owner-user',uid!);
  await expect(html).toHaveAttribute('data-qa-public-user','absent');
  const rate=page.getByRole('textbox',{name:'Mutton with bone rate in rupees'});
  await expect(rate).toBeEnabled();
  await page.getByRole('button',{name:'Chicken',exact:true}).click();
  await expect(rate).not.toBeVisible();
  await expect(page.getByRole('textbox',{name:'Desi chicken rate in rupees'})).toBeVisible();
  await page.getByRole('button',{name:'All',exact:true}).click();
  await rate.fill('1200');
  await page.getByRole('checkbox',{name:'Changed only'}).check();
  await expect(page.getByRole('textbox',{name:'Desi chicken rate in rupees'})).not.toBeVisible();
  await expect(rate).toBeVisible();
  await page.getByRole('checkbox',{name:'Changed only'}).uncheck();
  // QA-only wrapper throws after the real transaction has committed.
  await page.evaluate(()=>sessionStorage.setItem('qa-lose-ack','1'));
  await page.getByRole('button',{name:'Save changes'}).click();
  await expect(page.getByRole('button',{name:'Verify / retry'})).toBeVisible({timeout:15000});
  const recorded=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('moin-owner-pending-v1')??'null'));
  expect(recorded?.intent?.operationId).toBeTruthy();
  await page.reload();
  await expect(page.getByRole('button',{name:'Verify / retry'})).toBeVisible({timeout:15000});
  await expect(rate).toHaveValue('1200.00');
  await expect(rate).toBeDisabled();
  await page.getByRole('button',{name:'Verify / retry'}).click();
  await expect(page.getByText('Saved successfully. Revision 2.')).toBeVisible({timeout:15000});
  await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('moin-owner-pending-v1'))).toBeNull();
  // Backup restore is a draft, not a write.
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export draft'}).click();
  const download=await downloadPromise;
  const backup=await download.path();
  expect(backup).toBeTruthy();
  await page.locator('input[type="file"]').setInputFiles(backup!);
  await expect(page.getByText('Backup loaded into the draft. Review all changes before saving. Nothing has been published.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Save changes'})).toBeDisabled();
  await expect(rate).toBeEnabled();
  const stock=page.getByRole('textbox',{name:'Mutton with bone stock in grams'});
  await stock.focus();
  await expect.poll(()=>stock.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el;})).toBe(true);
  await page.locator('.owner-tools').scrollIntoViewIfNeeded();
  console.log('OWNER_QA_SCREENSHOT '+(await page.screenshot({type:'jpeg',quality:60})).toString('base64'));
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    const current=(await getDocFromServer(doc(db,'public','catalogue'))).data()!;
    expect(current.revision).toBe(2);
    expect(current.operationId).toBe(recorded.intent.operationId);
    expect(current.offers['mutton-bone'].pricePaise).toBe(120000);
    const audit=(await getDocFromServer(doc(db,'audit',current.operationId))).data()!;
    expect(audit.actorUid).toBe(uid);
    expect(audit.snapshot).toEqual(current);
    await setDoc(doc(db,'admins',uid!),{active:false});
  });
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('heading',{name:'Access not authorised'})).toBeVisible({timeout:15000});
  await expect(rate).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Save changes'})).toHaveCount(0);
  await page.getByRole('button',{name:'Sign out'}).click();
  await expect(page.getByRole('button',{name:'Continue with Google'})).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new Event('qa-probe-auth')));
  await expect(html).toHaveAttribute('data-qa-owner-user','absent');
  await expect(html).toHaveAttribute('data-qa-public-user','absent');
  expect(external).toEqual([]);
});
