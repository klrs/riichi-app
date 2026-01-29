import { useRef, useEffect, useMemo } from "react";
import type { TileDetectionResponse } from "../types/api.ts";

interface DetectionResultProps {
  imageBlob: Blob;
  detectionResult: TileDetectionResponse;
  onReset: () => void;
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

function getColorForTile(code: string): string {
  const suit = code.slice(-1);
  const colorMap: Record<string, string> = {
    m: "#FF6B6B",
    p: "#4ECDC4",
    s: "#45B7D1",
    z: "#DDA0DD",
  };
  return colorMap[suit] ?? COLORS[code.charCodeAt(0) % COLORS.length];
}

export function DetectionResult({
  imageBlob,
  detectionResult,
  onReset,
}: DetectionResultProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageUrl = useMemo(() => URL.createObjectURL(imageBlob), [imageBlob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(14, Math.min(24, img.width / 40));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.lineWidth = 3;

      for (const tile of detectionResult.tiles) {
        const [x1, y1, x2, y2] = tile.bbox;
        const color = getColorForTile(tile.code);

        ctx.strokeStyle = color;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        const label = `${tile.code} ${(tile.confidence * 100).toFixed(0)}%`;
        const textMetrics = ctx.measureText(label);
        const textHeight = fontSize + 4;
        const textWidth = textMetrics.width + 8;

        const labelY = y1 > textHeight + 5 ? y1 - textHeight - 2 : y2 + 2;

        ctx.fillStyle = color;
        ctx.fillRect(x1, labelY, textWidth, textHeight);

        ctx.fillStyle = "#000";
        ctx.fillText(label, x1 + 4, labelY + fontSize);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, detectionResult]);

  return (
    <div className="detection-result">
      <div className="result-header">
        <h2>Detected {detectionResult.count} tiles</h2>
        <button onClick={onReset} className="reset-btn">
          Take Another Photo
        </button>
      </div>
      <div className="result-canvas-container">
        <canvas ref={canvasRef} className="result-canvas" />
      </div>
      <div className="tiles-list">
        <h3>Tiles Found:</h3>
        <ul>
          {detectionResult.tiles.map((tile, index) => (
            <li key={index} className="tile-item">
              <span
                className="tile-color"
                style={{ backgroundColor: getColorForTile(tile.code) }}
              />
              <span className="tile-code">{tile.code}</span>
              <span className="tile-name">{tile.name}</span>
              <span className="tile-confidence">
                {(tile.confidence * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
