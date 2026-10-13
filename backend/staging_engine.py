"""
Module 3: Swin Transformer BCLC Staging Engine for HepatoCopilot.

Uses SwinUNETR / SwinViT 3D encoder as a volumetric feature extractor to yield
768-dimensional spatial embeddings, attached to a clinical classification head
predicting the 4 Barcelona Clinic Liver Cancer (BCLC) disease stages:
- BCLC Stage 0/A: Very Early / Early Stage (Resection, Ablation, Transplant candidate)
- BCLC Stage B: Intermediate Stage (Multinodular, preserved liver function -> TACE)
- BCLC Stage C: Advanced Stage (Portal invasion / extrahepatic -> Systemic Immunotherapy)
- BCLC Stage D: Terminal Stage (Severe liver dysfunction -> Best Supportive Care)
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

import torch
import torch.nn as nn
import torch.nn.functional as F
from monai.networks.nets import SwinUNETR


BCLC_CLASSES: List[str] = [
    "BCLC Stage 0/A (Early Stage - Resection / Ablation / Transplant candidate)",
    "BCLC Stage B (Intermediate Stage - Locoregional TACE candidate)",
    "BCLC Stage C (Advanced Stage - Systemic Therapy: Atezolizumab + Bevacizumab)",
    "BCLC Stage D (Terminal Stage - Best Supportive Care)",
]

BCLC_SHORT_NAMES: List[str] = [
    "Stage 0/A",
    "Stage B",
    "Stage C",
    "Stage D",
]


class SwinBCLCStagingEngine(nn.Module):
    """
    Multimodal volumetric staging network using 3D Swin Transformer encoder.

    Extracts 768-dimensional latent spatial embeddings from 3D CT volumes and
    projects them into BCLC liver cancer disease stage distributions.
    """

    def __init__(
        self,
        in_channels: int = 1,
        feature_size: int = 48,
        spatial_dims: int = 3,
        num_classes: int = 4,
        embed_dim: int = 768,
        dropout: float = 0.2,
        use_checkpoint: bool = False,
    ):
        super().__init__()
        self.num_classes = num_classes
        self.embed_dim = embed_dim

        # 1. Swin Transformer 3D Feature Extractor (Encoder Backbone)
        swin_backbone = SwinUNETR(
            in_channels=in_channels,
            out_channels=2,
            feature_size=feature_size,
            spatial_dims=spatial_dims,
            use_checkpoint=use_checkpoint,
        )
        self.encoder = swin_backbone.swinViT

        # 2. Global 3D Spatial Pooling to reduce spatial dimensions [D', H', W'] -> 1
        self.global_pool = nn.AdaptiveAvgPool3d(1)
        self.flatten = nn.Flatten(start_dim=1)

        # 3. Clinical Staging Classification Head: 768-dim -> 4 BCLC Stages
        self.classifier_head = nn.Sequential(
            nn.Linear(embed_dim, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_classes),
        )

    def extract_embeddings(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extract 768-dimensional spatial feature representations from 3D CT volume.

        Args:
            x: 5D CT volume tensor [Batch, 1, Depth, Height, Width]

        Returns:
            torch.Tensor: Spatial embeddings tensor [Batch, 768]
        """
        # Encoder yields multi-stage features: Stage 0 (48), 1 (96), 2 (192), 3 (384), 4 (768)
        feature_stages = self.encoder(x)
        bottleneck_features = feature_stages[-1]  # shape: [B, 768, D/32, H/32, W/32]

        pooled = self.global_pool(bottleneck_features)  # shape: [B, 768, 1, 1, 1]
        embeddings = self.flatten(pooled)  # shape: [B, 768]
        return embeddings

    def forward(self, x: torch.Tensor) -> Dict[str, Any]:
        """
        Full forward pass: extracts 768-dim embeddings and predicts BCLC staging logits.

        Args:
            x: 5D CT volume tensor [Batch, 1, Depth, Height, Width]

        Returns:
            dict containing:
                - 'embeddings': 768-dim tensor [Batch, 768]
                - 'logits': raw classification logits [Batch, 4]
                - 'probabilities': softmax stage probabilities [Batch, 4]
                - 'predicted_stage_idx': predicted class index [Batch]
                - 'stage_name': formatted BCLC clinical stage name
                - 'stage_probabilities': dictionary mapping stage names to probabilities
        """
        embeddings = self.extract_embeddings(x)  # [B, 768]
        logits = self.classifier_head(embeddings)  # [B, 4]
        probabilities = F.softmax(logits, dim=-1)  # [B, 4]

        predicted_idx = int(probabilities[0].argmax().item())
        stage_name = BCLC_CLASSES[predicted_idx]

        stage_probs_dict = {
            BCLC_SHORT_NAMES[i]: round(float(probabilities[0, i].item()), 4)
            for i in range(self.num_classes)
        }

        return {
            "embeddings": embeddings,
            "logits": logits,
            "probabilities": probabilities,
            "predicted_stage_idx": predicted_idx,
            "stage_name": stage_name,
            "stage_probabilities": stage_probs_dict,
        }


def build_staging_model(
    feature_size: int = 48,
    checkpoint_path: Optional[str] = None,
    device: Optional[torch.device] = None,
) -> SwinBCLCStagingEngine:
    """Helper factory to instantiate SwinBCLCStagingEngine."""
    dev = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SwinBCLCStagingEngine(feature_size=feature_size).to(dev)

    if checkpoint_path is not None:
        checkpoint = torch.load(checkpoint_path, map_location=dev, weights_only=True)
        state_dict = checkpoint["model"] if "model" in checkpoint else checkpoint
        model.load_state_dict(state_dict)

    return model
