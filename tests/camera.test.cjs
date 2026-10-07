const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('path').join(__dirname,'..');
function stream(){const track={stops:0,events:{},label:'Capture card',stop(){this.stops++},addEventListener(n,f){this.events[n]=f},getSettings(){return {width:1280,height:720}}};return {track,getTracks(){return[track]},getVideoTracks(){return[track]}}}
function harness(gum,whep){
 const nodes=new Map(),events={},intervals=new Map();let clock=100,id=0,chosen=null;
 const el=n=>{if(!nodes.has(n))nodes.set(n,{hidden:n==='camera-panel',value:'',textContent:'',disabled:false,events:{},readyState:3,videoWidth:1280,videoHeight:720,currentTime:1,addEventListener(n,f){this.events[n]=f},setAttribute(){},focus(){},pause(){},play:async()=>{},requestVideoFrameCallback(f){this.frame=f;return 1},cancelVideoFrameCallback(){this.frame=null},replaceChildren(){},add(){}});return nodes.get(n)};
 el('camera-source').value='phone';
 const c={console,Blob,File,performance:{now:()=>clock},$:el,selectedImage:null,updateButton(){},Option:class{},navigator:{mediaDevices:{getUserMedia:gum,enumerateDevices:async()=>[]}},window:{isSecureContext:true,addEventListener(n,f){events[n]=f}},document:{hidden:false,body:{classList:{toggle(){}}},addEventListener(n,f){events[n]=f},createElement(){return {getContext(){return{drawImage(){}}},toBlob(f){f(new Blob(['x'],{type:'image/jpeg'}))}}}},setInterval(f){intervals.set(++id,f);return id},clearInterval(i){intervals.delete(i)},WHEPCamera:whep,chooseFile:async(f)=>{chosen=f;c.selectedImage=f?{}:null;}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(root+'/camera.js','utf8'),c);
 return {c,el,events,chosen:()=>chosen,frame(){el('camera-video').frame?.()},advance(ms){clock+=ms;for(const f of [...intervals.values()])f()}};
}
(async()=>{
 let calls=[];const s=stream(),h=harness(async x=>{calls.push(x);return s});
 assert.equal(calls.length,0);await h.c.openCamera();assert.equal(calls[0].audio,false);assert.equal(h.el('capture-photo').disabled,true);h.frame();assert.equal(h.el('capture-photo').disabled,false);await h.c.capturePhoto();assert.equal(h.chosen().name,'phone-capture.jpg');assert.equal(s.track.stops,0);h.c.closeCamera();assert.equal(s.track.stops,1);
 const exact=stream();let constraints;const d=harness(async x=>{constraints=x;return exact});d.el('camera-source').value='device';await d.c.openCamera();assert.equal(constraints,undefined);d.el('camera-device').value='drone-42';await d.c.openCamera();assert.equal(constraints.video.deviceId.exact,'drone-42');assert.equal(constraints.video.facingMode,undefined);d.frame();exact.track.events.ended();assert.equal(d.el('camera-panel').hidden,true);
 let rejects=0;const missing=harness(async()=>{rejects++;throw Object.assign(new Error(),{name:'OverconstrainedError'})});missing.el('camera-source').value='device';missing.el('camera-device').value='gone';await missing.c.openCamera();assert.equal(rejects,1);assert.match(missing.el('camera-error').textContent,/No alternate camera/);
 let resolve;const pendingStream=stream(),p=harness(()=>new Promise(r=>resolve=r));const waiting=p.c.openCamera();p.c.closeCamera();resolve(pendingStream);await waiting;assert.equal(pendingStream.track.stops,1);
 const stalled=stream(),f=harness(async()=>stalled);await f.c.openCamera();f.frame();f.advance(4500);assert.equal(stalled.track.stops,1);assert.equal(f.el('capture-photo').disabled,true);
 let localCalls=0,closed=0;const net=stream(),n=harness(async()=>{localCalls++;},class{async connect(){return net}close(){closed++}});n.el('camera-source').value='whep';await n.c.openCamera();n.frame();await n.c.capturePhoto();assert.equal(n.chosen().name,'whep-capture.jpg');n.c.closeCamera();assert.equal(localCalls,0);assert.equal(closed,1);
 const hiddenStream=stream(),v=harness(async()=>hiddenStream);await v.c.openCamera();v.c.document.hidden=true;v.events.visibilitychange();assert.equal(hiddenStream.track.stops,1);
 const denied=harness(async()=>{throw Object.assign(new Error(),{name:'NotAllowedError'})});await denied.c.openCamera();assert.match(denied.el('camera-error').textContent,/permission denied/);
 console.log('PASS: explicit permission, fresh-frame gating, capture stays live, exact source, no fallback, cancellation, disconnect, frozen feed, network without local camera, hidden-tab cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
