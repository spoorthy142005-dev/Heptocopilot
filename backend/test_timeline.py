"""
Automated Integration & Unit Tests for HepatoCopilot Longitudinal Patient Timeline API.
"""

import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.main import app


class TestLongitudinalTimelineAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.patient_id = "PT-10482"

    def test_01_get_patient_timeline(self):
        """Test retrieving normalized timeline for patient PT-10482."""
        res = self.client.get(f"/api/patients/{self.patient_id}/timeline")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("events", data)
        self.assertIn("summary", data)
        self.assertGreater(len(data["events"]), 0)

        # Verify summary metrics
        summary = data["summary"]
        self.assertIn("first_assessment", summary)
        self.assertIn("latest_assessment", summary)
        self.assertIn("tumor_trend", summary)

    def test_02_timeline_filtering(self):
        """Test filtering events by category and query string."""
        # Test category filter for imaging scans
        res_img = self.client.get(f"/api/patients/{self.patient_id}/timeline?category=imaging_scan")
        self.assertEqual(res_img.status_code, 200)
        events_img = res_img.json()["events"]
        for ev in events_img:
            self.assertEqual(ev["category"], "imaging_scan")

        # Test search query for AFP
        res_q = self.client.get(f"/api/patients/{self.patient_id}/timeline?q=AFP")
        self.assertEqual(res_q.status_code, 200)
        events_q = res_q.json()["events"]
        self.assertGreater(len(events_q), 0)

    def test_03_add_doctor_note(self):
        """Test adding signed clinical note with audit log."""
        payload = {
            "note": "Patient exhibits excellent response to Cycle 3 immunotherapy. No Grade 3+ adverse events.",
            "author": "Dr. Riley Chen (Oncology Lead)"
        }
        res = self.client.post(f"/api/patients/{self.patient_id}/notes", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("event", data)
        self.assertEqual(data["event"]["category"], "doctor_note")

        # Verify new note appears in timeline
        t_res = self.client.get(f"/api/patients/{self.patient_id}/timeline?category=doctor_note")
        t_data = t_res.json()
        matching = [e for e in t_data["events"] if "Cycle 3 immunotherapy" in e["summary"]]
        self.assertGreater(len(matching), 0)

    def test_04_tumor_trend_calculations(self):
        """Test calculation of percentage change between consecutive imaging scans."""
        res = self.client.get(f"/api/patients/{self.patient_id}/timeline?category=imaging_scan")
        self.assertEqual(res.status_code, 200)
        scans = res.json()["events"]
        self.assertGreaterEqual(len(scans), 2)
        
        # Scans are sorted newest first in API
        newest = scans[0]
        self.assertIn("diameter_change_pct", newest["imaging"])
        self.assertIn("volume_change_pct", newest["imaging"])
        self.assertIn("trend_status", newest["imaging"])

    def test_05_export_timeline_pdf(self):
        """Test PDF report generation endpoint."""
        res = self.client.get(f"/api/patients/{self.patient_id}/timeline/pdf")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "application/pdf")
        self.assertGreater(len(res.content), 100)


if __name__ == "__main__":
    unittest.main()
