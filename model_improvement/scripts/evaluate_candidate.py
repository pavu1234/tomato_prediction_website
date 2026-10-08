"""Run once after validation selection is frozen. Does not retrain/select on test."""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'
os.environ['TF_NUM_INTRAOP_THREADS']='6'
os.environ['TF_NUM_INTEROP_THREADS']='2'
import pathlib,json,hashlib,tempfile
import numpy as np
import tensorflow as tf
from PIL import Image,ImageOps
from sklearn.metrics import accuracy_score,f1_score,classification_report,confusion_matrix
ROOT=pathlib.Path(__file__).resolve().parents[1];names=['early_blight','healthy','late_blight']
if (ROOT/'reports/final_evaluation.json').exists():raise RuntimeError('Final evaluation already exists; do not repeatedly tune against it.')
rows=json.loads((ROOT/'reports/manifest.json').read_text())
base=tf.keras.models.load_model(ROOT.parent/'restored/project/tomato_disease_classifier/models/best_model.keras',compile=False)
candidate=tf.keras.models.load_model(ROOT/'models/candidate.keras',compile=False)
def load(p):
 with Image.open(p) as im:a=np.asarray(ImageOps.exif_transpose(im).convert('RGB'))
 return tf.image.resize(a,[224,224]).numpy()
def pred(m,x):return np.concatenate([m(x[i:i+16],training=False).numpy() for i in range(0,len(x),16)])
def met(y,p):return dict(n=len(y),accuracy=float(accuracy_score(y,p.argmax(1))),macro_f1=float(f1_score(y,p.argmax(1),average='macro',labels=[0,1,2],zero_division=0)),confusion_matrix=confusion_matrix(y,p.argmax(1),labels=[0,1,2]).tolist(),classes=classification_report(y,p.argmax(1),labels=[0,1,2],target_names=names,output_dict=True,zero_division=0))
report={'class_order':names,'test_results':{},'user_image_is_known_regression_not_independent_accuracy':True}
for source in ['PlantVillage','PlantDoc']:
 rs=[r for r in rows if r['source']==source and r['split']=='test_locked'];x=np.stack([load(ROOT/r['path']) for r in rs]);y=np.array([names.index(r['label']) for r in rs])
 report['test_results'][source]={k:met(y,pred(m,x)) for k,m in [('baseline',base),('candidate',candidate)]}
user=load(ROOT.parent/'upload/tomato-late-blight-tomato-1556463954.jpg')[None]
report['regression']={k:pred(m,user)[0].tolist() for k,m in [('baseline',base),('candidate',candidate)]}
# Do not deploy a field-test regression even if validation improved.
pv=report['test_results']['PlantVillage'];pd=report['test_results']['PlantDoc']
report['passes_release_gate']=pd['candidate']['macro_f1']>pd['baseline']['macro_f1'] and pv['candidate']['accuracy']>=pv['baseline']['accuracy']-.015
(ROOT/'reports/final_evaluation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
# Export only inference graph, float32, unchanged input/output contract.
inp=tf.keras.Input(shape=(224,224,3),name='rgb_0_255');x=inp
for layer in candidate.layers[1:]:
 if layer.name=='training_augmentation' or isinstance(layer,tf.keras.layers.Dropout):continue
 x=layer(x,training=False) if isinstance(layer,tf.keras.Model) else layer(x)
serving=tf.keras.Model(inp,x)
with tempfile.TemporaryDirectory() as tmp:
 serving.export(tmp);converter=tf.lite.TFLiteConverter.from_saved_model(tmp);blob=converter.convert()
(ROOT/'models/candidate.tflite').write_bytes(blob)
interpreter=tf.lite.Interpreter(model_content=blob,num_threads=4);interpreter.allocate_tensors();ii=interpreter.get_input_details()[0]['index'];oi=interpreter.get_output_details()[0]['index']
checks=[r for r in rows if r['split']=='val'];samples=[load(ROOT/r['path']) for r in checks];expected=pred(candidate,np.stack(samples));actual=[]
for sample in samples:
 interpreter.set_tensor(ii,sample[None]);interpreter.invoke();actual.append(interpreter.get_tensor(oi)[0])
actual=np.array(actual);agreement=float(np.mean(actual.argmax(1)==expected.argmax(1)));delta=float(np.max(abs(actual-expected)))
export={'size_bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'validation_samples':len(samples),'top1_agreement':agreement,'max_probability_delta':delta,'compatible':agreement==1 and delta<1e-4}
(ROOT/'reports/export_verification.json').write_text(json.dumps(export,indent=2));print('EXPORT',json.dumps(export),flush=True)
