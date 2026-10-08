import json, pathlib, csv, urllib.request, urllib.parse, hashlib, concurrent.futures, time
ROOT=pathlib.Path(__file__).resolve().parents[1]
OLD=ROOT.parent/'restored/project/tomato_disease_classifier'
rows=[]
prov=json.loads((OLD/'data/metadata/plantvillage_provenance.json').read_text())
manifest={x['image_id']:x for x in csv.DictReader((OLD/'data/metadata/approved_manifest.csv').open())}
lock=json.loads((OLD/'data/metadata/test_lock_manifest.json').read_text())
for a in lock['all_assignments']:
 r=manifest[a['image_id']]; p=prov['images'][r['relative_path']]['source_path']
 rows.append(dict(id='pv_'+a['image_id'],source='PlantVillage',source_path=p,commit=prov['commit'],split=a['split'],label=a['class_label'],group=a['source_group'],sha256=a['sha256_hash'],url='https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/'+prov['commit']+'/'+urllib.parse.quote(p)))
tree=json.loads((ROOT/'reports/plantdoc_tree.json').read_text())
labels={'Tomato Early blight leaf':'early_blight','Tomato leaf':'healthy','Tomato leaf late blight':'late_blight'}
for x in tree['tree']:
 parts=x['path'].split('/')
 if x['type']!='blob' or len(parts)!=3 or parts[1] not in labels:continue
 p=x['path'];rows.append(dict(id='pd_'+hashlib.sha256(p.encode()).hexdigest()[:20],source='PlantDoc',source_path=p,commit=tree['sha'],split='test_locked' if parts[0]=='test' else 'unassigned',label=labels[parts[1]],group='',sha256='',url='https://raw.githubusercontent.com/pratikkayal/PlantDoc-Dataset/'+tree['sha']+'/'+urllib.parse.quote(p)))
(ROOT/'data').mkdir(exist_ok=True)
def fetch(r):
 dst=ROOT/'data'/(r['id']+pathlib.Path(r['source_path']).suffix)
 for n in range(3):
  try:
   if not dst.exists():
    data=urllib.request.urlopen(r['url'],timeout=40).read()
    tmp=dst.with_suffix(dst.suffix+'.part');tmp.write_bytes(data);tmp.replace(dst)
   h=hashlib.sha256(dst.read_bytes()).hexdigest()
   if r['sha256'] and h!=r['sha256']:raise ValueError('checksum mismatch')
   r['sha256']=h;r['path']=str(dst.relative_to(ROOT));return r
  except Exception:
   if n==2:raise
   time.sleep(1)
with concurrent.futures.ThreadPoolExecutor(48) as ex:
 out=[]
 for r in ex.map(fetch,rows):
  out.append(r)
  if len(out)%250==0:print('Downloaded',len(out),'/',len(rows),flush=True)
(ROOT/'reports/download_manifest.json').write_text(json.dumps(out,indent=2))
print('Done',len(out),flush=True)
