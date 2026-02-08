from typing import Literal

from pydantic import BaseModel, Field


class MeldInfo(BaseModel):
    type: Literal["chi", "pon"]
    tiles: list[str] = Field(min_length=3, max_length=3)


class HandEvaluationRequest(BaseModel):
    tiles: list[str] = Field(min_length=14, max_length=14)
    win_tile_index: int = Field(ge=0, le=13)
    is_tsumo: bool
    seat_wind: Literal["east", "south", "west", "north"]
    round_wind: Literal["east", "south", "west", "north"]
    is_riichi: bool
    melds: list[MeldInfo] = Field(default_factory=list)


class YakuResult(BaseModel):
    name: str
    han_value: int
    is_yakuman: bool


class CostResult(BaseModel):
    main: int
    additional: int


class HandEvaluationResponse(BaseModel):
    han: int | None
    fu: int | None
    yaku: list[YakuResult] | None
    cost: CostResult | None
    error: str | None
