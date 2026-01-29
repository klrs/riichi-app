from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile

from src.tile_detection import (
    DetectedTileResponse,
    TileDetectionResponse,
    decode_image,
    detect_tiles,
    load_model,
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model()
    yield


app = FastAPI(lifespan=lifespan)


@app.post("/detect", response_model=TileDetectionResponse)
async def detect(file: UploadFile) -> TileDetectionResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type: {file.content_type}. "
            f"Allowed types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    image_bytes = await file.read()

    try:
        image = decode_image(image_bytes)
    except ValueError:
        raise HTTPException(status_code=400, detail="Failed to decode image")

    tiles = detect_tiles(app.state.model, image)

    response_tiles = [
        DetectedTileResponse(
            code=tile.code,
            confidence=tile.confidence,
            bbox=tile.bbox,
            name=tile.name,
            is_red_five=tile.is_red_five,
            is_back=tile.is_back,
            suit=tile.suit.value if tile.suit else None,
            number=tile.number,
        )
        for tile in tiles
    ]

    return TileDetectionResponse(tiles=response_tiles, count=len(response_tiles))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
