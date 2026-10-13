"""
Unit & Integration Tests for Module 6 (FAISS + LangChain Grounded Clinical RAG Core).
"""

import sys
import unittest
from pathlib import Path
import numpy as np

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.rag_engine_faiss import (
    DEFAULT_VECTORSTORE_DIR,
    GroundedClinicalRAGChain,
    index_medical_guidelines,
)


class TestGroundedRAGFAISS(unittest.TestCase):
    """Test suite for FAISS & LangChain RAG pipeline."""

    @classmethod
    def setUpClass(cls):
        # Ensure the vector index is loaded or created
        cls.vectorstore = index_medical_guidelines(DEFAULT_VECTORSTORE_DIR)
        cls.rag_chain = GroundedClinicalRAGChain(DEFAULT_VECTORSTORE_DIR)

    def test_01_vectorstore_persistence(self):
        """Verify FAISS vector index files are saved persistently on disk."""
        faiss_file = DEFAULT_VECTORSTORE_DIR / "index.faiss"
        pkl_file = DEFAULT_VECTORSTORE_DIR / "index.pkl"
        self.assertTrue(faiss_file.exists(), "index.faiss must exist")
        self.assertTrue(pkl_file.exists(), "index.pkl must exist")
        self.assertGreater(faiss_file.stat().st_size, 1000)

    def test_02_retrieval_query_returns_guidelines(self):
        """Verify similarity retrieval returns relevant documents with distance scores."""
        docs_and_scores = self.rag_chain.retrieve_guidelines(
            bclc_stage="Stage B",
            lesion_volume_cm3=18.4,
            hazard_score=1.42,
            afp_ng_ml=450.0,
            lirads_category="LR-5",
        )
        self.assertGreaterEqual(len(docs_and_scores), 2)
        top_doc, top_score = docs_and_scores[0]
        self.assertIn("guideline", top_doc.metadata)
        self.assertIsInstance(top_score, (float, np.floating))

    def test_03_generate_structured_clinical_report(self):
        """Verify 3-section structured clinical report generation with guidelines."""
        report = self.rag_chain.generate_clinical_report(
            patient_name="James Morrison",
            mrn="MRN-88401",
            age=58,
            gender="Male",
            bclc_stage="Stage B",
            lesion_volume_cm3=18.4,
            hazard_score=1.42,
            afp_ng_ml=450.0,
            lirads_category="LR-5",
            albi_grade="Grade 2",
            child_pugh="Class A",
        )
        self.assertEqual(report["status"], "success")
        self.assertIn("sections", report)
        secs = report["sections"]

        # Check required sections
        self.assertIn("executive_summary", secs)
        self.assertIn("staging_justification", secs)
        self.assertIn("guideline_backed_recommendations", secs)

        # Check section contents
        self.assertIn("LR-5", secs["executive_summary"])
        self.assertIn("Stage B", secs["staging_justification"])
        self.assertIn("TACE", secs["guideline_backed_recommendations"])

        # Check citations
        self.assertGreaterEqual(len(report["retrieved_guidelines"]), 2)
        self.assertIn("full_report", report)


if __name__ == "__main__":
    unittest.main()
