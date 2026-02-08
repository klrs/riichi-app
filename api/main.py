from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import APIRouter, FastAPI, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.hand_calculation import (
    HandEvaluationRequest,
    HandEvaluationResponse,
    evaluate_hand,
)
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

# API router with /api prefix
api_router = APIRouter(prefix="/api")

@api_router.post("/detect", response_model=TileDetectionResponse)
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
            is_rotated=tile.is_rotated,
        )
        for tile in tiles
    ]

    return TileDetectionResponse(tiles=response_tiles, count=len(response_tiles))


@api_router.post("/hand/evaluate", response_model=HandEvaluationResponse)
async def hand_evaluate(request: HandEvaluationRequest) -> HandEvaluationResponse:
    return evaluate_hand(request)


@api_router.get("/up")
async def health_check():
    return {"status": "ok"}

app.include_router(api_router)

# Serve static frontend (only if static dir exists, i.e., in Docker)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    # Serve assets with caching
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    # SPA fallback - serve index.html for all other routes
    @app.get("/{path:path}")
    async def serve_spa(path: str) -> FileResponse:
        file_path = static_dir / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
