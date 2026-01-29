import pathlib

import cv2
import numpy as np
from ultralytics import YOLO

from src.tile import DetectedTile

# Patch WindowsPath for models trained on Windows
pathlib.WindowsPath = pathlib.PosixPath


def load_model(model_path: pathlib.Path | None = None) -> YOLO:
    if model_path is None:
        model_path = pathlib.Path(__file__).parent.parent.parent / "best.pt"
    return YOLO(model_path)


def decode_image(image_bytes: bytes) -> np.ndarray:
    if not image_bytes:
        raise ValueError("Failed to decode image")
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Failed to decode image")
    return image


def detect_tiles(model: YOLO, image: np.ndarray) -> list[DetectedTile]:
    results = model(image)
    tiles = []

    for result in results:
        if len(result.boxes) == 0:
            continue

        for box in result.boxes:
            cls_id = int(box.cls[0])
            code = result.names[cls_id]
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            tile = DetectedTile(
                code=code,
                confidence=confidence,
                bbox=(x1, y1, x2, y2),
            )
            tiles.append(tile)

    return tiles
