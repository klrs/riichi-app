import pytest

from src.tile import DetectedTile, Suit


class TestDetectedTileBasic:
    def test_create_tile(self):
        tile = DetectedTile(code="1m", confidence=0.95, bbox=(10, 20, 30, 40))
        assert tile.code == "1m"
        assert tile.confidence == 0.95
        assert tile.bbox == (10, 20, 30, 40)

    def test_tile_is_frozen(self):
        tile = DetectedTile(code="1m", confidence=0.95, bbox=(10, 20, 30, 40))
        with pytest.raises(AttributeError):
            tile.code = "2m"


class TestIsBack:
    def test_back_tile(self):
        tile = DetectedTile(code="0z", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.is_back is True

    def test_regular_tile_not_back(self):
        tile = DetectedTile(code="1m", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.is_back is False

    def test_red_five_not_back(self):
        tile = DetectedTile(code="0m", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.is_back is False


class TestIsRedFive:
    @pytest.mark.parametrize("code", ["0m", "0p", "0s"])
    def test_red_fives(self, code):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.is_red_five is True

    def test_regular_five_not_red(self):
        tile = DetectedTile(code="5m", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.is_red_five is False

    def test_back_not_red_five(self):
        tile = DetectedTile(code="0z", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.is_red_five is False


class TestSuit:
    @pytest.mark.parametrize(
        "code,expected_suit",
        [
            ("1m", Suit.MAN),
            ("9m", Suit.MAN),
            ("1p", Suit.PIN),
            ("9p", Suit.PIN),
            ("1s", Suit.SOU),
            ("9s", Suit.SOU),
            ("1z", Suit.HONOR),
            ("7z", Suit.HONOR),
        ],
    )
    def test_suit_for_regular_tiles(self, code, expected_suit):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.suit == expected_suit

    @pytest.mark.parametrize("code,expected_suit", [("0m", Suit.MAN), ("0p", Suit.PIN), ("0s", Suit.SOU)])
    def test_suit_for_red_fives(self, code, expected_suit):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.suit == expected_suit

    def test_suit_for_back_is_none(self):
        tile = DetectedTile(code="0z", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.suit is None


class TestNumber:
    @pytest.mark.parametrize("code,expected_num", [("1m", 1), ("5p", 5), ("9s", 9), ("3z", 3)])
    def test_number_for_regular_tiles(self, code, expected_num):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.number == expected_num

    @pytest.mark.parametrize("code", ["0m", "0p", "0s"])
    def test_red_five_returns_5(self, code):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.number == 5

    def test_back_returns_none(self):
        tile = DetectedTile(code="0z", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.number is None


class TestName:
    @pytest.mark.parametrize(
        "code,expected_name",
        [
            ("1m", "1 MAN"),
            ("5m", "5 MAN"),
            ("9m", "9 MAN"),
            ("1p", "1 PIN"),
            ("5p", "5 PIN"),
            ("9p", "9 PIN"),
            ("1s", "1 SOU"),
            ("5s", "5 SOU"),
            ("9s", "9 SOU"),
        ],
    )
    def test_numbered_suit_names(self, code, expected_name):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.name == expected_name

    @pytest.mark.parametrize(
        "code,expected_name",
        [
            ("1z", "EAST"),
            ("2z", "SOUTH"),
            ("3z", "WEST"),
            ("4z", "NORTH"),
            ("5z", "HAKU"),
            ("6z", "HATSU"),
            ("7z", "CHUN"),
        ],
    )
    def test_honor_names(self, code, expected_name):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.name == expected_name

    @pytest.mark.parametrize(
        "code,expected_name",
        [
            ("0m", "RED 5 MAN"),
            ("0p", "RED 5 PIN"),
            ("0s", "RED 5 SOU"),
        ],
    )
    def test_red_five_names(self, code, expected_name):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.name == expected_name

    def test_back_name(self):
        tile = DetectedTile(code="0z", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.name == "BACK"


class TestTo34:
    @pytest.mark.parametrize(
        "code,expected_index",
        [
            # Man: 0-8
            ("1m", 0),
            ("5m", 4),
            ("9m", 8),
            # Pin: 9-17
            ("1p", 9),
            ("5p", 13),
            ("9p", 17),
            # Sou: 18-26
            ("1s", 18),
            ("5s", 22),
            ("9s", 26),
            # Honors: 27-33
            ("1z", 27),  # East
            ("2z", 28),  # South
            ("3z", 29),  # West
            ("4z", 30),  # North
            ("5z", 31),  # Haku
            ("6z", 32),  # Hatsu
            ("7z", 33),  # Chun
        ],
    )
    def test_to_34_regular_tiles(self, code, expected_index):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_34() == expected_index

    @pytest.mark.parametrize(
        "code,expected_index",
        [
            ("0m", 4),  # Red 5 man → same as 5m
            ("0p", 13),  # Red 5 pin → same as 5p
            ("0s", 22),  # Red 5 sou → same as 5s
        ],
    )
    def test_to_34_red_fives(self, code, expected_index):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_34() == expected_index

    def test_to_34_back_returns_none(self):
        tile = DetectedTile(code="0z", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_34() is None


class TestTo136:
    @pytest.mark.parametrize(
        "code,expected_index",
        [
            ("1m", 0),
            ("1p", 36),
            ("1s", 72),
            ("1z", 108),
        ],
    )
    def test_to_136_first_copy(self, code, expected_index):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_136(copy_index=0) == expected_index

    def test_to_136_multiple_copies(self):
        tile = DetectedTile(code="1m", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_136(copy_index=0) == 0
        assert tile.to_136(copy_index=1) == 1
        assert tile.to_136(copy_index=2) == 2
        assert tile.to_136(copy_index=3) == 3

    def test_to_136_copy_index_capped_at_3(self):
        tile = DetectedTile(code="1m", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_136(copy_index=99) == 3

    @pytest.mark.parametrize(
        "code,expected_index",
        [
            ("0m", 16),  # FIVE_RED_MAN
            ("0p", 52),  # FIVE_RED_PIN
            ("0s", 88),  # FIVE_RED_SOU
        ],
    )
    def test_to_136_red_fives(self, code, expected_index):
        tile = DetectedTile(code=code, confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_136() == expected_index

    def test_to_136_red_five_ignores_copy_index(self):
        tile = DetectedTile(code="0m", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_136(copy_index=0) == 16
        assert tile.to_136(copy_index=1) == 16
        assert tile.to_136(copy_index=2) == 16

    def test_to_136_regular_five_skips_red_index(self):
        tile = DetectedTile(code="5m", confidence=0.9, bbox=(0, 0, 0, 0))
        # 5m base is 16, but 16 is red, so regular 5s are 17, 18, 19
        assert tile.to_136(copy_index=0) == 17
        assert tile.to_136(copy_index=1) == 18
        assert tile.to_136(copy_index=2) == 19

    def test_to_136_back_returns_none(self):
        tile = DetectedTile(code="0z", confidence=0.9, bbox=(0, 0, 0, 0))
        assert tile.to_136() is None
