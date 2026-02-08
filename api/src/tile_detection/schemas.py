from pydantic import BaseModel


class DetectedTileResponse(BaseModel):
    code: str
    confidence: float
    bbox: tuple[int, int, int, int]
    name: str
    is_red_five: bool
    is_back: bool
    suit: str | None
    number: int | None
    is_rotated: bool


class TileDetectionResponse(BaseModel):
    tiles: list[DetectedTileResponse]
    count: int
