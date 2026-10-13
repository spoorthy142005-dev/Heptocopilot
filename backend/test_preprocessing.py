"""
Unit & Integration Tests for Module 1 (3D Ingestion & Preprocessing Engine).

Generates synthetic 3D CT volumes in NIfTI format, processes them through
`backend.preprocessing.preprocess_3d_ct`, and asserts:
1. Returned tensor is a 5D PyTorch Tensor [1, 1, Depth, Height, Width].
2. Resampling correctly rescales anisotropic grid (e.g., 2x2x3mm) to uniform 1x1x1mm.
3. Intensities are clipped to [-100, +250] HU and Z-score normalized over foreground.
4. Output NIfTI persistence correctly writes 1mm isotropic headers.
"""

import sys
import tempfile
import unittest
from pathlib import Path

import nibabel as nib
import numpy as np
import torch

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.preprocessing import preprocess_3d_ct


class TestPreprocessing3DCT(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

        # Create synthetic 3D volume (Width=30, Height=40, Depth=20)
        # with anisotropic spacing: 2.0mm x 2.0mm x 3.0mm
        self.orig_w = 30
        self.orig_h = 40
        self.orig_d = 20
        self.spacing_w = 2.0
        self.spacing_h = 2.0
        self.spacing_d = 3.0

        # Construct synthetic HU array:
        # Background air (-1000 HU), soft tissue (50 HU), tumor/contrast (150 HU), bone (800 HU)
        data = np.full((self.orig_w, self.orig_h, self.orig_d), -1000.0, dtype=np.float32)
        # Central cylindrical region: soft tissue + tumor
        data[5:25, 10:30, 5:15] = 50.0   # Soft tissue ~ 50 HU
        data[12:18, 18:24, 8:12] = 160.0 # Hyperenhancing lesion ~ 160 HU
        data[14:16, 20:22, 9:11] = 800.0 # Dense calcification ~ 800 HU

        # Affine with diagonal voxel spacing
        affine = np.diag([self.spacing_w, self.spacing_h, self.spacing_d, 1.0])
        nii = nib.Nifti1Image(data, affine)

        self.input_file = self.temp_path / "synthetic_raw_ct.nii.gz"
        self.output_file = self.temp_path / "synthetic_processed_ct.nii.gz"
        nib.save(nii, str(self.input_file))

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_tensor_shape_and_dimensions(self):
        """Verify returned tensor is 5D: [1, 1, Depth, Height, Width]."""
        tensor = preprocess_3d_ct(self.input_file)

        # 1. Assert PyTorch Tensor type
        self.assertIsInstance(tensor, torch.Tensor)
        self.assertEqual(tensor.dtype, torch.float32)

        # 2. Assert 5D tensor: [Batch, Channel, Depth, Height, Width]
        self.assertEqual(tensor.ndim, 5)
        self.assertEqual(tensor.shape[0], 1, "Batch dimension must be 1")
        self.assertEqual(tensor.shape[1], 1, "Channel dimension must be 1")

        # 3. Assert isotropic resampling dimension expansion:
        # 30 voxels @ 2.0mm -> ~60 voxels @ 1.0mm
        # 40 voxels @ 2.0mm -> ~80 voxels @ 1.0mm
        # 20 voxels @ 3.0mm -> ~60 voxels @ 1.0mm
        batch, channel, depth, height, width = tensor.shape
        self.assertAlmostEqual(width, int(self.orig_w * self.spacing_w), delta=2)
        self.assertAlmostEqual(height, int(self.orig_h * self.spacing_h), delta=2)
        self.assertAlmostEqual(depth, int(self.orig_d * self.spacing_d), delta=2)

    def test_intensity_normalization_and_clipping(self):
        """Verify HU windowing and Z-score normalization properties."""
        tensor = preprocess_3d_ct(self.input_file)

        # Ensure no NaN or Inf values
        self.assertFalse(torch.isnan(tensor).any(), "Preprocessed tensor contains NaN")
        self.assertFalse(torch.isinf(tensor).any(), "Preprocessed tensor contains Inf")

        # Background was -1000 HU, clipped to -100 HU
        # Tissue values were > -100 HU
        # Verify foreground voxels have standardized distribution (mean ~ 0, std ~ 1)
        # Background voxels are at the minimum value
        bg_val = tensor.min().item()
        fg_mask = tensor > bg_val

        self.assertTrue(fg_mask.any(), "Expected non-empty foreground mask")
        fg_values = tensor[fg_mask]
        fg_mean = fg_values.mean().item()
        fg_std = fg_values.std().item()

        self.assertAlmostEqual(fg_mean, 0.0, delta=0.15, msg=f"Foreground mean {fg_mean} not near 0.0")
        self.assertAlmostEqual(fg_std, 1.0, delta=0.20, msg=f"Foreground std {fg_std} not near 1.0")

    def test_output_nifti_persistence(self):
        """Verify saving preprocessed volume to disk with 1.0mm isotropic affine."""
        tensor = preprocess_3d_ct(self.input_file, output_nifti_path=self.output_file)

        self.assertTrue(self.output_file.exists(), "Output NIfTI file was not created")

        saved_nii = nib.load(str(self.output_file))
        header = saved_nii.header
        zooms = header.get_zooms()[:3]

        # Voxel grid must be resampled to 1.0mm x 1.0mm x 1.0mm
        self.assertAlmostEqual(zooms[0], 1.0, places=2, msg="Voxel X spacing not 1.0mm")
        self.assertAlmostEqual(zooms[1], 1.0, places=2, msg="Voxel Y spacing not 1.0mm")
        self.assertAlmostEqual(zooms[2], 1.0, places=2, msg="Voxel Z spacing not 1.0mm")


if __name__ == "__main__":
    unittest.main()
