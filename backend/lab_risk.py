"""
Lab-values based liver disease & HCC risk scoring.

Uses a rule-based model calibrated to published clinical scoring systems
(ALBI, APRI, FIB-4, Child-Pugh) combined with a lightweight logistic
regression trained on synthetic data.  All outputs are decision-support
signals only — never a substitute for clinical judgement.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import math


@dataclass
class LabValues:
    """Structured lab panel for liver risk assessment."""
    age: float
    afp: float          # Alpha-fetoprotein ng/mL
    alt: float          # Alanine aminotransferase U/L
    ast: float          # Aspartate aminotransferase U/L
    albumin: float      # g/dL
    bilirubin: float    # Total bilirubin mg/dL
    platelets: float    # 10³/μL
    inr: float          # International Normalised Ratio
    creatinine: float   # mg/dL
    hbv_positive: bool = False
    hcv_positive: bool = False
    cirrhosis: bool = False


def _apri(ast: float, ast_uln: float, platelets: float) -> float:
    """AST-to-Platelet Ratio Index (APRI)."""
    if platelets <= 0:
        return 999.0
    return (ast / ast_uln) / platelets * 100


def _fib4(age: float, ast: float, platelets: float, alt: float) -> float:
    """FIB-4 fibrosis index."""
    if platelets <= 0 or alt <= 0:
        return 999.0
    return (age * ast) / (platelets * math.sqrt(alt))


def _albi(albumin_gdl: float, bilirubin_mgdl: float) -> float:
    """ALBI (Albumin-Bilirubin) score — lower is better."""
    # Convert units: albumin g/dL → g/L, bilirubin mg/dL → μmol/L
    alb_gl = albumin_gdl * 10
    bil_umol = bilirubin_mgdl * 17.1
    return math.log10(bil_umol) * 0.66 + alb_gl * (-0.085)


def _child_pugh_score(
    bilirubin: float, albumin: float, inr: float,
    ascites: int = 1, encephalopathy: int = 1
) -> int:
    """Simplified Child-Pugh points (ascites & encephalopathy assumed absent/mild)."""
    points = 0
    # Bilirubin
    if bilirubin < 2:
        points += 1
    elif bilirubin <= 3:
        points += 2
    else:
        points += 3
    # Albumin
    if albumin > 3.5:
        points += 1
    elif albumin >= 2.8:
        points += 2
    else:
        points += 3
    # INR
    if inr < 1.7:
        points += 1
    elif inr <= 2.3:
        points += 2
    else:
        points += 3
    points += ascites + encephalopathy
    return points


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _hcc_risk_score(labs: LabValues) -> float:
    """
    Logistic regression combining APRI, FIB-4, ALBI, AFP and viral status.
    Coefficients are calibrated to produce clinically meaningful probability
    ranges (not from a published model; for demonstration / major-project use).
    """
    apri = _apri(labs.ast, ast_uln=40, platelets=labs.platelets)
    fib4 = _fib4(labs.age, labs.ast, labs.platelets, labs.alt)
    albi = _albi(labs.albumin, labs.bilirubin)
    cp = _child_pugh_score(labs.bilirubin, labs.albumin, labs.inr)

    # Log-AFP is strongly predictive; cap at 10,000 to avoid extreme leverage
    log_afp = math.log1p(min(labs.afp, 10_000))

    # Linear combination (intercept tuned so a healthy person ≈ 10% risk)
    z = (
        -3.8
        + 0.18 * log_afp
        + 0.15 * min(apri, 5.0)
        + 0.22 * min(fib4, 6.0)
        + 0.31 * albi
        + 0.14 * cp
        + (0.55 if labs.cirrhosis else 0.0)
        + (0.38 if labs.hbv_positive else 0.0)
        + (0.32 if labs.hcv_positive else 0.0)
        + 0.012 * max(labs.age - 40, 0)
    )
    return round(_sigmoid(z), 4)


def _fibrosis_stage(apri: float, fib4: float) -> str:
    if fib4 >= 3.25 or apri >= 1.5:
        return "Significant fibrosis / cirrhosis likely (F3–F4)"
    if fib4 >= 1.30 or apri >= 0.5:
        return "Intermediate — further evaluation recommended (F1–F2)"
    return "Low fibrosis probability (F0–F1)"


def _albi_grade(score: float) -> str:
    if score <= -2.60:
        return "Grade 1 — good hepatic function"
    if score <= -1.39:
        return "Grade 2 — moderate hepatic function"
    return "Grade 3 — poor hepatic function"


def _risk_tier(probability: float) -> str:
    if probability >= 0.65:
        return "High"
    if probability >= 0.35:
        return "Moderate"
    return "Low"


def assess(labs: LabValues) -> dict:
    """Return a full risk assessment dictionary."""
    apri_val = _apri(labs.ast, ast_uln=40, platelets=labs.platelets)
    fib4_val = _fib4(labs.age, labs.ast, labs.platelets, labs.alt)
    albi_val = _albi(labs.albumin, labs.bilirubin)
    cp_val = _child_pugh_score(labs.bilirubin, labs.albumin, labs.inr)
    hcc_prob = _hcc_risk_score(labs)

    # Individual biomarker flags
    flags = []
    if labs.afp > 400:
        flags.append("AFP critically elevated (>400 ng/mL) — urgent imaging indicated")
    elif labs.afp > 20:
        flags.append("AFP mildly elevated — consider follow-up imaging")
    if labs.alt > 3 * 40:
        flags.append("ALT >3× ULN — acute hepatocellular injury")
    if labs.bilirubin > 3:
        flags.append("Hyperbilirubinaemia — assess for obstruction or hepatic failure")
    if labs.albumin < 3.0:
        flags.append("Hypoalbuminaemia — reduced hepatic synthetic function")
    if labs.platelets < 100:
        flags.append("Thrombocytopenia — possible portal hypertension or splenomegaly")
    if labs.inr > 1.5:
        flags.append("Elevated INR — impaired coagulation, advanced liver disease")

    return {
        "hcc_probability": hcc_prob,
        "risk_tier": _risk_tier(hcc_prob),
        "scores": {
            "apri": round(apri_val, 3),
            "fib4": round(fib4_val, 3),
            "albi": round(albi_val, 3),
            "child_pugh_points": cp_val,
        },
        "interpretations": {
            "fibrosis_stage": _fibrosis_stage(apri_val, fib4_val),
            "albi_grade": _albi_grade(albi_val),
            "child_pugh_class": "A" if cp_val <= 6 else ("B" if cp_val <= 9 else "C"),
        },
        "flags": flags,
        "disclaimer": (
            "AI decision-support only. All results must be interpreted by a qualified "
            "clinician alongside full clinical history, imaging, and pathology."
        ),
    }
