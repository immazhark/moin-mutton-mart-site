import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync,readdirSync,lstatSync} from 'node:fs';
import {join,relative,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';

const origin='http://127.0.0.1:4324';
const mode=process.env.MODE;
const tools=process.env.MOIN_EVIDENCE_TOOLS;
const output=process.env.MOIN_EVIDENCE_DIR;
const chrome=process.env.CHROME_PATH;
if(!['mobile','desktop','accessibility'].includes(mode)||!tools||!output||!chrome||
   ![tools,output,chrome].every(isAbsolute)||!process.env.RUNNER_TEMP||
   !tools.startsWith(process.env.RUNNER_TEMP+'/')||!output.startsWith(process.env.RUNNER_TEMP+'/')){
  throw Error('Run only in an isolated evidence runner with explicit absolute paths');
}
mkdirSync(output,{recursive:true});
const requireTool=createRequire(join(tools,'package.json'));
const routes=[['home','/'],['privacy','/privacy/'],['admin-unconfigured','/admin/'],['not-found-template','/404.html']];
const flags=['--no-sandbox','--disable-background-networking','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'];
const write=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n');
const print=(name,value)=>console.log(name+' '+JSON.stringify(value));
const problems=[];
function issue(label,error){
  const message=error instanceof Error?error.message:String(error);
  problems.push({label,message});print('EVIDENCE_RUNNER_ERROR',{label,message});
}
function inventory(){
  const walk=dir=>readdirSync(dir).flatMap(name=>{const path=join(dir,name),entry=lstatSync(path);if(entry.isSymbolicLink())throw Error('Unexpected build symlink');return entry.isDirectory()?walk(path):[path];});
  const files=walk('dist').map(path=>{const data=readFileSync(path);return {path:relative('dist',path),bytes:data.length,gzipBytes:gzipSync(data,{level:9}).length};}).sort((a,b)=>b.bytes-a.bytes);
  write('bundle-inventory.json',files);
}
async function laboratory(){
  for(const [name,path] of routes){
    try{
      const destination=join(output,name+'.json');
      const args=[origin+path,'--quiet','--output=json','--output-path='+destination,
        '--chrome-flags='+flags.map(flag=>flag.includes(' ')?'"'+flag+'"':flag).join(' '),
        '--only-categories=performance,accessibility,best-practices,seo'];
      if(mode==='desktop')args.push('--preset=desktop');
      execFileSync(join(tools,'node_modules','.bin','lighthouse'),args,{stdio:'inherit',timeout:120000,env:{...process.env,CHROME_PATH:chrome}});
      const report=JSON.parse(readFileSync(destination,'utf8'));
      if(report.runtimeError)throw Error(report.runtimeError.message||'Lighthouse runtime error');
      const metric=id=>report.audits[id]?.numericValue??null;
      const summary={route:name,mode,version:report.lighthouseVersion,scores:Object.fromEntries(Object.entries(report.categories).map(([key,value])=>[key,value.score===null?null:Math.round(value.score*100)])),metrics:{lcpMs:metric('largest-contentful-paint'),cls:metric('cumulative-layout-shift'),tbtMs:metric('total-blocking-time'),fcpMs:metric('first-contentful-paint'),serverResponseMs:metric('server-response-time'),inpMs:null},failedAudits:Object.values(report.audits).filter(x=>x.score!==null&&x.score<1&&x.scoreDisplayMode!=='informative').map(x=>({id:x.id,score:x.score}))};
      print('LIGHTHOUSE_RESULT',summary);
    }catch(error){issue(name,error);}
  }
}
async function accessibility(){
  const browser=await chromium.launch({headless:true,args:flags});
  const axeFile=requireTool.resolve('axe-core/axe.min.js');
  const pa11y=requireTool('pa11y');
  const reports=[];
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();
    async function scan(name){
      await page.addScriptTag({path:axeFile});
      const result=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
      write('axe-'+name+'.json',result);
      const summary={name,violations:result.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})),incomplete:result.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),passes:result.passes.length};
      reports.push(summary);print('AXE_RESULT',summary);
    }
    for(const [name,path] of routes){
      try{
        await page.goto(origin+path,{waitUntil:'networkidle'});
        await scan(name);
        await page.screenshot({path:join(output,name+'-390.png')});
      }catch(error){issue('axe-'+name,error);}
      try{
        const result=await pa11y(origin+path,{standard:'WCAG2AA',runners:['htmlcs'],viewport:{width:390,height:844},chromeLaunchConfig:{executablePath:chrome,args:flags,headless:true},timeout:30000,wait:250});
        write('pa11y-'+name+'.json',result);
        print('PA11Y_RESULT',{name,errors:result.issues.filter(x=>x.type==='error').map(x=>({code:x.code,selector:x.selector,message:x.message})),warnings:result.issues.filter(x=>x.type==='warning').length,notices:result.issues.filter(x=>x.type==='notice').length});
      }catch(error){issue('pa11y-'+name,error);}
    }
    try{
      await page.goto(origin+'/',{waitUntil:'networkidle'});
      await page.getByRole('button',{name:'Add Mutton with bone',exact:true}).click();
      await page.getByRole('button',{name:'Review request'}).click();
      await page.getByRole('dialog').waitFor();
      await scan('review');
      await page.screenshot({path:join(output,'review-390.png')});
      // Re-check the destination in view, retain both reports and incomplete results.
      await page.locator('.destination').first().scrollIntoViewIfNeeded();
      await scan('review-destination');
      await page.getByRole('button',{name:'Check latest rates & availability'}).click();
      await page.getByRole('link',{name:'Continue as unpriced enquiry'}).waitFor();
      await scan('review-ready-unpriced');
      await page.screenshot({path:join(output,'review-ready-390.png')});
      await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});
      await page.screenshot({path:join(output,'review-forced-colors-reduced-motion.png')});
      await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});
      await page.getByRole('button',{name:'Close',exact:true}).click();
      await page.getByRole('dialog').waitFor({state:'hidden'});
      await context.close();
      for(const width of [320,360,390,768,1280,1920]){
        const clean=await browser.newContext({viewport:{width,height:844}});
        await clean.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
        const p=await clean.newPage();
        await p.goto(origin+'/',{waitUntil:'networkidle'});
        await p.screenshot({path:join(output,'home-'+width+'.png')});
        await clean.close();
      }
      const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
      await noJS.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
      const p=await noJS.newPage();
      await p.goto(origin+'/');await p.getByRole('link',{name:'Ask on WhatsApp',exact:true}).waitFor();
      await p.screenshot({path:join(output,'home-no-js.png')});
      await noJS.close();
    }catch(error){issue('review-and-visuals',error);}
  }finally{await browser.close();}
  write('axe-summary.json',reports);
  inventory();
}
if(mode==='accessibility')await accessibility();
else await laboratory();
write('runner-errors.json',problems);
print('EVIDENCE_SCOPE',{mode,origin,sha:process.env.GITHUB_SHA??null,fixture:'unconfigured loopback build; no production, field INP or physical device claim',runnerErrors:problems.length});
if(problems.length)process.exitCode=1;
