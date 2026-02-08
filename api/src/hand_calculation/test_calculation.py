from src.hand_calculation.calculation import (
    evaluate_hand,
    tile_code_to_34,
    tile_codes_to_136,
)
from src.hand_calculation.schemas import HandEvaluationRequest


class TestTileCodeTo34:
    def test_man_tiles(self):
        assert tile_code_to_34("1m") == 0
        assert tile_code_to_34("9m") == 8

    def test_pin_tiles(self):
        assert tile_code_to_34("1p") == 9
        assert tile_code_to_34("9p") == 17

    def test_sou_tiles(self):
        assert tile_code_to_34("1s") == 18
        assert tile_code_to_34("9s") == 26

    def test_honor_tiles(self):
        assert tile_code_to_34("1z") == 27  # east
        assert tile_code_to_34("7z") == 33  # chun

    def test_red_five_maps_to_five(self):
        assert tile_code_to_34("0m") == tile_code_to_34("5m")
        assert tile_code_to_34("0p") == tile_code_to_34("5p")
        assert tile_code_to_34("0s") == tile_code_to_34("5s")


class TestTileCodesTo136:
    def test_simple_hand(self):
        codes = ["1m", "2m", "3m"]
        result = tile_codes_to_136(codes)
        assert result == [0, 4, 8]

    def test_duplicate_tiles(self):
        codes = ["1m", "1m", "1m"]
        result = tile_codes_to_136(codes)
        assert result == [0, 1, 2]

    def test_red_five_man(self):
        result = tile_codes_to_136(["0m"])
        assert result == [16]

    def test_red_five_pin(self):
        result = tile_codes_to_136(["0p"])
        assert result == [52]

    def test_red_five_sou(self):
        result = tile_codes_to_136(["0s"])
        assert result == [88]

    def test_regular_five_skips_red_index(self):
        # Regular 5m should get index 17 (not 16, which is red)
        result = tile_codes_to_136(["5m"])
        assert result == [17]

    def test_red_and_regular_five(self):
        result = tile_codes_to_136(["0m", "5m"])
        assert result == [16, 17]

    def test_honor_tiles(self):
        codes = ["1z", "1z", "1z"]
        result = tile_codes_to_136(codes)
        # 1z = 34-index 27, base 136 = 108
        assert result == [108, 109, 110]


class TestEvaluateHand:
    def test_yakuhai_hand(self):
        # East triplet + sequences, ron on 9m
        request = HandEvaluationRequest(
            tiles=[
                "2m", "3m", "4m",
                "5p", "6p", "7p",
                "2s", "3s", "4s",
                "1z", "1z", "1z",
                "9m", "9m",
            ],
            win_tile_index=13,
            is_tsumo=False,
            seat_wind="east",
            round_wind="east",
            is_riichi=False,
        )
        result = evaluate_hand(request)
        assert result.error is None
        assert result.han is not None
        assert result.han >= 2  # double east
        assert result.fu is not None
        assert result.cost is not None
        assert result.cost.main > 0
        yaku_names = [y.name for y in result.yaku]
        assert any("Yakuhai" in name for name in yaku_names)

    def test_riichi_adds_han(self):
        request_no_riichi = HandEvaluationRequest(
            tiles=[
                "2m", "3m", "4m",
                "5p", "6p", "7p",
                "2s", "3s", "4s",
                "1z", "1z", "1z",
                "9m", "9m",
            ],
            win_tile_index=13,
            is_tsumo=False,
            seat_wind="east",
            round_wind="east",
            is_riichi=False,
        )
        request_riichi = HandEvaluationRequest(
            tiles=[
                "2m", "3m", "4m",
                "5p", "6p", "7p",
                "2s", "3s", "4s",
                "1z", "1z", "1z",
                "9m", "9m",
            ],
            win_tile_index=13,
            is_tsumo=False,
            seat_wind="east",
            round_wind="east",
            is_riichi=True,
        )
        result_no = evaluate_hand(request_no_riichi)
        result_yes = evaluate_hand(request_riichi)
        assert result_yes.han == result_no.han + 1

    def test_tsumo_hand(self):
        request = HandEvaluationRequest(
            tiles=[
                "2m", "3m", "4m",
                "5p", "6p", "7p",
                "2s", "3s", "4s",
                "1z", "1z", "1z",
                "9m", "9m",
            ],
            win_tile_index=13,
            is_tsumo=True,
            seat_wind="south",
            round_wind="east",
            is_riichi=False,
        )
        result = evaluate_hand(request)
        assert result.error is None
        yaku_names = [y.name for y in result.yaku]
        assert "Menzen Tsumo" in yaku_names

    def test_no_yaku_returns_error(self):
        # A hand with no yaku: mixed sequences, no special conditions
        request = HandEvaluationRequest(
            tiles=[
                "1m", "2m", "3m",
                "4p", "5p", "6p",
                "1s", "2s", "3s",
                "4m", "5m", "6m",
                "8s", "8s",
            ],
            win_tile_index=13,
            is_tsumo=False,
            seat_wind="south",
            round_wind="east",
            is_riichi=False,
        )
        result = evaluate_hand(request)
        assert result.error is not None
        assert result.han is None

    def test_red_five_gives_aka_dora(self):
        # Hand with red five
        request = HandEvaluationRequest(
            tiles=[
                "2m", "3m", "4m",
                "0p", "6p", "7p",
                "2s", "3s", "4s",
                "1z", "1z", "1z",
                "9m", "9m",
            ],
            win_tile_index=13,
            is_tsumo=False,
            seat_wind="east",
            round_wind="east",
            is_riichi=False,
        )
        result = evaluate_hand(request)
        assert result.error is None
        yaku_names = [y.name for y in result.yaku]
        assert "Aka Dora" in yaku_names

    def test_different_winds(self):
        request = HandEvaluationRequest(
            tiles=[
                "2m", "3m", "4m",
                "5p", "6p", "7p",
                "2s", "3s", "4s",
                "2z", "2z", "2z",
                "9m", "9m",
            ],
            win_tile_index=13,
            is_tsumo=False,
            seat_wind="south",
            round_wind="south",
            is_riichi=False,
        )
        result = evaluate_hand(request)
        assert result.error is None
        assert result.han >= 2  # double south
