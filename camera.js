'use strict';
let cameraStream = null;
let cameraRequest = 0;
let capturingPhoto = false;
function cameraError(text = '') {
 $('camera-error').textContent = text;
 $('camera-error').hidden = !text;
}
function stopTracks(stream) { if (stream) stream.getTracks().forEach(track => track.stop()); }
function closeCamera(returnFocus = true) {
 ++cameraRequest;
 stopTracks(cameraStream); cameraStream = null; capturingPhoto = false;
 const video = $('camera-video'); video.pause(); video.srcObject = null; video.hidden = true;
 $('camera-panel').hidden = true; $('capture-photo').disabled = true;
 $('capture-photo').textContent = 'Capture photo'; $('open-camera').disabled = false;
 $('open-camera').setAttribute('aria-expanded', 'false');
 $('preview').hidden = !selectedImage; $('upload-prompt').hidden = !!selectedImage;
 updateButton();
 if (returnFocus) $('open-camera').focus();
}
async function openCamera() {
 if (!$('camera-panel').hidden) return;
 cameraError();
 if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
  cameraError('Camera access is unavailable here. Open the HTTPS website in Chrome, Edge, Firefox or Safari, or use Choose photo.'); return;
 }
 const request = ++cameraRequest;
 $('camera-panel').hidden = false; $('open-camera').disabled = true;
 $('open-camera').setAttribute('aria-expanded','true'); $('capture-photo').disabled = true;
 $('camera-status').textContent = 'Choose Allow in your browser’s camera permission prompt. You can close this panel to cancel.';
 updateButton(); $('close-camera').focus();
 try {
  // Only a deliberate Open camera click calls this API. Never request audio.
  const stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}}});
  if (request !== cameraRequest) { stopTracks(stream); return; }
  cameraStream = stream;
  const video = $('camera-video');video.srcObject = stream;video.hidden = false;
  $('preview').hidden = true;$('upload-prompt').hidden = true;
  $('camera-status').textContent = 'Starting live preview…';
  stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
   if (request === cameraRequest) { closeCamera(false); cameraError('The camera stopped. Choose Open camera to try again.'); }
  }, {once:true}));
  await video.play();
  if (request !== cameraRequest) return;
  cameraFrameReady();
 } catch(error) {
  if (request !== cameraRequest) return;
  closeCamera(false);
  const errors = {
   NotAllowedError:'Camera permission was denied or blocked. Use the camera/site-permissions icon beside the address bar to allow camera access, then choose Open camera again. You can also use Choose photo.',
   SecurityError:'Camera access is blocked by your browser or device settings. Allow it in site permissions, or use Choose photo.',
   NotFoundError:'No camera was found. Connect a camera, or use Choose photo.',
   NotReadableError:'The camera could not start. Close other apps using it and try again, or use Choose photo.',
   AbortError:'Camera startup was interrupted. Choose Open camera to try again.'
  };
  cameraError(errors[error.name] || 'Could not start the camera. Check your browser permissions and camera connection, or use Choose photo.');
 }
}
function cameraFrameReady() {
 const video = $('camera-video');
 if (cameraStream && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && !capturingPhoto) {
  $('capture-photo').disabled = false;
  $('camera-status').textContent = 'Live camera · frame one tomato leaf in good light, then capture.';
 }
}
async function capturePhoto() {
 const video = $('camera-video');
 if (!cameraStream || capturingPhoto || video.readyState < 2 || !video.videoWidth) return;
 const request = cameraRequest;
 capturingPhoto = true; $('capture-photo').disabled = true; $('capture-photo').textContent = 'Capturing…'; cameraError();
 try {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.max(1,Math.round(video.videoWidth*scale)); canvas.height = Math.max(1,Math.round(video.videoHeight*scale));
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
  context.drawImage(video,0,0,canvas.width,canvas.height);
  const blob = await new Promise((resolve,reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Photo capture failed')), 'image/jpeg', .95));
  if (request !== cameraRequest) return;
  closeCamera(false);
  await chooseFile(new File([blob], 'camera-leaf.jpg', {type:'image/jpeg'}));
  if (selectedImage) { $('open-camera').textContent = 'Retake photo'; if (!$('predict').disabled) $('predict').focus(); }
 } catch(error) {
  if (request !== cameraRequest) return;
  cameraError('Could not capture the photo. Try again, or use Choose photo.');
 } finally {
  // A stale capture must not modify a newly opened camera session.
  if (request === cameraRequest) { capturingPhoto = false; $('capture-photo').textContent = 'Capture photo'; cameraFrameReady(); }
 }
}
$('open-camera').addEventListener('click', openCamera);
$('close-camera').addEventListener('click', () => closeCamera());
$('capture-photo').addEventListener('click', capturePhoto);
$('camera-video').addEventListener('loadeddata', cameraFrameReady);
$('camera-video').addEventListener('playing', cameraFrameReady);
window.addEventListener('pagehide', () => closeCamera(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) closeCamera(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('camera-panel').hidden) closeCamera(); });
