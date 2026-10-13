"""
Integration test suite for the unified /api/v1/analyze multimodal pipeline endpoint.
"""

import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.main import app


class TestAnalyzeEndpoint(unittest.TestCase):
    """Test suite for /api/v1/analyze unified orchestrator."""

    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_check_lists_analyze_endpoint(self):
        """Verify health check lists the new /api/v1/analyze endpoints."""
        resp = self.client.get("/api/v1/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("/api/v1/analyze", data["endpoints"])

    def test_02_post_analyze_full_pipeline(self):
        """Verify end-to-end execution of Modules 1 through 6 via POST /api/v1/analyze."""
        payload = {
            "patient_id": "PT-1001",
            "name": "James Morrison",
            "age": 58,
            "gender": "Male",
            "mrn": "MRN-88401",
            "afp": 450.0,
            "alt": 65.0,
            "ast": 80.0,
            "albumin": 3.1,
            "bilirubin": 2.4,
            "platelets": 95.0,
            "inr": 1.45,
            "creatinine": 1.1,
            "cirrhosis": True,
            "lesion_diameter_mm": 28.0,
            "arterial_hyperenhancement": True,
            "washout": True,
            "enhancing_capsule": False,
            "threshold_growth": False,
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        body = resp.json()

        self.assertEqual(body["status"], "success")
        self.assertEqual(body["patient_id"], "PT-1001")
        self.assertIn("modules", body)
        mods = body["modules"]

        # Module 1: Preprocessing
        self.assertIn("module1_preprocessing", mods)
        self.assertEqual(mods["module1_preprocessing"]["status"], "completed")
        self.assertEqual(mods["module1_preprocessing"]["hu_window"], [-100, 250])

        # Module 2: Segmentation
        self.assertIn("module2_segmentation", mods)
        self.assertEqual(mods["module2_segmentation"]["status"], "completed")
        self.assertGreater(mods["module2_segmentation"]["lesion_volume_cm3"], 0.0)

        # Module 3: Staging
        self.assertIn("module3_staging", mods)
        self.assertEqual(mods["module3_staging"]["status"], "completed")
        self.assertEqual(mods["module3_staging"]["spatial_embeddings_dim"], 768)
        self.assertIn("bclc_stage", mods["module3_staging"])

        # Module 4: Prognosis
        self.assertIn("module4_prognosis", mods)
        self.assertEqual(mods["module4_prognosis"]["status"], "completed")
        self.assertIn("hazard_ratio", mods["module4_prognosis"])
        self.assertIn("risk_tier", mods["module4_prognosis"])
        self.assertIn("survival_probabilities", mods["module4_prognosis"])
        self.assertGreater(len(mods["module4_prognosis"]["survival_curve"]), 5)

        # Module 5: Explainable AI
        self.assertIn("module5_xai", mods)
        xai = mods["module5_xai"]
        self.assertIn("gradcam_3d", xai)
        self.assertIn("hotspot_coords", xai["gradcam_3d"])
        self.assertIn("tabular_shap", xai)
        self.assertGreater(len(xai["tabular_shap"]["feature_attributions"]), 0)
        self.assertIn("clinical_summary", xai["tabular_shap"])

        # Clinical Rules
        self.assertIn("clinical_rules", mods)
        self.assertEqual(mods["clinical_rules"]["lirads_category"], "LR-5")

        # Module 6: RAG
        self.assertIn("module6_rag", mods)
        rag = mods["module6_rag"]
        self.assertEqual(rag["status"], "completed")
        self.assertGreaterEqual(len(rag["retrieved_guidelines"]), 2)
        self.assertIn("grounded_narrative", rag)

        # Timeline integration
        self.assertIn("timeline_event_created", body)

    def test_03_timeline_includes_new_event(self):
        """Verify the newly created analysis event appears in patient timeline."""
        post_resp = self.client.post("/api/v1/analyze", json={
            "patient_id": "PT-1001",
            "name": "James Morrison",
            "afp": 450.0,
            "lesion_diameter_mm": 28.0,
            "arterial_hyperenhancement": True,
            "washout": True,
        })
        self.assertEqual(post_resp.status_code, 200)

        resp = self.client.get("/api/patients/PT-1001/timeline")
        self.assertEqual(resp.status_code, 200)
        t_data = resp.json()
        events = t_data["events"]
        ai_events = [e for e in events if "Multimodal" in e.get("title", "") or "Multimodal" in e.get("category_name", "")]
        self.assertGreater(len(ai_events), 0)


if __name__ == "__main__":
    unittest.main()
