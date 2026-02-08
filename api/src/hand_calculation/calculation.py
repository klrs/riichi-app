from mahjong.constants import EAST, NORTH, SOUTH, WEST
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules

from src.hand_calculation.schemas import (
    CostResult,
    HandEvaluationRequest,
    HandEvaluationResponse,
    YakuResult,
)

WIND_MAP = {
    "east": EAST,
    "south": SOUTH,
    "west": WEST,
    "north": NORTH,
}

# 136-format indices for red fives
RED_FIVE_136 = {"m": 16, "p": 52, "s": 88}

# Suit base offsets in 34-format
SUIT_BASE_34 = {"m": 0, "p": 9, "s": 18, "z": 27}


def tile_code_to_34(code: str) -> int:
    """Convert a tile code like '1m' or '0p' to a 34-format index."""
    num = int(code[:-1])
    suit = code[-1]
    if num == 0:
        num = 5  # red five → 5
    return SUIT_BASE_34[suit] + (num - 1)


def tile_codes_to_136(codes: list[str]) -> list[int]:
    """Convert a list of tile codes to 136-format indices.

    Tracks copy counts per tile type so duplicate tiles get unique indices.
    Red fives get the special red five index (16, 52, 88).
    Regular 5s skip the red five index.
    """
    copy_counts: dict[int, int] = {}
    result: list[int] = []

    for code in codes:
        num = int(code[:-1])
        suit = code[-1]
        is_red = num == 0

        if is_red:
            result.append(RED_FIVE_136[suit])
            continue

        idx_34 = tile_code_to_34(code)
        copy = copy_counts.get(idx_34, 0)
        copy_counts[idx_34] = copy + 1

        base_136 = idx_34 * 4

        # For regular 5 in numbered suits, skip index 0 (reserved for red five)
        if num == 5 and suit in ("m", "p", "s"):
            result.append(base_136 + 1 + min(copy, 2))
        else:
            result.append(base_136 + min(copy, 3))

    return result


_calculator = HandCalculator()


def evaluate_hand(request: HandEvaluationRequest) -> HandEvaluationResponse:
    """Evaluate a mahjong hand and return han, fu, yaku, and cost."""
    tiles_136 = tile_codes_to_136(request.tiles)
    win_tile_136 = tiles_136[request.win_tile_index]

    config = HandConfig(
        is_tsumo=request.is_tsumo,
        is_riichi=request.is_riichi,
        player_wind=WIND_MAP[request.seat_wind],
        round_wind=WIND_MAP[request.round_wind],
        options=OptionalRules(has_aka_dora=True),
    )

    result = _calculator.estimate_hand_value(tiles_136, win_tile_136, config=config)

    if result.error:
        return HandEvaluationResponse(
            han=None, fu=None, yaku=None, cost=None, error=result.error
        )

    yaku_list = [
        YakuResult(
            name=y.name,
            han_value=y.han_closed if y.han_closed else y.han_open,
            is_yakuman=y.is_yakuman,
        )
        for y in result.yaku
    ]

    cost = CostResult(
        main=result.cost["main"],
        additional=result.cost["additional"],
    )

    return HandEvaluationResponse(
        han=result.han,
        fu=result.fu,
        yaku=yaku_list,
        cost=cost,
        error=None,
    )
