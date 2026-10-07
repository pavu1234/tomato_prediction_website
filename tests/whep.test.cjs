const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../whep-camera.js'),'utf8');
let lastPeer,requests=[];
const track={kind:'video',stop(){}};
class Peer {
 constructor(){lastPeer=this;this.iceGatheringState='complete'}
 addTransceiver(type,opts){assert.equal(type,'video');assert.equal(opts.direction,'recvonly')}
 async createOffer(){return {type:'offer',sdp:'test-offer'}}
 async setLocalDescription(s){this.localDescription=s}
 async setRemoteDescription(s){assert.equal(s.type,'answer');this.ontrack({track})}
 close(){this.closed=true}
}
const context={URL,AbortController,setTimeout,clearTimeout,location:{protocol:'https:'},RTCPeerConnection:Peer,MediaStream:class{constructor(){this.tracks=[]}addTrack(t){this.tracks.push(t)}getTracks(){return this.tracks}},fetch:async(url,options)=>{requests.push({url,options});return {status:201,headers:new Map([['Location','/drone/session/1'],['Content-Type','application/sdp']]),text:async()=>'test-answer'}}};
vm.createContext(context);vm.runInContext(source+'\nglobalThis.Camera=WHEPCamera;',context);
(async()=>{
 for(const url of ['rtsp://example/drone','http://example/drone','https://user:pass@example/whep'])assert.throws(()=>new context.Camera(url));
 const camera=new context.Camera('https://adapter.example/drone/whep','secret');const received=await camera.connect(()=>{});assert.equal(received.getTracks().length,1);assert.equal(requests[0].options.method,'POST');assert.equal(requests[0].options.headers.Authorization,'Bearer secret');camera.close();assert.equal(lastPeer.closed,true);assert.equal(requests[1].options.method,'DELETE');
 let lost=false;const next=new context.Camera('https://adapter.example/drone/whep');await next.connect(()=>{lost=true});lastPeer.connectionState='disconnected';lastPeer.onconnectionstatechange();assert.equal(lost,true);next.close();
 context.fetch=async()=>({status:401});const failure=new context.Camera('https://adapter.example/drone/whep');await assert.rejects(failure.connect(()=>{}),/401/);assert.equal(lastPeer.closed,true);
 let resolve;context.fetch=()=>new Promise(r=>resolve=r);const pending=new context.Camera('https://adapter.example/drone/whep');const promise=pending.connect(()=>{});await new Promise(r=>setTimeout(r,0));pending.close();resolve({status:201,headers:new Map([['Content-Type','application/sdp']]),text:async()=>''});await assert.rejects(promise,/cancelled/);
 console.log('PASS: receive-only signaling, HTTPS validation, optional authentication, session cleanup, disconnect, HTTP failure, cancellation. WebRTC transport mocked; physical integration still required.');
})().catch(e=>{console.error(e);process.exitCode=1});
