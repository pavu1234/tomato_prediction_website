import pathlib,json,hashlib,re,collections
import numpy as np
from PIL import Image,ImageOps
import imagehash
ROOT=pathlib.Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'reports/download_manifest.json').read_text())
ref=ROOT.parent/'upload/tomato-late-blight-tomato-1556463954.jpg'
with Image.open(ref) as im: refhash=imagehash.phash(ImageOps.exif_transpose(im).convert('RGB'))
quarantine=[]
for r in rows:
 try:
  with Image.open(ROOT/r['path']) as im:
   im=ImageOps.exif_transpose(im).convert('RGB');im.load()
   if min(im.size)<32:raise ValueError('too small')
   r['phash']=str(imagehash.phash(im));r['_hash_int']=int(r['phash'],16)
   r['pixel_hash']=hashlib.sha256(np.asarray(im).tobytes()).hexdigest()
   if r['source']=='PlantDoc' and imagehash.hex_to_hash(r['phash'])-refhash<=10:raise ValueError('similar to user regression image')
  # Conservative filename conflict check, not automatic relabelling.
  name=r['source_path'].lower()
  if r['source']=='PlantDoc' and ((r['label']=='late_blight' and ('early' in name or 'drought' in name)) or (r['label']=='early_blight' and 'late-blight' in name)):
   raise ValueError('filename/label conflict: needs expert review')
 except Exception as e:r['excluded_reason']=str(e);quarantine.append(r)
rows=[r for r in rows if 'excluded_reason' not in r]
pd=[r for r in rows if r['source']=='PlantDoc'];parent=list(range(len(pd)))
def find(i):
 while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
 return i
def union(i,j):parent[find(i)]=find(j)
for i,a in enumerate(pd):
 for j,b in enumerate(pd[:i]):
  if a['pixel_hash']==b['pixel_hash'] or (a['_hash_int']^b['_hash_int']).bit_count()<=8:union(i,j)
groups=collections.defaultdict(list)
for i,r in enumerate(pd):groups[find(i)].append(r)
for group in groups.values():
 gid=min(r['id'] for r in group)
 if len({r['label'] for r in group})>1:
  for r in group:r['excluded_reason']='conflicting labels in duplicate group';quarantine.append(r)
  continue
 if any(r['split']=='test_locked' for r in group):split='test_locked'
 else:
  # Frozen deterministic approximately 20% field-validation group split.
  split='val' if int(hashlib.sha256(('42'+gid).encode()).hexdigest(),16)%5==0 else 'train'
 for r in group:r['group']='PlantDoc:'+gid;r['split']=split
# Remove field samples that are duplicates of any PlantVillage train/validation image.
pv=[r for r in rows if r['source']=='PlantVillage']
for r in pd:
 if 'excluded_reason' in r:continue
 for p in pv:
  if r['pixel_hash']==p['pixel_hash'] or (r['_hash_int']^p['_hash_int']).bit_count()<=6:
   r['excluded_reason']='near duplicate of PlantVillage';quarantine.append(r);break
rows=[r for r in rows if 'excluded_reason' not in r]
counts=collections.Counter((r['source'],r['split'],r['label']) for r in rows)
for k,v in sorted(counts.items()):print(k,v)
(ROOT/'reports/manifest.json').write_text(json.dumps(rows,indent=2))
(ROOT/'reports/quarantine.json').write_text(json.dumps(quarantine,indent=2))
print('Excluded',len(quarantine),'User photo excluded from all training/validation.')
