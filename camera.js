'use strict';
let cameraStream = null;
let cameraRequest = 0;
let capturingPhoto = false;
window.droneCaptureBusy = false;
function cameraError(text = '') { $('camera-error').textContent = text; $('camera-error').hidden = !text; }
function stopTracks(stream) { if (stream) stream.getTracks().forEach(track => track.stop()); }
function setPower(state) {
 $('drone-power-status').textContent = state;
 document.body.classList.toggle('drone-on',state==='DRONE ON');
 $('drone-off').disabled = state==='DRONE OFF';
}
function closeCamera(returnFocus = true) {
 ++cameraRequest;
 stopTracks(cameraStream); cameraStream=null; capturingPhoto=false; window.droneCaptureBusy=false;
 const video=$('camera-video');video.pause();video.srcObject=null;video.hidden=true;
 $('camera-panel').hidden=true;$('capture-photo').disabled=true;$('capture-photo').textContent='Capture image';
 $('open-camera').disabled=false;$('open-camera').textContent='Drone ON';$('open-camera').setAttribute('aria-expanded','false');
 $('preview').hidden=!selectedImage;$('upload-prompt').hidden=!!selectedImage;
 setPower('DRONE OFF');updateButton();
 if(returnFocus)$('open-camera').focus();
}
async function openCamera() {
 if(!$('camera-panel').hidden)return;
 cameraError();
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){cameraError('Open this HTTPS website in a browser that supports camera access, or upload a photo.');return;}
 const request=++cameraRequest;
 $('camera-panel').hidden=false;$('open-camera').disabled=true;$('open-camera').setAttribute('aria-expanded','true');$('capture-photo').disabled=true;
 $('camera-status').textContent='Allow camera access to turn the virtual drone ON. Drone OFF cancels this request.';
 setPower('REQUESTING CAMERA');updateButton();$('drone-off').focus();
 try {
  const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}}});
  if(request!==cameraRequest){stopTracks(stream);return;}
  cameraStream=stream;
  const video=$('camera-video');video.srcObject=stream;video.hidden=false;$('preview').hidden=true;$('upload-prompt').hidden=true;
  $('camera-status').textContent='Starting the drone camera…';setPower('STARTING CAMERA');
  stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(request===cameraRequest){closeCamera(false);cameraError('Camera disconnected. Choose Drone ON to reconnect.');}},{once:true}));
  await video.play();if(request!==cameraRequest)return;cameraFrameReady();
 }catch(error){
  if(request!==cameraRequest)return;
  closeCamera(false);
  const errors={NotAllowedError:'Camera permission was denied or blocked. Allow camera access in your browser’s site settings, then choose Drone ON again.',NotFoundError:'No camera was found. Connect a webcam or upload a photo.',NotReadableError:'Camera could not start. Close other apps using your camera, then try Drone ON again.',SecurityError:'Camera access is blocked by your browser or device settings.'};
  cameraError(errors[error.name]||'Could not start the camera. Check camera permissions or upload a photo.');
 }
}
function cameraFrameReady(){
 const video=$('camera-video');
 if(cameraStream&&video.readyState>=2&&video.videoWidth>0&&video.videoHeight>0&&!capturingPhoto){
  $('capture-photo').disabled=false;setPower('DRONE ON');
  $('camera-status').textContent='Drone camera ON · Capture image takes a still photo. Drone OFF stops the camera.';
 }
}
async function capturePhoto(){
 const video=$('camera-video');
 if(!cameraStream||capturingPhoto||video.readyState<2||!video.videoWidth)return;
 const request=cameraRequest;
 capturingPhoto=true;window.droneCaptureBusy=true;updateButton();$('capture-photo').disabled=true;$('capture-photo').textContent='Capturing…';cameraError();
 try{
  const canvas=document.createElement('canvas');const scale=Math.min(1,1920/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');context.drawImage(video,0,0,canvas.width,canvas.height);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Capture failed')),'image/jpeg',.95));
  if(request!==cameraRequest)return;
  // Keep the stream live; inference receives only this selected still image.
  await chooseFile(new File([blob],'drone-capture.jpg',{type:'image/jpeg'}),{keepCamera:true});
 }catch(error){if(request===cameraRequest)cameraError('Could not capture the image. Try again or upload a photo.');}
 finally{
  if(request===cameraRequest){capturingPhoto=false;window.droneCaptureBusy=false;$('capture-photo').textContent='Capture image';cameraFrameReady();updateButton();}
 }
}
$('open-camera').addEventListener('click',openCamera);
$('drone-off').addEventListener('click',()=>closeCamera());
$('close-camera').addEventListener('click',()=>closeCamera());
$('capture-photo').addEventListener('click',capturePhoto);
$('camera-video').addEventListener('loadeddata',cameraFrameReady);
$('camera-video').addEventListener('playing',cameraFrameReady);
window.addEventListener('pagehide',()=>closeCamera(false));
document.addEventListener('visibilitychange',()=>{if(document.hidden)closeCamera(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('camera-panel').hidden)closeCamera();});
