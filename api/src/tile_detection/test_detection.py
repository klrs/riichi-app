from unittest.mock import MagicMock

import cv2
import numpy as np
import pytest

from src.tile import DetectedTile
from src.tile_detection.detection import decode_image, detect_tiles, sort_tiles


class TestDecodeImage:
    def test_decode_valid_png(self):
        # Create a simple 10x10 red image
        image = np.zeros((10, 10, 3), dtype=np.uint8)
        image[:, :] = [0, 0, 255]  # BGR red

        # Encode to PNG bytes
        _, buffer = cv2.imencode(".png", image)
        image_bytes = buffer.tobytes()

        # Decode and verify
        result = decode_image(image_bytes)
        assert result.shape == (10, 10, 3)
        assert result.dtype == np.uint8

    def test_decode_valid_jpeg(self):
        # Create a simple 10x10 green image
        image = np.zeros((10, 10, 3), dtype=np.uint8)
        image[:, :] = [0, 255, 0]  # BGR green

        # Encode to JPEG bytes
        _, buffer = cv2.imencode(".jpg", image)
        image_bytes = buffer.tobytes()

        # Decode and verify
        result = decode_image(image_bytes)
        assert result.shape == (10, 10, 3)
        assert result.dtype == np.uint8

    def test_decode_invalid_bytes_raises(self):
        invalid_bytes = b"not an image"
        with pytest.raises(ValueError, match="Failed to decode image"):
            decode_image(invalid_bytes)

    def test_decode_empty_bytes_raises(self):
        with pytest.raises(ValueError, match="Failed to decode image"):
            decode_image(b"")

    def test_decode_truncated_image_raises(self):
        # Create valid image bytes then truncate
        image = np.zeros((10, 10, 3), dtype=np.uint8)
        _, buffer = cv2.imencode(".png", image)
        image_bytes = buffer.tobytes()

        # Truncate to first 10 bytes
        truncated = image_bytes[:10]
        with pytest.raises(ValueError, match="Failed to decode image"):
            decode_image(truncated)


class TestDetectTiles:
    def _create_mock_box(self, cls_id: int, conf: float, xyxy: list[int]):
        """Create a mock box object that mimics YOLO box structure."""
        box = MagicMock()
        box.cls = [cls_id]
        box.conf = [conf]
        box.xyxy = [MagicMock()]
        box.xyxy[0].tolist.return_value = xyxy
        return box

    def _create_mock_result(self, boxes: list, names: dict):
        """Create a mock result object that mimics YOLO result structure."""
        result = MagicMock()
        result.boxes = boxes
        result.names = names
        return result

    def test_detect_single_tile(self):
        mock_model = MagicMock()
        mock_box = self._create_mock_box(0, 0.95, [10, 20, 30, 40])
        mock_result = self._create_mock_result([mock_box], {0: "1m"})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 1
        assert tiles[0].code == "1m"
        assert tiles[0].confidence == 0.95
        assert tiles[0].bbox == (10, 20, 30, 40)

    def test_detect_multiple_tiles(self):
        mock_model = MagicMock()
        mock_box1 = self._create_mock_box(0, 0.95, [10, 20, 30, 40])
        mock_box2 = self._create_mock_box(1, 0.88, [50, 20, 70, 40])
        mock_box3 = self._create_mock_box(2, 0.92, [90, 20, 110, 40])
        mock_result = self._create_mock_result(
            [mock_box1, mock_box2, mock_box3], {0: "1m", 1: "2m", 2: "3m"}
        )
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 200, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 3
        assert tiles[0].code == "1m"
        assert tiles[1].code == "2m"
        assert tiles[2].code == "3m"

    def test_detect_no_tiles(self):
        mock_model = MagicMock()
        mock_result = self._create_mock_result([], {})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 0

    def test_detect_red_five(self):
        mock_model = MagicMock()
        mock_box = self._create_mock_box(0, 0.99, [0, 0, 50, 70])
        mock_result = self._create_mock_result([mock_box], {0: "0p"})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 1
        assert tiles[0].code == "0p"
        assert tiles[0].is_red_five is True

    def test_detect_back_tile(self):
        mock_model = MagicMock()
        mock_box = self._create_mock_box(0, 0.97, [0, 0, 50, 70])
        mock_result = self._create_mock_result([mock_box], {0: "0z"})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 1
        assert tiles[0].code == "0z"
        assert tiles[0].is_back is True

    def test_detect_honor_tile(self):
        mock_model = MagicMock()
        mock_box = self._create_mock_box(0, 0.93, [0, 0, 50, 70])
        mock_result = self._create_mock_result([mock_box], {0: "7z"})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 1
        assert tiles[0].code == "7z"
        assert tiles[0].name == "CHUN"

    def test_detect_rotated_tile(self):
        """A tile with landscape bbox (wider than tall) should be detected as rotated."""
        mock_model = MagicMock()
        # Landscape bbox: width=70, height=50 → rotated
        mock_box = self._create_mock_box(0, 0.95, [10, 20, 80, 70])
        mock_result = self._create_mock_result([mock_box], {0: "1m"})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 1
        assert tiles[0].is_rotated is True

    def test_detect_upright_tile(self):
        """A tile with portrait bbox (taller than wide) should not be detected as rotated."""
        mock_model = MagicMock()
        # Portrait bbox: width=20, height=20 → not rotated
        mock_box = self._create_mock_box(0, 0.95, [10, 20, 30, 40])
        mock_result = self._create_mock_result([mock_box], {0: "1m"})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert len(tiles) == 1
        assert tiles[0].is_rotated is False

    def test_returns_detected_tile_instances(self):
        mock_model = MagicMock()
        mock_box = self._create_mock_box(0, 0.95, [10, 20, 30, 40])
        mock_result = self._create_mock_result([mock_box], {0: "1m"})
        mock_model.return_value = [mock_result]

        image = np.zeros((100, 100, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)

        assert all(isinstance(tile, DetectedTile) for tile in tiles)


class TestSortTiles:
    def _tile(self, code: str, bbox: tuple[int, int, int, int]) -> DetectedTile:
        return DetectedTile(code=code, confidence=0.9, bbox=bbox)

    def test_empty_list(self):
        assert sort_tiles([]) == []

    def test_single_tile(self):
        tile = self._tile("1m", (10, 100, 50, 200))
        assert sort_tiles([tile]) == [tile]

    def test_row_aligned_sorts_by_x(self):
        """Tiles in a horizontal row should be sorted left-to-right."""
        t1 = self._tile("3m", (300, 100, 350, 200))
        t2 = self._tile("1m", (100, 105, 150, 205))
        t3 = self._tile("2m", (200, 102, 250, 202))
        result = sort_tiles([t1, t2, t3])
        assert [t.code for t in result] == ["1m", "2m", "3m"]

    def test_scattered_falls_back_to_suit_order(self):
        """Tiles spread across the image should be sorted by suit then number."""
        t1 = self._tile("7z", (100, 500, 150, 600))
        t2 = self._tile("1m", (400, 100, 450, 200))
        t3 = self._tile("5s", (200, 300, 250, 400))
        result = sort_tiles([t1, t2, t3])
        assert [t.code for t in result] == ["1m", "5s", "7z"]

    def test_suit_order_ascending(self):
        """Within suit fallback: m < p < s < z, then by number."""
        t1 = self._tile("3p", (100, 500, 150, 600))
        t2 = self._tile("1p", (200, 100, 250, 200))
        t3 = self._tile("9m", (300, 300, 350, 400))
        result = sort_tiles([t1, t2, t3])
        assert [t.code for t in result] == ["9m", "1p", "3p"]

    def test_red_five_sorts_as_five(self):
        """Red fives (0m/0p/0s) should sort at position 5 in their suit."""
        t1 = self._tile("6m", (100, 500, 150, 600))
        t2 = self._tile("0m", (200, 100, 250, 200))
        t3 = self._tile("4m", (300, 300, 350, 400))
        result = sort_tiles([t1, t2, t3])
        assert [t.code for t in result] == ["4m", "0m", "6m"]

    def test_detect_tiles_returns_sorted(self):
        """detect_tiles should return sorted results."""
        mock_model = MagicMock()
        # Create boxes out of x-order but in a row (same y)
        box1 = MagicMock()
        box1.cls = [0]
        box1.conf = [0.9]
        box1.xyxy = [MagicMock()]
        box1.xyxy[0].tolist.return_value = [300, 100, 350, 200]

        box2 = MagicMock()
        box2.cls = [1]
        box2.conf = [0.9]
        box2.xyxy = [MagicMock()]
        box2.xyxy[0].tolist.return_value = [100, 100, 150, 200]

        result = MagicMock()
        result.boxes = [box1, box2]
        result.names = {0: "5p", 1: "1m"}
        mock_model.return_value = [result]

        image = np.zeros((300, 400, 3), dtype=np.uint8)
        tiles = detect_tiles(mock_model, image)
        assert [t.code for t in tiles] == ["1m", "5p"]
