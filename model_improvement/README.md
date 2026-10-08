# Tomato classifier improvement experiment

This project fine-tunes the existing MobileNetV3Small classifier on audited PlantVillage images plus PlantDoc field-like photographs. It preserves the class contract `early_blight, healthy, late_blight`, RGB float32 pixels 0–255, 224×224 bilinear resizing, and embedded normalization. It does not add flight control or change camera support.

## Scope and data quality

“All online datasets” is not a reproducible dataset specification. Mirrors, augmented copies, conflicting labels and unsupported disease classes must not be combined indiscriminately. We use original sources and document exclusions instead.

- PlantVillage: pinned commit `7f7ecc7e1eaca78107e3affe7cb5abd9427e139a`, https://github.com/spMohanty/PlantVillage-Dataset . The previous complete audit covered 4,500 images in the three supported classes. It excluded unresolved leaf identities and conflicting near-duplicate groups, retaining 2,902 images. This run retains those established splits, including 424 locked test images. It does NOT claim training on all 4,500 images.
- PlantDoc: pinned commit `5467f6012d78d1c446145d5f582da6096f852ae8`, https://github.com/pratikkayal/PlantDoc-Dataset . All 262 images in the three matching classes are downloaded for audit, not all are training images. CC BY 4.0; Singh et al., PlantDoc: A Dataset for Visual Plant Disease Detection, CoDS-COMAD 2020, https://doi.org/10.1145/3371158.3371196 . Dataset labels are used, not independently diagnosed by an agronomist. Exact/pixel and pHash checks reduce duplicate leakage, but cannot prove farm or photographer independence.
- PlantVillage mirrors and `lorenzoxi/tomato-leaves-dataset`: not added as independent data; the latter describes a merge of PlantVillage and PlantDoc and includes augmented images.
- Tomato-Village: reviewed as a possible extension, https://github.com/mamta-joshi-gehlot/Tomato-Village . No verified new matching data imported in this run; do not claim it was trained on.
- Plantix user image: known late-blight regression case, never used in training or checkpoint selection. Source https://plantix.net/en/library/plant-diseases/100046/tomato-late-blight/ . A pass on this one known case is not a field-accuracy measurement.

## Reproduction

Use Python 3.12 and `requirements.txt`. Preparation expects the original delivered project at `../restored/project/tomato_disease_classifier` and the user image at the original sibling `upload` path. The delivered archive includes a compatible layout and a copy of the required original metadata/model. Downloaded dataset bytes are not bundled.

1. `python -m venv venv`, activate it, then `pip install -r requirements.txt`.
2. `python scripts/prepare.py` (resumable pinned downloads, verifies PlantVillage SHA-256).
3. `python scripts/audit_split.py` (quarantines invalid/conflicting samples, keeps related PlantDoc images together, excludes user-photo similarities and cross-dataset duplicates).
4. `python scripts/train_candidate.py` (15 epochs maximum, early stopping; all retained training images per epoch, field images repeated four times; validation-only checkpoint selection).
5. If a candidate exists, `python scripts/evaluate_candidate.py` once. This evaluates frozen test sets and exports float32 TFLite, checking all retained validation images for conversion equivalence.

The final-evaluation script refuses to overwrite prior test results. Do not retrain repeatedly against those results; collect a new independent holdout for further iteration.

## Release policy

Validation selection requires field macro F1 to improve by more than 0.03 and internal validation accuracy to drop by no more than 0.015. The candidate with the highest equally weighted mean macro F1 across the two validation domains is retained. Test release checks require improved field macro F1 and no internal test accuracy drop exceeding 0.015. Small field test counts mean results are preliminary, not a guarantee of field performance. No claim of 100% accuracy is made. The original locked test set ceases to be unseen once final evaluation runs.

`models/candidate.tflite` is experimental unless the final report and browser compatibility checks pass. Do not replace the live website model solely because this file exists. Model scores are uncalibrated and are not disease severity, infected leaf area, or guaranteed correctness. A confidence cutoff cannot catch all confidently wrong predictions. The current three-class model cannot diagnose every other tomato disease or certify tomato species; the existing separate leaf guard is also imperfect.

Browser smoke test (after export): `npm install`, `npx playwright install chromium`, then `npm run test:browser`. Uses the existing website inference runtime and actual model, not a mocked predictor. Dataset downloads must still be present. Smoke samples are not an independent accuracy benchmark.
