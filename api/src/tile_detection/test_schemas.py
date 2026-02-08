import pytest
from pydantic import ValidationError

from src.tile_detection.schemas import DetectedTileResponse, TileDetectionResponse


class TestDetectedTileResponse:
    def test_create_valid_tile(self):
        tile = DetectedTileResponse(
            code="1m",
            confidence=0.95,
            bbox=(10, 20, 30, 40),
            name="1 MAN",
            is_red_five=False,
            is_back=False,
            is_rotated=False,
            suit="m",
            number=1,
        )
        assert tile.code == "1m"
        assert tile.confidence == 0.95
        assert tile.bbox == (10, 20, 30, 40)
        assert tile.name == "1 MAN"
        assert tile.is_red_five is False
        assert tile.is_back is False
        assert tile.is_rotated is False
        assert tile.suit == "m"
        assert tile.number == 1

    def test_create_red_five(self):
        tile = DetectedTileResponse(
            code="0p",
            confidence=0.88,
            bbox=(100, 200, 150, 280),
            name="RED 5 PIN",
            is_red_five=True,
            is_back=False,
            is_rotated=False,
            suit="p",
            number=5,
        )
        assert tile.code == "0p"
        assert tile.is_red_five is True
        assert tile.number == 5

    def test_create_back_tile(self):
        tile = DetectedTileResponse(
            code="0z",
            confidence=0.99,
            bbox=(0, 0, 50, 70),
            name="BACK",
            is_red_five=False,
            is_back=True,
            is_rotated=False,
            suit=None,
            number=None,
        )
        assert tile.is_back is True
        assert tile.suit is None
        assert tile.number is None

    def test_create_honor_tile(self):
        tile = DetectedTileResponse(
            code="1z",
            confidence=0.92,
            bbox=(50, 50, 100, 120),
            name="EAST",
            is_red_five=False,
            is_back=False,
            is_rotated=False,
            suit="z",
            number=1,
        )
        assert tile.code == "1z"
        assert tile.name == "EAST"
        assert tile.suit == "z"

    def test_missing_required_field_raises(self):
        with pytest.raises(ValidationError):
            DetectedTileResponse(
                code="1m",
                confidence=0.95,
                # missing bbox and other required fields
            )

    def test_invalid_bbox_type_raises(self):
        with pytest.raises(ValidationError):
            DetectedTileResponse(
                code="1m",
                confidence=0.95,
                bbox="invalid",
                name="1 MAN",
                is_red_five=False,
                is_back=False,
                suit="m",
                number=1,
            )


class TestTileDetectionResponse:
    def test_create_empty_response(self):
        response = TileDetectionResponse(tiles=[], count=0)
        assert response.tiles == []
        assert response.count == 0

    def test_create_response_with_tiles(self):
        tiles = [
            DetectedTileResponse(
                code="1m",
                confidence=0.95,
                bbox=(10, 20, 30, 40),
                name="1 MAN",
                is_red_five=False,
                is_back=False,
                is_rotated=False,
                suit="m",
                number=1,
            ),
            DetectedTileResponse(
                code="2m",
                confidence=0.90,
                bbox=(40, 20, 60, 40),
                name="2 MAN",
                is_red_five=False,
                is_back=False,
                is_rotated=False,
                suit="m",
                number=2,
            ),
        ]
        response = TileDetectionResponse(tiles=tiles, count=2)
        assert len(response.tiles) == 2
        assert response.count == 2
        assert response.tiles[0].code == "1m"
        assert response.tiles[1].code == "2m"

    def test_missing_tiles_raises(self):
        with pytest.raises(ValidationError):
            TileDetectionResponse(count=0)

    def test_missing_count_raises(self):
        with pytest.raises(ValidationError):
            TileDetectionResponse(tiles=[])
