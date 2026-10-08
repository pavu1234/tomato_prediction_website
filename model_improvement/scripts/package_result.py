"""Package source, provenance, measured results and models; excludes bulk images/venv."""
import pathlib,zipfile,json
ROOT=pathlib.Path(__file__).resolve().parents[1];work=ROOT.parent
out=work/'tomato_model_improvement.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for p in ROOT.rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(ROOT)
  if any(part in ['venv','data','__pycache__'] for part in rel.parts):continue
  if rel.name in ['install.log','plantdoc_tree.json']:continue
  z.write(p,'model_improvement/'+str(rel))
 # Required pinned source metadata and baseline trainable checkpoint.
 old=work/'restored/project/tomato_disease_classifier'
 for rel in ['models/best_model.keras','models/class_names.json','data/metadata/approved_manifest.csv','data/metadata/plantvillage_provenance.json','data/metadata/test_lock_manifest.json','reports/PLANTVILLAGE_STATUS.md']:
  z.write(old/rel,'restored/project/tomato_disease_classifier/'+rel)
 # Tree contains filenames and hashes; not the image bytes.
 z.write(ROOT/'reports/plantdoc_tree.json','model_improvement/reports/plantdoc_tree.json')
 user=work/'upload/tomato-late-blight-tomato-1556463954.jpg'
 z.write(user,'upload/'+user.name)
print(out,out.stat().st_size)
