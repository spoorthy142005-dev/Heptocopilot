"""
Integration & Dimension Verification Tests for Modules 2 & 3.

Passes 5D dummy volumetric CT tensors [1, 1, 96, 96, 96] through:
1. Module 2: LiverSwinUNETRSegmentor (Volumetric 3D Segmentation Engine)
2. Module 3: SwinBCLCStagingEngine (768-dim Spatial Embeddings & BCLC Staging Head)

Verifies:
- 3D binary mask output shape [96, 96, 96] and quantitative lesion volume (cm³).
- 768-dimensional latent spatial embedding extraction [1, 768].
- 4-class BCLC disease stage logits [1, 4] and softmax probability distribution.
"""

import sys
import unittest
from pathlib import Path
import torch

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.segmentation_engine import LiverSwinUNETRSegmentor
from backend.staging_engine import SwinBCLCStagingEngine, BCLC_CLASSES


class TestModules2And3DeepLearningModels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Set CPU seeds for determinism
        torch.manual_seed(42)
        # Create standard 5D preprocessed CT test tensor [B=1, C=1, D=96, H=96, W=96]
        cls.dummy_input = torch.randn(1, 1, 96, 96, 96, dtype=torch.float32)

    def test_01_swinunetr_segmentation_engine(self):
        """Test Module 2 SwinUNETR forward pass, mask dimensions, and volume metrics."""
        # Use feature_size=24 for fast CPU unit test execution
        model = LiverSwinUNETRSegmentor(
            in_channels=1,
            out_channels=2,
            feature_size=24,
            spatial_dims=3,
            use_checkpoint=False,
        )
        model.eval()

        with torch.inference_mode():
            # Test direct forward pass
            logits = model(self.dummy_input)
            self.assertEqual(logits.ndim, 5)
            self.assertEqual(logits.shape, (1, 2, 96, 96, 96))

            # Test clinical segmentation method
            output = model.segment(
                self.dummy_input,
                voxel_spacing_mm=(1.0, 1.0, 1.0),
                threshold=0.5,
            )

            # 1. Assert 3D binary segmentation mask
            mask = output["mask"]
            self.assertIsInstance(mask, torch.Tensor)
            self.assertEqual(mask.ndim, 3)
            self.assertEqual(mask.shape, (96, 96, 96))
            self.assertEqual(mask.dtype, torch.uint8)

            # 2. Assert lesion volume metrics
            volume_cm3 = output["lesion_volume_cm3"]
            voxel_count = output["lesion_voxel_count"]
            self.assertIsInstance(volume_cm3, float)
            self.assertIsInstance(voxel_count, int)
            self.assertGreaterEqual(volume_cm3, 0.0)
            self.assertGreaterEqual(voxel_count, 0)

            # 3. Assert probability distribution
            probs = output["probabilities"]
            self.assertEqual(probs.shape, (1, 2, 96, 96, 96))
            # Softmax across channel dim must sum to 1.0
            sum_probs = probs.sum(dim=1)
            self.assertTrue(torch.allclose(sum_probs, torch.ones_like(sum_probs), atol=1e-4))

    def test_02_swin_bclc_staging_engine(self):
        """Test Module 3 SwinBCLCStagingEngine embeddings, logits, and BCLC stages."""
        # Instantiate with default feature_size=48 yielding exact 768-dim embeddings
        staging_model = SwinBCLCStagingEngine(
            in_channels=1,
            feature_size=48,
            spatial_dims=3,
            num_classes=4,
            embed_dim=768,
        )
        staging_model.eval()

        with torch.inference_mode():
            # 1. Test 768-dimensional spatial embedding extraction
            embeddings = staging_model.extract_embeddings(self.dummy_input)
            self.assertIsInstance(embeddings, torch.Tensor)
            self.assertEqual(embeddings.ndim, 2)
            self.assertEqual(embeddings.shape, (1, 768), "Embeddings must be exactly 768-dimensional")

            # 2. Test full forward pass with BCLC head
            output = staging_model(self.dummy_input)

            # Verify logits dimension
            logits = output["logits"]
            self.assertEqual(logits.shape, (1, 4), "Logits must be [1, 4] for the 4 BCLC stages")

            # Verify probabilities
            probabilities = output["probabilities"]
            self.assertEqual(probabilities.shape, (1, 4))
            self.assertAlmostEqual(probabilities.sum().item(), 1.0, places=4)

            # Verify stage classification
            predicted_idx = output["predicted_stage_idx"]
            stage_name = output["stage_name"]
            self.assertIn(predicted_idx, [0, 1, 2, 3])
            self.assertIn(stage_name, BCLC_CLASSES)

            # Verify stage probabilities dictionary
            stage_probs = output["stage_probabilities"]
            self.assertEqual(len(stage_probs), 4)
            for short_name, prob in stage_probs.items():
                self.assertIsInstance(prob, float)
                self.assertGreaterEqual(prob, 0.0)
                self.assertLessEqual(prob, 1.0)


if __name__ == "__main__":
    unittest.main()
