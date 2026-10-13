"""
ACR LI-RADS v2018 Diagnostic Decision Algorithm for CT/MRI.

Categorizes hepatic lesions into standard LI-RADS categories:
- LR-1: Definitely Benign
- LR-2: Probably Benign
- LR-3: Intermediate Probability of Malignancy
- LR-4: Probably HCC
- LR-5: Definitely HCC
- LR-M: Definitely or Probably Malignant, Not Specific for HCC
- LR-TIV: Tumor in Vein
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class LIRADSInput:
    size_mm: float
    aphe: str  # "nonperipheral", "peripheral", "none"
    washout: bool = False
    capsule: bool = False
    threshold_growth: bool = False
    tumor_in_vein: bool = False
    targetoid: bool = False
    benign_features: bool = False


def categorize_lirads(inp: LIRADSInput) -> dict:
    """Classify lesion using ACR LI-RADS v2018 rules."""
    
    # 1. Tumor in vein check
    if inp.tumor_in_vein:
        return {
            "category": "LR-TIV",
            "title": "Tumor in Vein",
            "hcc_probability": 0.95,
            "description": "Definite soft tissue tumor invasion of portal or hepatic veins.",
            "recommendation": "Multidisciplinary tumor board review & staging scan.",
            "color": "high"
        }
    
    # 2. Benign features check
    if inp.benign_features:
        return {
            "category": "LR-1",
            "title": "Definitely Benign",
            "hcc_probability": 0.01,
            "description": "Observation exhibits definitive benign hallmarks (e.g., simple cyst, vascular malformation).",
            "recommendation": "Return to routine surveillance schedule (6-month ultrasound).",
            "color": "low"
        }
    
    # 3. Targetoid features check -> LR-M
    if inp.targetoid or inp.aphe == "peripheral":
        return {
            "category": "LR-M",
            "title": "Malignant, Not Specific for HCC",
            "hcc_probability": 0.85,
            "description": "Targetoid features (rim APHE, peripheral washout) suggesting cholangiocarcinoma or metastasis.",
            "recommendation": "Biopsy or dedicated diagnostic MRI/CT required.",
            "color": "high"
        }

    # Count major features (washout, capsule, threshold growth)
    major_count = sum([inp.washout, inp.capsule, inp.threshold_growth])
    size = inp.size_mm

    # 4. Nonperipheral APHE Present
    if inp.aphe == "nonperipheral":
        if size < 10:
            category = "LR-3" if major_count == 0 else "LR-4"
        elif 10 <= size < 20:
            if major_count == 0:
                category = "LR-3"
            elif major_count == 1:
                category = "LR-4"
            else:
                category = "LR-5"
        else: # >= 20 mm
            if major_count == 0:
                category = "LR-4"
            else:
                category = "LR-5"
    
    # 5. No Nonperipheral APHE
    else:
        if size < 20:
            if major_count == 0:
                category = "LR-2"
            elif major_count == 1:
                category = "LR-3"
            else:
                category = "LR-4"
        else: # >= 20 mm
            if major_count == 0:
                category = "LR-3"
            elif major_count == 1:
                category = "LR-4"
            else:
                category = "LR-4" if major_count == 1 else "LR-5" if (inp.washout and inp.threshold_growth) else "LR-4"

    category_details = {
        "LR-2": {
            "title": "Probably Benign",
            "hcc_probability": 0.10,
            "description": "Low probability of malignancy. Minimal atypical imaging features.",
            "recommendation": "Surveillance in 6 months or diagnostic imaging in 3–6 months.",
            "color": "low"
        },
        "LR-3": {
            "title": "Intermediate Probability",
            "hcc_probability": 0.38,
            "description": "Intermediate risk for HCC. Equivocal imaging findings.",
            "recommendation": "Repeat diagnostic imaging in 3–6 months.",
            "color": "moderate"
        },
        "LR-4": {
            "title": "Probably HCC",
            "hcc_probability": 0.74,
            "description": "High probability of HCC. Meets multiple major imaging hallmarks.",
            "recommendation": "Multidisciplinary discussion, consider biopsy or close follow-up.",
            "color": "high"
        },
        "LR-5": {
            "title": "Definitely HCC",
            "hcc_probability": 0.96,
            "description": "Definite Hepatocellular Carcinoma. Meets classic non-invasive diagnostic criteria.",
            "recommendation": "Refer to multidisciplinary liver tumor board for treatment planning.",
            "color": "high"
        }
    }

    info = category_details.get(category, category_details["LR-3"])
    return {
        "category": category,
        "title": info["title"],
        "hcc_probability": info["hcc_probability"],
        "description": info["description"],
        "recommendation": info["recommendation"],
        "color": info["color"]
    }
