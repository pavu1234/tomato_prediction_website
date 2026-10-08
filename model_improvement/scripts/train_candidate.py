"""Fine-tune the existing model. Test and user images are never used for selection."""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'
os.environ['TF_NUM_INTRAOP_THREADS']='6'
os.environ['TF_NUM_INTEROP_THREADS']='2'
import json,pathlib,time,hashlib
import numpy as np
import tensorflow as tf
from PIL import Image,ImageOps
from sklearn.metrics import accuracy_score,f1_score,confusion_matrix,classification_report,log_loss
ROOT=pathlib.Path(__file__).resolve().parents[1]
CLASSES=['early_blight','healthy','late_blight']
tf.keras.utils.set_random_seed(42)
rows=json.loads((ROOT/'reports/manifest.json').read_text())
# No split overlap in cryptographic hashes or declared groups.
for key in ['sha256','pixel_hash','group']:
 seen={}
 for r in rows:
  value=r[key]
  if value in seen and seen[value]!=r['split']:raise ValueError('Split leakage: '+key+' '+value)
  seen[value]=r['split']
def load(rs):
 xs=[];ys=[]
 for r in rs:
  p=ROOT/r['path']
  if hashlib.sha256(p.read_bytes()).hexdigest()!=r['sha256']:raise ValueError('Changed image')
  with Image.open(p) as im:
   a=np.asarray(ImageOps.exif_transpose(im).convert('RGB'))
  xs.append(tf.image.resize(a,[224,224],method='bilinear').numpy());ys.append(CLASSES.index(r['label']))
 return np.stack(xs),np.array(ys)
def metrics(y,p):
 return dict(n=len(y),accuracy=float(accuracy_score(y,p.argmax(1))),macro_f1=float(f1_score(y,p.argmax(1),labels=[0,1,2],average='macro',zero_division=0)),loss=float(log_loss(y,p,labels=[0,1,2])),confusion_matrix=confusion_matrix(y,p.argmax(1),labels=[0,1,2]).tolist(),classes=classification_report(y,p.argmax(1),labels=[0,1,2],target_names=CLASSES,output_dict=True,zero_division=0))
def predict(m,x):return np.concatenate([m(x[i:i+16],training=False).numpy() for i in range(0,len(x),16)])
old=ROOT.parent/'restored/project/tomato_disease_classifier/models/best_model.keras'
m=tf.keras.models.load_model(old,compile=False)
val={source:load([r for r in rows if r['split']=='val' and r['source']==source]) for source in ['PlantVillage','PlantDoc']}
baseline={s:metrics(y,predict(m,x)) for s,(x,y) in val.items()}
(ROOT/'reports/baseline_validation.json').write_text(json.dumps(baseline,indent=2))
print('BASELINE',json.dumps(baseline),flush=True)
train=[r for r in rows if r['split']=='train']
# All retained training images are used each epoch; repeat scarce field data four times.
train=train+[r for r in train if r['source']=='PlantDoc']*3
x,y=load(train)
base=next(l for l in m.layers if isinstance(l,tf.keras.Model) and 'mobilenet' in l.name.lower())
base.trainable=True
for i,l in enumerate(base.layers):l.trainable=i>=len(base.layers)-40 and not isinstance(l,tf.keras.layers.BatchNormalization)
m.compile(optimizer=tf.keras.optimizers.Adam(1e-5),loss='sparse_categorical_crossentropy',metrics=['accuracy'])
ds=tf.data.Dataset.from_tensor_slices((x,y)).shuffle(len(y),seed=42).batch(16).prefetch(2)
opts=tf.data.Options();opts.threading.private_threadpool_size=4;ds=ds.with_options(opts)
(ROOT/'models').mkdir(exist_ok=True)
history=[];best=-1;stale=0;start=time.time()
# Frozen before evaluation: field macro F1 must improve and PV accuracy may drop <=1.5 points.
for epoch in range(1,16):
 h=m.fit(ds,epochs=1,verbose=0).history
 stats={s:metrics(vy,predict(m,vx)) for s,(vx,vy) in val.items()}
 eligible=stats['PlantVillage']['accuracy']>=baseline['PlantVillage']['accuracy']-.015 and stats['PlantDoc']['macro_f1']>baseline['PlantDoc']['macro_f1']+.03
 score=(stats['PlantVillage']['macro_f1']+stats['PlantDoc']['macro_f1'])/2
 record=dict(epoch=epoch,train={k:float(v[0]) for k,v in h.items()},validation=stats,eligible=eligible,seconds=time.time()-start)
 history.append(record)
 if eligible and score>best:
  best=score;stale=0;m.save(ROOT/'models/candidate.keras');(ROOT/'reports/selected.json').write_text(json.dumps(record,indent=2))
 else:stale+=1
 (ROOT/'reports/history.json').write_text(json.dumps(history,indent=2))
 print('EPOCH',epoch,'PV',stats['PlantVillage']['accuracy'],'FIELD',stats['PlantDoc']['accuracy'],'F1',stats['PlantDoc']['macro_f1'],'eligible',eligible,flush=True)
 if stale>=6 and epoch>=8:break
m.save(ROOT/'models/last_candidate.keras')
print('DONE; selected',best,flush=True)
