import pathlib,json,shutil,re,zipfile
R=pathlib.Path(__file__).resolve().parents[1];status=json.loads((R/'reports/run_status.json').read_text())
if not status['recommended_experimental_update']:raise RuntimeError('Release checks failed; no website update built')
export=json.loads((R/'reports/export_verification.json').read_text());tests=json.loads((R/'reports/final_evaluation.json').read_text())['test_results']
pv=tests['PlantVillage']['candidate'];pd=tests['PlantDoc']['candidate'];name='tomato-field-'+export['sha256'][:8]+'.tflite'
out=R/'website_update';out.mkdir(exist_ok=True)
app=(R/'website_source/app.js').read_text();assert app.count("getBytes('./tomato.tflite')")==1
app=app.replace("getBytes('./tomato.tflite')",f"getBytes('./{name}')")
app=app.replace("$('result-description').textContent = NOTES[top];","$('result-description').textContent = NOTES[top] + ' This is a tentative prediction; the score is not diagnostic accuracy.';")
(out/'app.js').write_text(app)
html=(R/'website_source/index.html').read_text()
assert 'Original float32 weights' in html and '95.68%' in html
html=html.replace('Original float32 weights','Field fine-tuned · experimental').replace('VALIDATION ACCURACY','INTERNAL TEST ACCURACY')
html=html.replace('95.68% <small>/ 440 images</small>',f"{pv['accuracy']*100:.2f}% <small>/ {pv['n']} images</small>")
html=html.replace('<span>Controlled PlantVillage images</span>',f"<span>PlantVillage · Field test: {pd['accuracy']*100:.2f}% / {pd['n']} images</span>")
html=html.replace('Validation accuracy is 95.68% on 440 curated images, with macro F1 of 0.9566. The 424-image locked test set has not been evaluated. Validation accuracy does not describe the certainty of an individual prediction.',f"The field-fine-tuned model achieved {pv['accuracy']*100:.2f}% accuracy on {pv['n']} reserved PlantVillage images and {pd['accuracy']*100:.2f}% on {pd['n']} reserved PlantDoc images. The field test is small, so its result is preliminary. These test images were not used for training or checkpoint selection. Dataset accuracy does not describe the certainty of an individual prediction.")
html=html.replace('Changing the frontend does not improve the model’s accuracy. Field and aerial drone performance have not been established. Speed depends on your device.','The model was fine-tuned using additional labelled field images. These dataset results do not establish accuracy on your farm or drone. Scores are uncalibrated and high scores can still be wrong. Only three tomato classes are supported. Speed depends on your device.')
# Force the updated app script to load after upload while keeping its public filename.
html=re.sub(r'src="(?:\./)?app\.js(?:\?[^\"]*)?"',f'src="app.js?v={export["sha256"][:8]}"',html)
(out/'index.html').write_text(html);shutil.copy2(R/'models/candidate.tflite',out/name)
(out/'INSTALL.md').write_text(f'''# Install the tested experimental update\n\nThe live website has NOT been updated automatically.\n\n1. Open https://github.com/pavu1234/tomato_prediction_website .\n2. Choose **Add file → Upload files**.\n3. Upload exactly these three files into the repository root: `index.html`, `app.js`, `{name}`. Upload the files themselves, not the containing folder. Replace the existing index/app files.\n4. Commit the changes. Wait for the GitHub Pages deployment to finish.\n5. Open https://pavu1234.github.io/tomato_prediction_website/ and refresh. The model strip should say **Field fine-tuned · experimental**.\n6. Test the same Plantix photo: this tested model returns Late blight, approximately 76.8% score. Scores are not diagnostic accuracy.\n\nKeep the existing camera, leaf-guard, engine, vendor and CSS files. The original `tomato.tflite` is retained as a rollback asset; the new app requests the uniquely named model. Camera controls, compatible drone connections and leaf screening are unchanged.\n\nMeasured reserved test accuracy: original-data {pv['accuracy']*100:.2f}% ({pv['n']} images), field-data {pd['accuracy']*100:.2f}% ({pd['n']} images). The field test is small. Errors remain; this does not guarantee correct diagnoses.\n\nRollback: revert the commit containing these three file changes.\n\nNew model SHA-256: `{export['sha256']}`.\n''')
with zipfile.ZipFile(R.parent/'tomato_website_model_update.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in out.iterdir():z.write(p,p.name)
 z.write(R/'reports/RESULTS.md','RESULTS.md')
print('Built',out)
