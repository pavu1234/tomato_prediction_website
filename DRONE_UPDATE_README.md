# Leaf Flight — virtual drone frontend update

## Install on your existing GitHub Pages website

1. Extract `virtual_drone_frontend_update.zip`.
2. Open https://github.com/pavu1234/tomato_prediction_website.
3. Select Add file → Upload files.
4. Upload these four files directly to the repository root: `index.html`, `drone.css`, `drone-ui.js`, `drone.png`. Replace the existing index.html. Do not upload an enclosing folder or the ZIP itself.
5. Commit, wait for the Pages deployment to complete, then refresh the website with Ctrl + Shift + R.
6. Upload a leaf photo or choose Open camera → Allow → Capture photo, then Analyze leaf.

Keep your existing app.js, camera.js, engine.js, tf.min.js, tflite_web_api_cc.js, tflite_web_api_cc.wasm and tomato.tflite files. None needs replacing. This update targets the existing root-level file layout of your GitHub repository.

## What changed

- Dark virtual drone cockpit with a realistic generated quadcopter visual and subtle decorative motion; motion is disabled for reduced-motion preferences.
- Leaf inspection viewport with a framing guide, actual image/camera state, photo upload and the existing permission-based live camera capture.
- Optional mission name, plot/plant reference and observation notes. Notes remain in the current tab, are not saved after closing/reloading, and never enter the model.
- The original three scores, plus explanations derived from the displayed class and score. These are deterministic frontend explanations, not another AI model or a diagnosis.
- Responsive layouts for desktop and phones.

## What is unchanged

The deployed app.js, camera.js and engine.js were downloaded as the baseline. Copies used for compatibility checking remained byte-for-byte identical. Model weights, class order, image decoding/resizing, normalization, prediction function and camera implementation were not modified. This ZIP contains no replacement model or runtime.

SHA-256 of baseline files:
- app.js: 4cb394fe19797d6455e5a9ad76a73f8a71103d80ea44b49bbe70e54405a34dcb
- camera.js: 9254da7883c823d21f1ec8d469141842f7a52f13a7f6b4b6ef3f41933aee5f75
- engine.js: f89789a765cf4d268d9a36d1199a95734e37a2ddfbbc69a49b7042b31a80e5bf

## Accurate interpretation

This is a virtual drone interface, not physical drone control. It does not collect GPS, altitude, battery or flight telemetry. The artwork is illustrative. The live camera is the visitor's device camera, not a drone video link. The visual framing guide does not crop the image, locate disease, or estimate infected area.

The actual model classifies a whole image as early blight, healthy or late blight. A 98% score is not 98% infected leaf area or an independently calibrated 98% chance of being correct. Other diseases and non-tomato photos can receive high scores. Use close-up, clear leaf photos; accuracy on wide aerial images and real field conditions has not been established.

Reported original validation accuracy: 95.68% on 440 curated PlantVillage images, macro F1 0.9566. The locked test set remains unevaluated. This frontend does not increase model accuracy or guarantee error-free predictions. It performs no continuous video inference; capture a photo before analyzing.

No heavy 3D renderer or new ML runtime was added. The decorative drone image loads at low priority and the existing model remains loaded for repeated scans. Device-specific latency was not benchmarked and is not guaranteed.

## Verification

JavaScript syntax and all DOM IDs used by the original app/camera and new presentation script checked. Mocked frontend state tests passed for empty view, image-loaded view, live camera label, mission input text safety, and class-specific explanations. Core-file checksums matched. Real-browser visual QA and real-device camera testing were not performed for this frontend update.

## Drone artwork

Asset: drone.png, generated using the built-in image-generation tool and copied into this update. It is decorative and is never fed to the classifier automatically.

Prompt: "Use case: product-mockup. Asset type: realistic drone visual for a dark virtual agricultural drone control dashboard. Create a photorealistic studio product photograph of one unbranded professional compact quadcopter inspection drone, graphite and black carbon-fiber materials, four arms and four propellers, small forward-facing gimbal camera, accurate mechanically plausible construction. Three-quarter front overhead perspective, whole drone visible, centered, wide horizontal composition with generous margins. Solid very dark navy-charcoal studio background #0b121a, subtle cool rim light and realistic material reflections, crisp detailed drone silhouette. No text, no logos, no UI, no maps, no additional drones, no people. This is a decorative virtual drone visualization, not a leaf diagnosis image."
