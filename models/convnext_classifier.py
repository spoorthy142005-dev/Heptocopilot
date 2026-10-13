"""Train and run ConvNeXt-Small for liver lesion pathology classification."""

from __future__ import annotations

import argparse
import base64
import io
import json
from pathlib import Path
from typing import Any


CLASS_NAMES = ("HCC", "Benign Hemangioma", "Metastasis")
IMAGE_SIZE = 224


def build_model(pretrained: bool = True) -> Any:
    from torch import nn
    from torchvision import models

    weights = models.ConvNeXt_Small_Weights.DEFAULT if pretrained else None
    model = models.convnext_small(weights=weights)
    model.classifier[2] = nn.Linear(model.classifier[2].in_features, len(CLASS_NAMES))
    return model


def image_transforms(train: bool) -> Any:
    from torchvision import transforms

    operations = [transforms.Resize((IMAGE_SIZE, IMAGE_SIZE))]
    if train:
        operations.extend((transforms.RandomHorizontalFlip(), transforms.RandomRotation(8)))
    operations.extend((transforms.ToTensor(), transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225))))
    return transforms.Compose(operations)


def validate_classes(classes: list[str]) -> None:
    if tuple(classes) != CLASS_NAMES:
        raise ValueError(f"Expected class folders in this order: {', '.join(CLASS_NAMES)}; found: {classes}")


def train(args: argparse.Namespace) -> None:
    import torch
    from torch import nn
    from torch.utils.data import DataLoader
    from torchvision import datasets

    device = torch.device(args.device or ("cuda" if torch.cuda.is_available() else "cpu"))
    train_data = datasets.ImageFolder(Path(args.data) / "train", transform=image_transforms(train=True))
    validate_classes(train_data.classes)
    validation_path = Path(args.data) / "val"
    validation_data = datasets.ImageFolder(validation_path, transform=image_transforms(train=False))
    validate_classes(validation_data.classes)

    train_loader = DataLoader(train_data, batch_size=args.batch_size, shuffle=True, num_workers=args.workers)
    validation_loader = DataLoader(validation_data, batch_size=args.batch_size, shuffle=False, num_workers=args.workers)
    model = build_model(pretrained=not args.no_pretrained).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=0.05)
    best_accuracy = -1.0

    for epoch in range(args.epochs):
        model.train()
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            criterion(model(images), labels).backward()
            optimizer.step()

        accuracy = evaluate(model, validation_loader, device)
        print(f"epoch {epoch + 1}/{args.epochs}: validation accuracy={accuracy:.4f}")
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            checkpoint = {"model": model.state_dict(), "classes": list(CLASS_NAMES), "accuracy": accuracy}
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            torch.save(checkpoint, args.output)


def evaluate(model: Any, loader: Any, device: Any) -> float:
    import torch

    model.eval()
    correct = total = 0
    with torch.inference_mode():
        for images, labels in loader:
            predictions = model(images.to(device)).argmax(dim=1).cpu()
            correct += int((predictions == labels).sum())
            total += labels.numel()
    return correct / total if total else 0.0


def predict(args: argparse.Namespace) -> None:
    import torch
    import torch.nn.functional as functional
    import numpy as np
    from PIL import Image

    device = torch.device(args.device or ("cuda" if torch.cuda.is_available() else "cpu"))
    checkpoint = torch.load(args.checkpoint, map_location=device, weights_only=True)
    classes = tuple(checkpoint.get("classes", ()))
    if classes != CLASS_NAMES:
        raise ValueError(f"Checkpoint classes must be {CLASS_NAMES}; found {classes}")
    model = build_model(pretrained=False)
    model.load_state_dict(checkpoint["model"])
    model.to(device).eval()
    original = Image.open(args.image).convert("RGB")
    image = image_transforms(train=False)(original).unsqueeze(0).to(device)
    activations = []
    gradients = []

    def capture_features(_, __, output):
        activations.append(output)
        output.register_hook(lambda gradient: gradients.append(gradient))

    hook = model.features[-1].register_forward_hook(capture_features)
    model.zero_grad(set_to_none=True)
    probabilities_tensor = model(image).softmax(dim=1)[0]
    class_index = int(probabilities_tensor.argmax())
    probabilities_tensor[class_index].backward()
    hook.remove()
    probabilities = probabilities_tensor.detach().cpu()
    feature_map = activations[0].detach()
    gradient_map = gradients[0].detach()
    weights = gradient_map.mean(dim=(2, 3), keepdim=True)
    heatmap = functional.relu((weights * feature_map).sum(dim=1, keepdim=True))
    heatmap = functional.interpolate(heatmap, size=(IMAGE_SIZE, IMAGE_SIZE), mode="bilinear", align_corners=False)[0, 0]
    heatmap = heatmap / heatmap.max().clamp_min(1e-8)
    gradcam = encode_gradcam(original, heatmap.cpu().numpy(), np)
    result = {name: round(float(probability), 6) for name, probability in zip(CLASS_NAMES, probabilities)}
    result["prediction"] = max(result, key=result.get)
    result["gradcam"] = gradcam
    print(json.dumps(result, indent=2))


def encode_gradcam(image: Any, heatmap: Any, numpy: Any) -> str:
    from PIL import Image

    base = image.resize((IMAGE_SIZE, IMAGE_SIZE))
    colors = numpy.zeros((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=numpy.uint8)
    colors[..., 0] = (255 * heatmap).astype(numpy.uint8)
    colors[..., 1] = (180 * heatmap).astype(numpy.uint8)
    overlay = Image.blend(base, Image.fromarray(colors, mode="RGB"), 0.45)
    buffer = io.BytesIO()
    overlay.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    train_parser = subparsers.add_parser("train", help="Train on data/train and data/val class folders")
    train_parser.add_argument("--data", required=True)
    train_parser.add_argument("--output", default="models/checkpoints/convnext_small_pathology.pt")
    train_parser.add_argument("--epochs", type=int, default=20)
    train_parser.add_argument("--batch-size", type=int, default=16)
    train_parser.add_argument("--learning-rate", type=float, default=1e-4)
    train_parser.add_argument("--workers", type=int, default=2)
    train_parser.add_argument("--device")
    train_parser.add_argument("--no-pretrained", action="store_true")
    train_parser.set_defaults(handler=train)
    predict_parser = subparsers.add_parser("predict", help="Classify one lesion image")
    predict_parser.add_argument("--image", required=True)
    predict_parser.add_argument("--checkpoint", required=True)
    predict_parser.add_argument("--device")
    predict_parser.set_defaults(handler=predict)
    return parser


if __name__ == "__main__":
    arguments = build_parser().parse_args()
    arguments.handler(arguments)