let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}

const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'), work=path.dirname(root);
(async()=>{
 const names=['early_blight','healthy','late_blight'];
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'reports/manifest.json')));
 const samples=[{id:'reported-late-blight',file:path.join(work,'upload/tomato-late-blight-tomato-1556463954.jpg'),label:'late_blight'}];
 for(const label of names)samples.push({id:'original-'+label,file:path.join(root,'regression_samples',label+'.jpg'),label});
 for(const source of ['PlantVillage','PlantDoc'])for(const label of names){const r=manifest.find(r=>r.split==='val'&&r.source===source&&r.label===label);samples.push({id:r.id,file:path.join(root,r.path),label});}
 const routes=new Map(samples.map((r,i)=>['/image/'+i,r.file]));
 for(const f of ['tf.min.js','tflite_web_api_cc.js','tflite_web_api_cc.wasm','engine.js'])routes.set('/'+f,path.join(root,'browser_runtime',f));
 routes.set('/model.tflite',path.join(root,'models/candidate.tflite'));
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<script src="/tf.min.js"></script><script src="/tflite_web_api_cc.js"></script><script src="/engine.js"></script>');return;}
  const file=routes.get(u.pathname);if(!file){res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.wasm')?'application/wasm':'application/octet-stream');fs.createReadStream(file).pipe(res);
 });await new Promise(r=>server.listen(8772,'127.0.0.1',r));
 let launchOptions={headless:true};if(fs.existsSync(path.join(work,'leaf_guard_dev/chromium'))){const preset=require('../../leaf_guard_dev/node_modules/@sparticuz/chromium');launchOptions={...launchOptions,executablePath:path.join(work,'leaf_guard_dev/chromium'),args:preset.args.filter(x=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(x))};}const browser=await chromium.launch(launchOptions);
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:8772');
  const result=await page.evaluate(async({samples,names})=>{
   await tf.setBackend('cpu');await tf.ready();const [wasm,model]=await Promise.all(['/tflite_web_api_cc.wasm','/model.tflite'].map(async u=>(await fetch(u)).arrayBuffer()));
   const engine=await createLeafEngine(tflite_web_api_ModuleFactory,wasm,model);const out=[];
   for(let i=0;i<samples.length;i++){
    const img=new Image();img.src='/image/'+i;await img.decode();const start=performance.now();
    const pixels=tf.tidy(()=>tf.image.resizeBilinear(tf.browser.fromPixels(img,3),[224,224],false,true).toFloat().dataSync());
    const scores=engine.predict(pixels);out.push({id:samples[i].id,label:samples[i].label,prediction:names[scores.indexOf(Math.max(...scores))],scores,milliseconds:performance.now()-start});
   }engine.dispose();return out;
  },{samples:samples.map(({id,label})=>({id,label})),names});
  fs.writeFileSync(path.join(root,'reports/browser_check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
