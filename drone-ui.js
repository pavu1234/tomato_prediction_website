'use strict';
// Presentation only: does not call, change or retrain the prediction engine.
(() => {
 const el = id => document.getElementById(id);
 const mission = () => el('mission-name').value.trim() || 'Leaf inspection';
 function updateNotes() {
  el('mission-display').textContent = mission();
  el('result-mission').textContent = mission();
  el('result-plot').textContent = el('plot-name').value.trim() || 'Not provided';
 }
 ['mission-name','plot-name'].forEach(id => el(id).addEventListener('input', updateNotes));
 function updateView() {
  const live = !el('camera-video').hidden && !el('camera-panel').hidden;
  const photo = !el('preview').hidden && !!el('preview').getAttribute('src');
  const busy = el('predict').textContent.includes('Analyzing');
  el('source-badge').textContent = live ? 'DRONE CAMERA · LIVE' : photo ? 'STILL IMAGE · DRONE OFF' : 'DRONE OFF';
  el('feed-state').textContent = busy ? 'ANALYZING IMAGE' : live ? 'CAMERA PREVIEW' : photo ? 'FRAME LOADED' : 'AWAITING INPUT';
  el('result-file').textContent = el('file-name').textContent;
  if (!el('result').hidden) {
   const label = el('prediction-name').textContent;
   const score = el('top-score').textContent;
   el('score-explanation').textContent = `The model assigned ${score} of its three-class score total to ${label}. This is its strongest match among Early blight, Healthy and Late blight; the three displayed scores total approximately 100% after rounding.`;
   const explanations = {
    'Early blight':'The image most closely matches the model’s early blight examples. The model has not measured lesions or confirmed their cause.',
    'Healthy':'The image most closely matches the model’s healthy examples. This does not rule out other diseases, pests or nutritional problems.',
    'Late blight':'The image most closely matches the model’s late blight examples. This remains a screening result and requires confirmation.'
   };
   el('class-explanation').textContent = explanations[label] || '';
  }
  updateNotes();
 }
 const observer = new MutationObserver(updateView);
 ['preview','camera-video','camera-panel','result'].forEach(id=>observer.observe(el(id),{attributes:true,attributeFilter:['hidden','src']}));
 ['predict','prediction-name','top-score','file-name'].forEach(id=>observer.observe(el(id),{childList:true,characterData:true,subtree:true}));
 el('clock').textContent = new Date().toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'});
 updateView();
})();
