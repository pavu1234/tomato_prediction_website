# Tomato Leaf Check

A real image-prediction website using the previously trained MobileNetV3Small tomato classifier. No Python server, API key, paid inference service, or build step is required. Predictions run in the visitor's browser.

## Put it on GitHub Pages

The downloadable `tomato_prediction_website.zip` contains the website files at its top level, including **index.html**.

1. Extract the ZIP on your computer. Do not upload the ZIP itself.
2. Create a new public GitHub repository, for example `tomato-leaf-check`.
3. Choose **Add file → Upload files** (or the upload-files link in an empty repository).
4. Open the extracted folder and drag its contents into GitHub. Include `index.html`, `style.css`, `app.js`, `engine.js`, and both the `model` and `vendor` folders. Preserve those folders and their contents. Commit changes.
5. Check that **index.html is directly in the repository's main page**, not inside another enclosing folder.
6. Open **Settings → Pages**. Under Build and deployment, choose **Deploy from a branch**.
7. Choose **main** and **/(root)**, then **Save**.
8. Wait for GitHub's deployment to finish. The Pages settings page will show the website address and a Visit site link.
9. Open the website, wait for **Model ready**, choose a tomato leaf image, and press **Analyze leaf**.

You can upload a folder by dragging it from your computer's file manager. If you upload only index.html, styling and predictions will not work.

Official guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

The hosted Sites source repository uses `dist/` for these same public files. If copying from that source repository instead of the downloadable ZIP, upload the **contents of dist/** to your GitHub repository root.

## Local use

Serve the extracted folder using a local HTTP server, e.g. `python -m http.server 8000`, then visit http://localhost:8000. Double-clicking index.html uses a file URL and may prevent the browser from loading the model. Use the hosted link for normal use.

## Model and preprocessing

- Original float32 TFLite model, SHA-256: e6870940d15516820e946a80f39a44153fd3e617f371011186298a0bf2eb6c73.
- Class order: early_blight, healthy, late_blight.
- Browser decodes the selected image, then TensorFlow.js resizes its RGB pixels to 224×224 with bilinear interpolation and half-pixel centers.
- Input float32 values remain 0–255. Normalization is inside the model; do not divide by 255.
- Original model validation: 95.68% accuracy, macro F1 0.9566, on 440 curated validation images.
- Float32 export previously matched Keras top-1 results on all 440 validation images.
- This website's WebAssembly engine was executed in Node on nine validation photos (three per class). All top-1 results matched the native TFLite interpreter; maximum probability difference was 9.84e-7. The same engine.js is used by the website.
- Automated browser UI testing and WebMCP testing were unavailable in the build environment. Browser image-decoding differences and device performance were not measured.
- The locked 424-image test set was not evaluated.

## Scope and limitations

Only early blight, healthy, and late blight are recognized. The classifier always selects among these classes; it cannot reliably reject non-tomato images or recognize unsupported diseases. Scores are neither severity estimates nor calibrated diagnostic certainty. Validation performance on controlled PlantVillage images does not establish field or drone performance. Confirm real crop concerns with a plant specialist.

## Privacy and dependencies

Selected photos are decoded and processed locally. The app does not send them to a server or save them. Runtime scripts, WebAssembly and model weights are self-hosted in the package; no CDN is required at prediction time. Your hosting provider may keep normal page and asset request logs.

The TensorFlow runtime assets are distributed under Apache 2.0; see vendor/NOTICE.txt and vendor/LICENSE.txt. Dataset provenance: https://github.com/spMohanty/PlantVillage-Dataset, pinned source commit 7f7ecc7e1eaca78107e3affe7cb5abd9427e139a. The website package does not redistribute dataset images.
