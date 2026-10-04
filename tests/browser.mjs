import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('artifacts', {recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
const state=()=>page.evaluate(()=>window.hakoniwa.state);
try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.hakoniwa?.state.ready);
  await page.waitForTimeout(1600);
  const initial=await state();assert.equal(initial.machines,18);assert.equal(initial.occupied,14);
  await page.screenshot({path:'artifacts/overview.png'});
  await page.waitForTimeout(1000);
  assert.notDeepEqual((await state()).walking,initial.walking,'Walkers should move');
  await page.locator('#pause').click();
  const paused=await state();await page.waitForTimeout(600);
  assert.equal((await state()).time,paused.time,'Pause should freeze simulation');
  await page.locator('#pause').click();
  await page.waitForTimeout(300);assert.ok((await state()).time>paused.time);
  const cameraBefore=(await state()).camera;
  await page.mouse.move(900,470);await page.mouse.down();await page.mouse.move(1100,510,{steps:12});await page.mouse.up();
  await page.waitForTimeout(700);assert.notDeepEqual((await state()).camera,cameraBefore,'Drag should orbit');
  await page.locator('#overview').click();await page.waitForTimeout(1400);
  await page.locator('#person').click();await page.waitForTimeout(1600);
  assert.equal((await state()).viewIndex,0);
  await page.screenshot({path:'artifacts/person-view.png'});
  await page.locator('#person').click();await page.waitForTimeout(1300);assert.equal((await state()).viewIndex,1);
  await page.keyboard.press('v');await page.waitForTimeout(1300);assert.equal((await state()).viewIndex,2);
  for(let i=3;i<initial.people;i++) {
    await page.locator('#person').click();await page.waitForTimeout(1200);
    assert.equal((await state()).viewIndex,i,`Person view ${i} is reachable`);
    if(i===4)await page.screenshot({path:'artifacts/staff-view.png'});
  }
  await page.locator('#person').click();await page.waitForTimeout(1200);assert.equal((await state()).viewIndex,0,'View sequence wraps to the first person');
  await page.keyboard.press('Escape');await page.waitForTimeout(1300);assert.equal((await state()).viewIndex,-1);
  await page.locator('#rotate').click();const rotating=(await state()).camera;await page.waitForTimeout(800);assert.notDeepEqual((await state()).camera,rotating);
  await page.locator('#rotate').click();await page.locator('#overview').click();await page.waitForTimeout(1300);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1600);
  await page.screenshot({path:'artifacts/mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');
  for(const id of ['overview','person','rotate','pause']){const b=await page.locator(`#${id}`).boundingBox();assert.ok(b.x>=0&&b.x+b.width<=390,`${id} fits viewport`);}
  assert.deepEqual(errors,[]);
  const report={result:'passed',initial,final:await state(),errors,screenshots:['overview.png','person-view.png','mobile.png']};
  await writeFile('artifacts/test-report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} catch(error) {
  console.error('Browser errors:', errors);
  await page.screenshot({path:'artifacts/failure.png'}).catch(()=>{});
  throw error;
} finally {await browser.close();}
