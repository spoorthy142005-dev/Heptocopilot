# nnU-Net 3D CT segmentation

This workflow uses nnU-Net v2 to segment liver and tissue classes from 3D CT volumes in NIfTI (`.nii.gz`) format. Training masks must use integer voxel labels matching the dataset label map.

## Install

Install PyTorch for the target CUDA version first, then install the workflow dependencies:

```powershell
python -m pip install torch --index-url https://download.pytorch.org/whl/cu124
python -m pip install -r models/requirements.txt
```

Set the nnU-Net storage locations before running a large dataset:

```powershell
$env:nnUNet_raw = "$PWD/nnUNet_raw"
$env:nnUNet_preprocessed = "$PWD/nnUNet_preprocessed"
$env:nnUNet_results = "$PWD/nnUNet_results"
```

## Prepare, train, and predict

`images/` contains CT volumes and `labels/` contains masks with matching filenames. The default labels are background `0`, liver `1`, and tissue `2`; change `--labels-map` when the masks use a different convention.

```powershell
python models/nnunet_pipeline.py prepare --images dataset/images --labels dataset/labels
python models/nnunet_pipeline.py train --dataset-id 501 --fold 0
python models/nnunet_pipeline.py predict --input nnUNet_raw/Dataset501_LiverTissueCT/imagesTs --output predictions --dataset-id 501 --fold 0
```

For inference-only volumes, prepare them with `--test-images` and omit `--labels`:

```powershell
python models/nnunet_pipeline.py prepare --images dataset/inference --test-images
```

nnU-Net requires spatially aligned images and masks. Validate orientation, spacing, and label values before training. The generated segmentations are decision-support output and require clinical review.

## ConvNeXt-Small pathology classification

The lesion classifier uses ImageNet-pretrained ConvNeXt-Small with a three-class output head. Export lesion/tissue patches from the CT workflow into this layout:

```text
classification-data/
	train/{HCC,Benign Hemangioma,Metastasis}/
	val/{HCC,Benign Hemangioma,Metastasis}/
```

Train and classify a patch:

```powershell
python models/convnext_classifier.py train --data classification-data --epochs 20
python models/convnext_classifier.py predict --image patient-001-lesion.png --checkpoint models/checkpoints/convnext_small_pathology.pt
```

The prediction command prints probabilities for HCC, Benign Hemangioma, and Metastasis and includes a Grad-CAM attention overlay as a PNG data URL. Use patient-level splits to prevent slices from the same study appearing in both training and validation sets. These predictions and attention maps are decision-support output and require radiology/pathology review.