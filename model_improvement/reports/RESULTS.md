# Measured model-improvement results

Selected checkpoint: epoch 12. Training used validation-only selection; all test results below were obtained afterwards.

| Evaluation set | Images | Original accuracy | Candidate accuracy |
|---|---:|---:|---:|
| PlantVillage test | 424 | 95.28% | 94.81% |
| PlantDoc test | 28 | 53.57% | 78.57% |

These are dataset-specific measurements, not guaranteed field/drone accuracy. The PlantDoc test is small and its source labels have not been independently verified by an agronomist. The earlier locked test is now evaluated and must not be reused as an unseen holdout for future tuning.

Known Plantix regression: browser predicts **late_blight** with scores early_blight: 23.21%, healthy: 0.00%, late_blight: 76.79%. The image was excluded from training and selection; one known regression case is not an independent accuracy estimate.

TFLite export: 4,030,700 bytes; top-class agreement 100.0% across 477 validation images. Maximum probability difference 0.00000489.

Browser engine executed real inference on 10 smoke images. This tests runtime compatibility, not population accuracy.

Release checks: test comparison=True; conversion=True; reported Late-blight regression=True.
Recommended for experimental website update: True. No production reliability or 100% accuracy is claimed.

## Dataset coverage
Downloaded 3,164 images: the previously audited 2,902-image PlantVillage subset and all 262 matching PlantDoc source images. Seven PlantDoc images were quarantined. The model trained on 2,038 original images plus 190 PlantDoc images. Field training examples were repeated four times per epoch. Validation: 440 original + 37 field images. Test: 424 original + 28 field images. All retained training images were used each epoch; holdouts were never added to training.

This is not a claim to use every online dataset or the entire 54,000-image multicrop PlantVillage repository. The original three-class audit covered 4,500 images, with unresolved identities/conflicts excluded. Mirrors and augmented copies were not counted as additional independent data.

## Remaining limitations
Only Early blight, Healthy and Late blight are disease outputs. Other diseases, non-tomato leaves, difficult lighting, blur and camera viewpoints can still be misclassified. The separate leaf screen reduces non-leaf inputs but does not certify species or all invalid inputs. Confidence scores are uncalibrated, not diagnostic certainty or lesion severity. More independently verified field images and a fresh external holdout are needed before claiming strong real-world reliability.

## Deployment status
No GitHub commit or live deployment has been made in this run. The prior connected GitHub integration rejected writes with HTTP 403. Any supplied website update must be uploaded by the repository owner.
