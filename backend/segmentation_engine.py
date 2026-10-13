"""
Module 2: 3D Volumetric Segmentation Engine for HepatoCopilot.

Uses MONAI 3D SwinUNETR to segment liver tissue and focal lesions (HCC)
from 5D preprocessed CT volumes [Batch, Channel, Depth, Height, Width].
Calculates 3D binary masks and quantitative lesion volume (cm³).
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple, Union

import torch
import torch.nn as nn
import torch.nn.functional as F
from monai.networks.nets import SwinUNETR


class LiverSwinUNETRSegmentor(nn.Module):
    """
    3D SwinUNETR neural network for volumetric liver & lesion segmentation.

    Accepts 5D tensor [B, 1, Depth, Height, Width] (e.g. from Module 1 preprocessing)
    and predicts multi-class/binary voxel logits for background vs. lesion.
    """

    def __init__(
        self,
        in_channels: int = 1,
        out_channels: int = 2,
        feature_size: int = 48,
        spatial_dims: int = 3,
        use_checkpoint: bool = False,
    ):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.feature_size = feature_size
        self.spatial_dims = spatial_dims

        # Instantiate MONAI SwinUNETR backbone
        self.model = SwinUNETR(
            in_channels=in_channels,
            out_channels=out_channels,
            feature_size=feature_size,
            spatial_dims=spatial_dims,
            use_checkpoint=use_checkpoint,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: 5D CT tensor [Batch, Channel, Depth, Height, Width]
        Returns:
            torch.Tensor: Logits tensor [Batch, OutChannels, Depth, Height, Width]
        """
        return self.model(x)

    def segment(
        self,
        ct_tensor: torch.Tensor,
        voxel_spacing_mm: Tuple[float, float, float] = (1.0, 1.0, 1.0),
        threshold: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Perform 3D segmentation inference and compute lesion volumetric metrics.

        Args:
            ct_tensor: 5D tensor [1, 1, Depth, Height, Width].
            voxel_spacing_mm: (spacing_depth, spacing_height, spacing_width) in mm.
                              Defaults to (1.0, 1.0, 1.0) isotropic.
            threshold: Probability threshold for lesion class (when evaluating binary channel).

        Returns:
            dict containing:
                - 'mask': 3D binary tensor [Depth, Height, Width] (uint8: 0=bg, 1=lesion)
                - 'lesion_volume_cm3': float total lesion volume in cm³
                - 'lesion_voxel_count': int total segmented lesion voxels
                - 'logits': 5D tensor [1, out_channels, D, H, W]
                - 'probabilities': 5D tensor [1, out_channels, D, H, W]
        """
        if ct_tensor.ndim != 5:
            raise ValueError(f"Expected 5D tensor [B, C, D, H, W], got shape {list(ct_tensor.shape)}")

        self.eval()
        with torch.inference_mode():
            logits = self.forward(ct_tensor)  # [1, 2, D, H, W]
            probs = F.softmax(logits, dim=1)

            # Class 1 is lesion / tumor, Class 0 is background / parenchyma
            lesion_prob = probs[:, 1]  # [1, D, H, W]
            binary_mask = (lesion_prob > threshold).to(torch.uint8).squeeze(0)  # [D, H, W]

            lesion_voxel_count = int(binary_mask.sum().item())

            # 1 mm³ = 10^-3 cm³ = 0.001 cm³
            voxel_volume_mm3 = voxel_spacing_mm[0] * voxel_spacing_mm[1] * voxel_spacing_mm[2]
            voxel_volume_cm3 = voxel_volume_mm3 / 1000.0
            lesion_volume_cm3 = round(lesion_voxel_count * voxel_volume_cm3, 4)

            return {
                "mask": binary_mask,
                "lesion_volume_cm3": lesion_volume_cm3,
                "lesion_voxel_count": lesion_voxel_count,
                "logits": logits,
                "probabilities": probs,
            }


def build_segmentation_model(
    feature_size: int = 48,
    checkpoint_path: Optional[str] = None,
    device: Optional[torch.device] = None,
) -> LiverSwinUNETRSegmentor:
    """Helper factory to instantiate and optionally load weights for LiverSwinUNETRSegmentor."""
    dev = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = LiverSwinUNETRSegmentor(feature_size=feature_size).to(dev)

    if checkpoint_path is not None:
        checkpoint = torch.load(checkpoint_path, map_location=dev, weights_only=True)
        state_dict = checkpoint["model"] if "model" in checkpoint else checkpoint
        model.load_state_dict(state_dict)

    return model
