import pytest
from pydantic import ValidationError

from src.hand_calculation.schemas import HandEvaluationRequest


def test_valid_request():
    req = HandEvaluationRequest(
        tiles=["1m"] * 14,
        win_tile_index=0,
        is_tsumo=False,
        seat_wind="east",
        round_wind="east",
        is_riichi=False,
    )
    assert len(req.tiles) == 14
    assert req.win_tile_index == 0


def test_too_few_tiles():
    with pytest.raises(ValidationError):
        HandEvaluationRequest(
            tiles=["1m"] * 13,
            win_tile_index=0,
            is_tsumo=False,
            seat_wind="east",
            round_wind="east",
            is_riichi=False,
        )


def test_too_many_tiles():
    with pytest.raises(ValidationError):
        HandEvaluationRequest(
            tiles=["1m"] * 15,
            win_tile_index=0,
            is_tsumo=False,
            seat_wind="east",
            round_wind="east",
            is_riichi=False,
        )


def test_win_tile_index_out_of_range():
    with pytest.raises(ValidationError):
        HandEvaluationRequest(
            tiles=["1m"] * 14,
            win_tile_index=14,
            is_tsumo=False,
            seat_wind="east",
            round_wind="east",
            is_riichi=False,
        )


def test_invalid_wind():
    with pytest.raises(ValidationError):
        HandEvaluationRequest(
            tiles=["1m"] * 14,
            win_tile_index=0,
            is_tsumo=False,
            seat_wind="northeast",
            round_wind="east",
            is_riichi=False,
        )
