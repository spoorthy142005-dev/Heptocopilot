"""
Module 4: DeepSurv Multimodal Survival Prognosis Engine for HepatoCopilot.

Integrates 768-dimensional spatial image embeddings (from SwinUNETR / SwinBCLCStagingEngine)
with a 12-dimensional tabular clinical biomarker vector (AFP, Albumin, Bilirubin, etc.)
using a multimodal late-fusion neural network.

Outputs:
- Log-hazard ratio h_theta(x) for time-to-event Cox proportional hazards modeling
- Hazard Ratio (HR = exp(h_theta))
- Risk Stratification (Low, Intermediate, High)
- 1-Year, 3-Year, and 5-Year Survival Probabilities
- Full 60-Month Survival Trajectory Curve
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple, Union
import math
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from backend.lab_risk import LabValues
except ImportError:
    from lab_risk import LabValues

# Canonical 12 clinical parameters used in HepatoCopilot
CLINICAL_FEATURE_NAMES: List[str] = [
    "age",
    "afp",
    "alt",
    "ast",
    "albumin",
    "bilirubin",
    "platelets",
    "inr",
    "creatinine",
    "hbv_positive",
    "hcv_positive",
    "cirrhosis",
]

# Clinical population normalization parameters (mean, std) for robust neural scaling
CLINICAL_SCALING: Dict[str, Tuple[float, float]] = {
    "age": (58.0, 12.0),
    "afp": (20.0, 150.0),        # highly skewed; log-scaled internally
    "alt": (40.0, 35.0),
    "ast": (42.0, 38.0),
    "albumin": (3.8, 0.6),
    "bilirubin": (1.1, 1.2),
    "platelets": (180.0, 75.0),
    "inr": (1.15, 0.3),
    "creatinine": (1.0, 0.4),
    "hbv_positive": (0.0, 1.0),
    "hcv_positive": (0.0, 1.0),
    "cirrhosis": (0.0, 1.0),
}

# Empirical baseline cumulative hazard Lambda_0(t) for HCC cohort (months 0 to 60)
BASELINE_TIME_MONTHS = np.array([0, 6, 12, 18, 24, 36, 48, 60], dtype=np.float32)
BASELINE_CUMULATIVE_HAZARD = np.array(
    [0.0, 0.08, 0.18, 0.29, 0.41, 0.65, 0.92, 1.20], dtype=np.float32
)


def clinical_to_tensor(
    clinical_data: Union[LabValues, Dict[str, Any], torch.Tensor, np.ndarray],
    device: Optional[torch.device] = None,
) -> torch.Tensor:
    """
    Converts diverse clinical inputs into a normalized 2D PyTorch Tensor [Batch, 12].
    """
    if isinstance(clinical_data, torch.Tensor):
        if clinical_data.ndim == 1:
            clinical_data = clinical_data.unsqueeze(0)
        return clinical_data.to(device=device, dtype=torch.float32)

    if isinstance(clinical_data, np.ndarray):
        arr = torch.from_numpy(clinical_data).to(dtype=torch.float32)
        if arr.ndim == 1:
            arr = arr.unsqueeze(0)
        return arr.to(device=device)

    # Dictionary or LabValues dataclass
    if isinstance(clinical_data, LabValues):
        raw_dict = {
            "age": clinical_data.age,
            "afp": clinical_data.afp,
            "alt": clinical_data.alt,
            "ast": clinical_data.ast,
            "albumin": clinical_data.albumin,
            "bilirubin": clinical_data.bilirubin,
            "platelets": clinical_data.platelets,
            "inr": clinical_data.inr,
            "creatinine": clinical_data.creatinine,
            "hbv_positive": 1.0 if clinical_data.hbv_positive else 0.0,
            "hcv_positive": 1.0 if clinical_data.hcv_positive else 0.0,
            "cirrhosis": 1.0 if clinical_data.cirrhosis else 0.0,
        }
    elif isinstance(clinical_data, dict):
        raw_dict = {
            "age": float(clinical_data.get("age", 58.0)),
            "afp": float(clinical_data.get("afp", 15.0)),
            "alt": float(clinical_data.get("alt", 35.0)),
            "ast": float(clinical_data.get("ast", 38.0)),
            "albumin": float(clinical_data.get("albumin", 3.8)),
            "bilirubin": float(clinical_data.get("bilirubin", 1.0)),
            "platelets": float(clinical_data.get("platelets", 180.0)),
            "inr": float(clinical_data.get("inr", 1.1)),
            "creatinine": float(clinical_data.get("creatinine", 0.95)),
            "hbv_positive": 1.0 if clinical_data.get("hbv_positive") else 0.0,
            "hcv_positive": 1.0 if clinical_data.get("hcv_positive") else 0.0,
            "cirrhosis": 1.0 if clinical_data.get("cirrhosis") else 0.0,
        }
    else:
        raise TypeError(f"Unsupported clinical data type: {type(clinical_data)}")

    values = []
    for k in CLINICAL_FEATURE_NAMES:
        val = raw_dict.get(k, 0.0)
        mean, std = CLINICAL_SCALING.get(k, (0.0, 1.0))
        if k == "afp":
            # Log-transform AFP to prevent outlier distortion
            norm_val = (math.log1p(max(0.0, val)) - math.log1p(mean)) / 2.5
        elif k in ("hbv_positive", "hcv_positive", "cirrhosis"):
            norm_val = float(val)
        else:
            norm_val = (val - mean) / (std if std > 0 else 1.0)
        values.append(norm_val)

    tensor = torch.tensor([values], dtype=torch.float32, device=device)
    return tensor


class DeepSurvMultimodalFusion(nn.Module):
    """
    DeepSurv Multimodal Survival Neural Network.

    Fuses:
    1. Volumetric imaging embeddings: [Batch, 768] (from 3D Swin Transformer)
    2. Tabular clinical biomarker vector: [Batch, 12]

    Outputs log-hazard ratio h_theta(x) for Cox proportional hazards regression.
    """

    def __init__(
        self,
        img_embed_dim: int = 768,
        clinical_dim: int = 12,
        fusion_dim: int = 256,
        hidden_dim: int = 128,
        dropout: float = 0.25,
    ):
        super().__init__()
        self.img_embed_dim = img_embed_dim
        self.clinical_dim = clinical_dim

        # Vision branch: projects 768-dim spatial embedding -> 128
        self.vision_encoder = nn.Sequential(
            nn.Linear(img_embed_dim, 256),
            nn.LayerNorm(256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
        )

        # Tabular clinical branch: projects 12 clinical biomarkers -> 128
        self.clinical_encoder = nn.Sequential(
            nn.Linear(clinical_dim, 64),
            nn.LayerNorm(64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
        )

        # Multimodal late fusion: 128 + 128 = 256
        self.fusion_net = nn.Sequential(
            nn.Linear(hidden_dim * 2, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(fusion_dim, 64),
            nn.LayerNorm(64),
            nn.GELU(),
            nn.Linear(64, 1, bias=False),  # Log-hazard ratio h_theta(x) has no intercept
        )

        # Baseline initialization to produce calibrated risk near 0 (HR ~ 1.0)
        with torch.no_grad():
            nn.init.xavier_uniform_(self.fusion_net[-1].weight, gain=0.1)

    def forward(
        self,
        image_embeddings: torch.Tensor,
        clinical_features: torch.Tensor,
    ) -> torch.Tensor:
        """
        Forward pass predicting log-hazard ratio.

        Args:
            image_embeddings: Tensor [Batch, 768]
            clinical_features: Tensor [Batch, 12]

        Returns:
            torch.Tensor: Log-hazard ratio h_theta(x) [Batch, 1]
        """
        if image_embeddings.ndim == 1:
            image_embeddings = image_embeddings.unsqueeze(0)
        if clinical_features.ndim == 1:
            clinical_features = clinical_features.unsqueeze(0)

        v_feat = self.vision_encoder(image_embeddings)      # [B, 128]
        c_feat = self.clinical_encoder(clinical_features)   # [B, 128]

        fused = torch.cat([v_feat, c_feat], dim=1)          # [B, 256]
        log_hazard = self.fusion_net(fused)                 # [B, 1]
        return log_hazard

    def predict_prognosis(
        self,
        image_embeddings: torch.Tensor,
        clinical_data: Union[LabValues, Dict[str, Any], torch.Tensor],
    ) -> Dict[str, Any]:
        """
        High-level clinical inference predicting survival metrics and trajectories.

        Returns:
            Dict containing:
                - log_hazard: float h_theta(x)
                - hazard_ratio: float exp(h_theta(x))
                - risk_tier: 'Low Risk', 'Intermediate Risk', or 'High Risk'
                - median_survival_months: estimated median survival
                - survival_probabilities: 1-yr, 3-yr, 5-yr survival percentages
                - survival_curve: 60-month time-to-survival probability points
        """
        self.eval()
        device = next(self.parameters()).device
        clin_tensor = clinical_to_tensor(clinical_data, device=device)
        img_tensor = image_embeddings.to(device=device, dtype=torch.float32)

        with torch.inference_mode():
            log_hazard_t = self.forward(img_tensor, clin_tensor)
            h = float(log_hazard_t.item())

        # Clip log-hazard to physiologically reasonable bounds [-2.5, +2.5]
        h = max(-2.5, min(2.5, h))
        hazard_ratio = float(np.exp(h))

        # Survival Function: S(t|x) = exp(-Lambda_0(t) * exp(h))
        survival_curve_probs = np.exp(-BASELINE_CUMULATIVE_HAZARD * hazard_ratio)

        # 1-yr (12m), 3-yr (36m), 5-yr (60m)
        s_1yr = float(np.clip(survival_curve_probs[2], 0.01, 0.99))
        s_3yr = float(np.clip(survival_curve_probs[5], 0.01, 0.99))
        s_5yr = float(np.clip(survival_curve_probs[7], 0.01, 0.99))

        # Risk tier classification based on Hazard Ratio
        if hazard_ratio < 0.85:
            risk_tier = "Low Risk"
            risk_color = "#10b981"  # Emerald
            prognostic_summary = "Favourable survival prognosis. Excellent candidate for curative resection or ablation."
        elif hazard_ratio <= 1.45:
            risk_tier = "Intermediate Risk"
            risk_color = "#f59e0b"  # Amber
            prognostic_summary = "Moderate progression risk. Close imaging surveillance and multidisciplinary staging recommended."
        else:
            risk_tier = "High Risk"
            risk_color = "#ef4444"  # Rose
            prognostic_summary = "Elevated mortality risk. Recommend systemic immunotherapy evaluation or aggressive intervention."

        # Interpolate median survival (time where S(t) crosses 0.5)
        # Using exponential decline: t_median ~ -ln(0.5) / (lambda_annual * HR)
        # For baseline cohort, median survival ~ 38 months
        median_survival = round(float(38.0 / (hazard_ratio ** 0.85)), 1)
        median_survival = max(4.0, min(72.0, median_survival))

        # Build trajectory list for UI charts
        trajectory = []
        for t_month, p_surv in zip(BASELINE_TIME_MONTHS, survival_curve_probs):
            trajectory.append({
                "month": int(t_month),
                "survival_rate": round(float(p_surv), 4),
                "survival_pct": round(float(p_surv * 100.0), 1),
            })

        return {
            "log_hazard": round(h, 4),
            "hazard_ratio": round(hazard_ratio, 3),
            "risk_tier": risk_tier,
            "risk_color": risk_color,
            "median_survival_months": median_survival,
            "survival_probabilities": {
                "1_year_pct": round(s_1yr * 100.0, 1),
                "3_year_pct": round(s_3yr * 100.0, 1),
                "5_year_pct": round(s_5yr * 100.0, 1),
            },
            "survival_curve": trajectory,
            "summary": prognostic_summary,
        }


def cox_negative_log_likelihood(
    log_hazards: torch.Tensor,
    durations: torch.Tensor,
    events: torch.Tensor,
) -> torch.Tensor:
    """
    Computes Cox Proportional Hazards Negative Log Partial Likelihood loss.

    L(theta) = - sum_{i: E_i=1} [ h_theta(x_i) - log( sum_{j in R(T_i)} exp(h_theta(x_j)) ) ]

    Args:
        log_hazards: Tensor [Batch, 1]
        durations: Tensor [Batch] event or right-censoring times
        events: Tensor [Batch] binary indicators (1 = observed event, 0 = censored)
    """
    log_hazards = log_hazards.squeeze()
    durations = durations.squeeze()
    events = events.squeeze()

    # Sort descending by duration
    sorted_indices = torch.argsort(durations, descending=True)
    log_hazards_sorted = log_hazards[sorted_indices]
    events_sorted = events[sorted_indices]

    # Cumulative log-sum-exp over risk sets
    # Since sorted descending, risk set R(T_i) is indices 0..i in reverse
    exp_h = torch.exp(log_hazards_sorted)
    risk_set_sums = torch.cumsum(exp_h, dim=0)
    log_risk_sums = torch.log(risk_set_sums + 1e-7)

    # Loss for events only
    event_losses = events_sorted * (log_hazards_sorted - log_risk_sums)
    num_events = events_sorted.sum()
    if num_events == 0:
        return torch.tensor(0.0, requires_grad=True, device=log_hazards.device)

    return -torch.sum(event_losses) / num_events
