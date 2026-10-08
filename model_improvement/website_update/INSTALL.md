# Install the tested experimental update

The live website has NOT been updated automatically.

1. Open https://github.com/pavu1234/tomato_prediction_website .
2. Choose **Add file → Upload files**.
3. Upload exactly these three files into the repository root: `index.html`, `app.js`, `tomato-field-7c921aef.tflite`. Upload the files themselves, not the containing folder. Replace the existing index/app files.
4. Commit the changes. Wait for the GitHub Pages deployment to finish.
5. Open https://pavu1234.github.io/tomato_prediction_website/ and refresh. The model strip should say **Field fine-tuned · experimental**.
6. Test the same Plantix photo: this tested model returns Late blight, approximately 76.8% score. Scores are not diagnostic accuracy.

Keep the existing camera, leaf-guard, engine, vendor and CSS files. The original `tomato.tflite` is retained as a rollback asset; the new app requests the uniquely named model. Camera controls, compatible drone connections and leaf screening are unchanged.

Measured reserved test accuracy: original-data 94.81% (424 images), field-data 78.57% (28 images). The field test is small. Errors remain; this does not guarantee correct diagnoses.

Rollback: revert the commit containing these three file changes.

New model SHA-256: `7c921aefe7035e4b7c6ae96d1e5daf065638b6be675dc95afcb998dfedd28004`.
