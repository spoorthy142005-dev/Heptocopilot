"""
Module 1: 3D Ingestion & Preprocessing Engine for HepatoCopilot.

Processes volumetric CT scans (NIfTI / DICOM) using TorchIO:
- Intensity Windowing: Liver/HCC window [-100, +250] HU
- Isotropic Resampling: Uniform 1.0mm x 1.0mm x 1.0mm voxel grid
- Intensity Normalization: Z-Score standardization ignoring background (< -100 HU)
- Formats output to 5D PyTorch tensor [1, 1, Depth, Height, Width]
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional, Union

import torch
import torchio as tio


def preprocess_3d_ct(
    input_nifti_path: Union[str, Path],
    output_nifti_path: Optional[Union[str, Path]] = None,
) -> torch.Tensor:
    """
    Load and preprocess a 3D CT volume for deep learning models.

    Args:
        input_nifti_path: Path to raw input CT file (.nii, .nii.gz) or DICOM directory.
        output_nifti_path: Optional destination path to save preprocessed NIfTI volume.

    Returns:
        torch.Tensor: 5D PyTorch tensor with shape [1, 1, Depth, Height, Width] (float32).
    """
    input_path = Path(input_nifti_path)
    if not input_path.exists():
        raise FileNotFoundError(f"Input CT volume not found: {input_path}")

    # 1. Load raw 3D CT volume (NIfTI or DICOM series)
    image = tio.ScalarImage(input_path)

    # 2. Build preprocessing pipeline
    # - Step A: Intensity Windowing: Clip HU to [-100, +250] HU (Liver/HCC window)
    # - Step B: Isotropic Resampling: Resample voxel grid to uniform 1.0mm x 1.0mm x 1.0mm
    # - Step C: Intensity Normalization: Z-Score normalization ignoring background (< -100 HU)
    transform = tio.Compose([
        tio.Clamp(out_min=-100.0, out_max=250.0),
        tio.Resample(target=(1.0, 1.0, 1.0)),
        tio.ZNormalization(masking_method=lambda x: x > -100.0),
    ])

    transformed_image = transform(image)

    # 3. Optional persistence of preprocessed NIfTI volume with updated 1mm affine
    if output_nifti_path is not None:
        out_path = Path(output_nifti_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        transformed_image.save(out_path)

    # 4. Format to 5D PyTorch Tensor [1, 1, Depth, Height, Width]
    # TorchIO scalar image tensor has shape [Channels, Width, Height, Depth] -> [1, W, H, D]
    # Permute spatial dimensions (W, H, D) -> (D, H, W)
    # Unsqueeze to add batch dimension -> [1, 1, Depth, Height, Width]
    raw_data = transformed_image.data.float()  # shape: [1, W, H, D]
    tensor_5d = raw_data.permute(0, 3, 2, 1).unsqueeze(0)  # shape: [1, 1, D, H, W]

    return tensor_5d


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Preprocess 3D CT volume for HepatoCopilot")
    parser.add_argument("--input", required=True, help="Input NIfTI volume path or DICOM folder")
    parser.add_argument("--output", default=None, help="Optional output NIfTI file path")
    args = parser.parse_args()

    processed_tensor = preprocess_3d_ct(args.input, args.output)
    print(f"Preprocessed 5D Tensor Shape: {list(processed_tensor.shape)}")
    print(f"Tensor Dtype: {processed_tensor.dtype}")
    print(f"Intensity Range: min={processed_tensor.min():.4f}, max={processed_tensor.max():.4f}")
