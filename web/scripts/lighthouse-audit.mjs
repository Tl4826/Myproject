import fs from 'node:fs/promises';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
const origin='http://127.0.0.1:3000';
const results=[];
await fs.mkdir('lighthouse-reports',{recursive:true});
for (const path of ['/','/diary','/baocao']) {
  const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const page=await browser.newPage();
    if(path!=='/'){
      await page.goto(origin+'/login',{waitUntil:'domcontentloaded',timeout:60000});
      const email='lh-'+Date.now()+'@example.invalid';
      const status=await page.evaluate(async email=>{
        const response=await fetch('/api/email-auth',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'register',name:'Lighthouse Test',email,password:'synthetic-test-only-2026',remember:true})});
        return response.status;
      },email);
      if(status!==201) throw new Error('Mock registration failed: '+status);
    }
    await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector(path==='/'?'h1':'main',{visible:true,timeout:45000});
    if(new URL(page.url()).pathname!==path) throw new Error('Unexpected audit route '+page.url());
    const result=await lighthouse(origin+path,{port:Number(new URL(browser.wsEndpoint()).port),output:['html','json'],
      logLevel:'error',disableStorageReset:true,onlyCategories:['performance','accessibility','best-practices','seo']});
    if(!result || result.lhr.runtimeError || new URL(result.lhr.finalDisplayedUrl || result.lhr.finalUrl).pathname!==path)
      throw new Error('Invalid Lighthouse result for '+path);
    await page.close();
    const slug=path==='/'?'landing':path.slice(1);
    await fs.writeFile('lighthouse-reports/'+slug+'.html',result.report[0]);
    await fs.writeFile('lighthouse-reports/'+slug+'.json',result.report[1]);
    results.push({route:path,...Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)]))});
    await fs.writeFile('lighthouse-reports/summary.json',JSON.stringify(results,null,2));
  } finally { await browser.close(); }
}
console.table(results);
