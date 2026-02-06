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


def _tiles_are_row_aligned(tiles: list[DetectedTile]) -> bool:
    """Check if tiles are roughly aligned in a horizontal row.

    Compares the vertical spread of tile centers against typical tile height.
    If the spread is less than the median tile height, they're in a row.
    """
    if len(tiles) <= 1:
        return True

    centers_y = [(t.bbox[1] + t.bbox[3]) / 2 for t in tiles]
    heights = [t.bbox[3] - t.bbox[1] for t in tiles]
    median_height = sorted(heights)[len(heights) // 2]

    y_spread = max(centers_y) - min(centers_y)
    return y_spread <= median_height


_SUIT_ORDER = {"m": 0, "p": 1, "s": 2, "z": 3}


def _suit_sort_key(tile: DetectedTile) -> tuple[int, int]:
    """Sort key for suit-based ascending order."""
    suit_char = tile.code[-1]
    number = int(tile.code[:-1])
    # Red fives (0m/0p/0s) sort as 5 but before regular 5
    if number == 0:
        return (_SUIT_ORDER.get(suit_char, 99), 5)
    return (_SUIT_ORDER.get(suit_char, 99), number)


def sort_tiles(tiles: list[DetectedTile]) -> list[DetectedTile]:
    """Sort detected tiles for display.

    If tiles are roughly in a horizontal row, sort left-to-right by x-position.
    Otherwise fall back to suit-based ascending order.
    """
    if len(tiles) <= 1:
        return list(tiles)

    if _tiles_are_row_aligned(tiles):
        return sorted(tiles, key=lambda t: t.bbox[0])

    return sorted(tiles, key=_suit_sort_key)


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

    return sort_tiles(tiles)
