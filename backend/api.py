"""Local API bridge between the HepatoCopilot frontend and model workflows."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


ROOT = Path(__file__).resolve().parent.parent
CLASSIFIER = ROOT / "models" / "convnext_classifier.py"
CHECKPOINT = ROOT / "models" / "checkpoints" / "convnext_small_pathology.pt"
app = FastAPI(title="HepatoCopilot model API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


async def save_upload(upload: UploadFile, destination: Path) -> None:
    if not upload.filename:
        raise HTTPException(400, "A file is required")
    with destination.open("wb") as target:
        shutil.copyfileobj(upload.file, target)


@app.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True, "classifier_checkpoint": CHECKPOINT.exists()}


@app.post("/api/segment")
async def segment(ct_scan: UploadFile = File(...)) -> dict[str, object]:
    if not (ct_scan.filename or "").lower().endswith((".nii.gz", ".nii")):
        raise HTTPException(400, "Upload a NIfTI CT volume (.nii or .nii.gz)")
    with tempfile.TemporaryDirectory(prefix="hepatocopilot-segment-") as temp:
        folder = Path(temp)
        input_dir = folder / "input"
        output_dir = folder / "predictions"
        input_dir.mkdir()
        await save_upload(ct_scan, input_dir / f"case_0000.nii.gz")
        env = os.environ.copy()
        env.update({"nnUNet_raw": str(ROOT / "nnUNet_raw"), "nnUNet_preprocessed": str(ROOT / "nnUNet_preprocessed"), "nnUNet_results": str(ROOT / "nnUNet_results")})
        env["PATH"] = str(Path(sys.executable).parent / "Scripts") + os.pathsep + env.get("PATH", "")
        command = [sys.executable, str(ROOT / "models" / "nnunet_pipeline.py"), "predict", "--input", str(input_dir), "--output", str(output_dir)]
        try:
            subprocess.run(command, check=True, capture_output=True, text=True, env=env, cwd=ROOT)
        except subprocess.CalledProcessError as error:
            detail = error.stderr.strip() or error.stdout.strip() or "nnU-Net prediction failed"
            raise HTTPException(503, detail) from error
        predictions = list(output_dir.glob("*.nii.gz"))
        if not predictions:
            raise HTTPException(503, "nnU-Net returned no segmentation")
        return {"status": "complete", "mask": predictions[0].name}


@app.post("/api/classify")
async def classify(lesion_image: UploadFile = File(...)) -> dict[str, object]:
    if not CHECKPOINT.exists():
        raise HTTPException(503, "Train the ConvNeXt-Small checkpoint before classification")
    with tempfile.TemporaryDirectory(prefix="hepatocopilot-classify-") as temp:
        image_path = Path(temp) / (lesion_image.filename or "lesion.png")
        await save_upload(lesion_image, image_path)
        command = [sys.executable, str(CLASSIFIER), "predict", "--image", str(image_path), "--checkpoint", str(CHECKPOINT)]
        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True, cwd=ROOT)
        except subprocess.CalledProcessError as error:
            detail = error.stderr.strip() or error.stdout.strip() or "Classification failed"
            raise HTTPException(503, detail) from error
        import json
        return {"status": "complete", **json.loads(result.stdout)}