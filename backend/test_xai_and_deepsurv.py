"""
Unit & Integration Tests for Module 4 (DeepSurv) and Module 5 (XAI Engine).
"""

import sys
import unittest
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.deepsurv_engine import (
    DeepSurvMultimodalFusion,
    clinical_to_tensor,
    cox_negative_log_likelihood,
    CLINICAL_FEATURE_NAMES,
)
from backend.xai_engine import (
    GradCAM3D,
    compute_tabular_shap_values,
    extract_patient_feature_vector,
    SHAP_FEATURE_KEYS,
)
from backend.lab_risk import LabValues


class TestDeepSurvPrognosisEngine(unittest.TestCase):
    """Test suite for Module 4 DeepSurv Multimodal Survival Engine."""

    def setUp(self):
        self.model = DeepSurvMultimodalFusion(
            img_embed_dim=768,
            clinical_dim=12,
            fusion_dim=256,
            hidden_dim=128,
        )

    def test_01_clinical_tensor_conversion(self):
        """Verify transformation of clinical dictionary and LabValues into 12-dim tensor."""
        sample_dict = {
            "age": 60.0,
            "afp": 45.0,
            "alt": 55.0,
            "ast": 60.0,
            "albumin": 3.4,
            "bilirubin": 1.5,
            "platelets": 130.0,
            "inr": 1.25,
            "creatinine": 1.1,
            "hbv_positive": True,
            "hcv_positive": False,
            "cirrhosis": True,
        }
        t = clinical_to_tensor(sample_dict)
        self.assertEqual(t.shape, (1, 12))
        self.assertEqual(t.dtype, torch.float32)

        lv = LabValues(
            age=55.0,
            afp=12.0,
            alt=30.0,
            ast=32.0,
            albumin=4.1,
            bilirubin=0.8,
            platelets=220.0,
            inr=1.0,
            creatinine=0.9,
            hbv_positive=False,
            hcv_positive=False,
            cirrhosis=False,
        )
        t_lv = clinical_to_tensor(lv)
        self.assertEqual(t_lv.shape, (1, 12))

    def test_02_forward_shape(self):
        """Verify model forward pass shape for single sample and batched inputs."""
        # Single sample
        img_single = torch.randn(1, 768)
        clin_single = torch.randn(1, 12)
        out_single = self.model(img_single, clin_single)
        self.assertEqual(out_single.shape, (1, 1))

        # Batched samples
        batch_size = 4
        img_batch = torch.randn(batch_size, 768)
        clin_batch = torch.randn(batch_size, 12)
        out_batch = self.model(img_batch, clin_batch)
        self.assertEqual(out_batch.shape, (batch_size, 1))

    def test_03_cox_partial_likelihood_loss(self):
        """Verify Cox negative log partial likelihood loss computation."""
        log_hazards = torch.tensor([[0.5], [1.2], [-0.3], [0.8]], requires_grad=True)
        durations = torch.tensor([12.0, 6.0, 36.0, 18.0])
        events = torch.tensor([1.0, 1.0, 0.0, 1.0])

        loss = cox_negative_log_likelihood(log_hazards, durations, events)
        self.assertTrue(torch.is_tensor(loss))
        self.assertGreater(float(loss.item()), 0.0)

        # Backpropagation check
        loss.backward()
        self.assertIsNotNone(log_hazards.grad)

    def test_04_predict_prognosis_trajectory(self):
        """Verify comprehensive clinical prognosis prediction output dictionary."""
        img_embed = torch.randn(1, 768)
        sample_labs = {
            "age": 64.0,
            "afp": 350.0,
            "albumin": 2.9,
            "bilirubin": 2.6,
            "platelets": 85.0,
            "cirrhosis": 1.0,
        }

        prognosis = self.model.predict_prognosis(img_embed, sample_labs)
        self.assertIn("log_hazard", prognosis)
        self.assertIn("hazard_ratio", prognosis)
        self.assertIn("risk_tier", prognosis)
        self.assertIn("median_survival_months", prognosis)
        self.assertIn("survival_probabilities", prognosis)
        self.assertIn("survival_curve", prognosis)

        probs = prognosis["survival_probabilities"]
        self.assertIn("1_year_pct", probs)
        self.assertIn("3_year_pct", probs)
        self.assertIn("5_year_pct", probs)
        self.assertGreaterEqual(probs["1_year_pct"], probs["3_year_pct"])
        self.assertGreaterEqual(probs["3_year_pct"], probs["5_year_pct"])

        curve = prognosis["survival_curve"]
        self.assertGreaterEqual(len(curve), 6)
        self.assertEqual(curve[0]["month"], 0)
        self.assertEqual(curve[0]["survival_rate"], 1.0)


class TestDualXAIEngine(unittest.TestCase):
    """Test suite for Module 5 Dual Explainable AI Engine."""

    class Dummy3DNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.conv1 = nn.Conv3d(1, 8, kernel_size=3, padding=1)
            self.relu1 = nn.ReLU()
            self.conv2 = nn.Conv3d(8, 16, kernel_size=3, padding=1)
            self.relu2 = nn.ReLU()
            self.pool = nn.AdaptiveAvgPool3d(1)
            self.head = nn.Linear(16, 2)

        def forward(self, x):
            x = self.relu1(self.conv1(x))
            x = self.relu2(self.conv2(x))
            return self.head(torch.flatten(self.pool(x), 1))

    def test_01_gradcam3d_volumetric_generation(self):
        """Verify 3D Grad-CAM generation matches exact input volume depth and dimensions."""
        model = self.Dummy3DNet().eval()
        d, h, w = 24, 48, 48
        inp = torch.randn(1, 1, d, h, w, dtype=torch.float32)

        gradcam = GradCAM3D(model, target_layer=model.conv2)
        cam = gradcam.generate_cam(inp, target_class=1)

        self.assertEqual(cam.shape, (d, h, w))
        self.assertEqual(cam.shape[0], d, "CAM depth must match input tensor depth")
        self.assertGreaterEqual(float(cam.min()), 0.0)
        self.assertLessEqual(float(cam.max()), 1.0)

        ortho = gradcam.extract_orthogonal_slices(cam)
        self.assertEqual(ortho["axial_slice"].shape, (h, w))
        self.assertEqual(ortho["coronal_slice"].shape, (d, w))
        self.assertEqual(ortho["sagittal_slice"].shape, (d, h))
        self.assertIn("hotspot_coords", ortho)

        gradcam.remove_hooks()

    def test_02_tabular_shap_attributions(self):
        """Verify dynamic Shapley attributions for clinical risk drivers."""
        high_risk_patient = {
            "afp": 620.0,
            "albumin": 2.8,
            "bilirubin": 3.1,
            "alt": 75.0,
            "ast": 90.0,
            "platelets": 70.0,
            "inr": 1.6,
            "age": 66.0,
        }

        shap_res = compute_tabular_shap_values(high_risk_patient, explainer_type="tree")
        self.assertEqual(shap_res["status"], "success")
        self.assertGreater(shap_res["predicted_risk_pct"], 75.0)

        attrs = shap_res["feature_attributions"]
        self.assertEqual(len(attrs), len(SHAP_FEATURE_KEYS))

        # AFP should be positive risk driver
        afp_attr = next(a for a in attrs if a["feature_key"] == "afp")
        self.assertGreater(afp_attr["shap_value"], 0.0)
        self.assertEqual(afp_attr["impact"], "Increased Risk")

        # Top risk drivers should contain AFP
        top_driver_keys = [d["feature_key"] for d in shap_res["top_risk_drivers"]]
        self.assertIn("afp", top_driver_keys)
        self.assertTrue(len(shap_res["clinical_summary"]) > 20)


if __name__ == "__main__":
    unittest.main()
