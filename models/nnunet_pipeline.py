"""Prepare, train, and run nnU-Net v2 on 3D CT liver/tissue volumes."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def parse_labels(value: str) -> dict[str, int]:
    labels = {}
    for item in value.split(","):
        name, number = item.split(":", 1)
        labels[name.strip()] = int(number)
    if "background" not in labels or labels["background"] != 0:
        raise ValueError("labels must include background:0")
    return labels


def case_id(path: Path) -> str:
    name = path.name
    return name[:-7] if name.endswith(".nii.gz") else path.stem


def copy_image(source: Path, destination: Path, identifier: str) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination / f"{identifier}_0000.nii.gz")


def prepare_dataset(args: argparse.Namespace) -> None:
    images = sorted(Path(args.images).glob("*.nii.gz"))
    labels_dir = Path(args.labels) if args.labels else None
    if not images:
        raise FileNotFoundError(f"No .nii.gz CT volumes found in {args.images}")
    if labels_dir and not labels_dir.exists():
        raise FileNotFoundError(f"Labels directory does not exist: {labels_dir}")

    dataset_dir = Path(args.nnunet_raw) / f"Dataset{args.dataset_id:03d}_{args.dataset_name}"
    images_tr = dataset_dir / "imagesTr"
    labels_tr = dataset_dir / "labelsTr"
    images_ts = dataset_dir / "imagesTs"
    for directory in (images_tr, labels_tr, images_ts):
        directory.mkdir(parents=True, exist_ok=True)

    training_cases = []
    test_cases = []
    for image in images:
        identifier = case_id(image)
        label = labels_dir / image.name if labels_dir else None
        if label and label.exists():
            copy_image(image, images_tr, identifier)
            shutil.copy2(label, labels_tr / f"{identifier}.nii.gz")
            training_cases.append({"label": f"./labelsTr/{identifier}.nii.gz", "image": [f"./imagesTr/{identifier}_0000.nii.gz"], "name": identifier})
        elif args.test_images:
            copy_image(image, images_ts, identifier)
            test_cases.append({"image": [f"./imagesTs/{identifier}_0000.nii.gz"], "name": identifier})
        else:
            raise FileNotFoundError(f"No matching label for training case {image.name}")

    dataset_json = {
        "channel_names": {"0": "CT"},
        "labels": parse_labels(args.labels_map),
        "numTraining": len(training_cases),
        "file_ending": ".nii.gz",
        "name": args.dataset_name,
        "description": "3D CT liver and tissue segmentation with nnU-Net v2",
        "reference": "",
        "licence": "",
        "release": "1.0",
        "overwrite_image_reader_writer": "",
        "training": training_cases,
        "test": test_cases,
    }
    (dataset_dir / "dataset.json").write_text(json.dumps(dataset_json, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(training_cases)} training and {len(test_cases)} test cases in {dataset_dir}")


def run(command: list[str], env: dict[str, str]) -> None:
    print("$", " ".join(command))
    subprocess.run(command, check=True, env=env)


def nnunet_env(args: argparse.Namespace) -> dict[str, str]:
    env = os.environ.copy()
    scripts_dir = str(Path(sys.executable).parent / "Scripts")
    env["PATH"] = scripts_dir + os.pathsep + env.get("PATH", "")
    env["nnUNet_raw"] = str(Path(args.nnunet_raw).resolve())
    env["nnUNet_preprocessed"] = str(Path(args.nnunet_preprocessed).resolve())
    env["nnUNet_results"] = str(Path(args.nnunet_results).resolve())
    return env


def train(args: argparse.Namespace) -> None:
    env = nnunet_env(args)
    run(["nnUNetv2_plan_and_preprocess", "-d", str(args.dataset_id), "--verify_dataset_integrity", "-c", "3d_fullres"], env)
    run(["nnUNetv2_train", str(args.dataset_id), "3d_fullres", str(args.fold), "--npz"], env)


def predict(args: argparse.Namespace) -> None:
    env = nnunet_env(args)
    run(["nnUNetv2_predict", "-i", str(Path(args.input).resolve()), "-o", str(Path(args.output).resolve()), "-d", str(args.dataset_id), "-c", "3d_fullres", "-f", str(args.fold)], env)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare = subparsers.add_parser("prepare", help="Convert CT volumes and masks to nnU-Net format")
    prepare.add_argument("--images", required=True, help="Directory of .nii.gz CT volumes")
    prepare.add_argument("--labels", help="Directory of matching .nii.gz masks")
    prepare.add_argument("--test-images", action="store_true", help="Copy volumes without masks to imagesTs")
    prepare.add_argument("--nnunet-raw", default="nnUNet_raw")
    prepare.add_argument("--dataset-id", type=int, default=501)
    prepare.add_argument("--dataset-name", default="LiverTissueCT")
    prepare.add_argument("--labels-map", default="background:0,liver:1,tissue:2")
    prepare.set_defaults(handler=prepare_dataset)

    for name, handler in (("train", train), ("predict", predict)):
        command = subparsers.add_parser(name)
        command.add_argument("--dataset-id", type=int, default=501)
        command.add_argument("--fold", default="0")
        command.add_argument("--nnunet-raw", default="nnUNet_raw")
        command.add_argument("--nnunet-preprocessed", default="nnUNet_preprocessed")
        command.add_argument("--nnunet-results", default="nnUNet_results")
        if name == "predict":
            command.add_argument("--input", required=True, help="nnU-Net imagesTs directory")
            command.add_argument("--output", required=True, help="Prediction output directory")
        command.set_defaults(handler=handler)
    return parser


if __name__ == "__main__":
    arguments = build_parser().parse_args()
    arguments.handler(arguments)