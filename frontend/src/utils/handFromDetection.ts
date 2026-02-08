import type { TileDetectionResponse, DetectedTile } from "../types/api.ts";
import type { HandSlot } from "../types/api.ts";
import { HAND_SIZE } from "../constants/tiles.ts";

export const handFromDetection = (
  response: TileDetectionResponse,
): { hand: HandSlot[]; initialFlippedIndices: number[] } => {
  const faceTiles = response.tiles.filter((t) => !t.is_back);

  // Take top 14 by confidence, then preserve API order (API handles sorting)
  const byConfidence = [...faceTiles].sort((a, b) => b.confidence - a.confidence);
  const top = byConfidence.slice(0, HAND_SIZE);
  const topSet = new Set<DetectedTile>(top);
  const ordered = faceTiles.filter((t) => topSet.has(t));

  const hand: HandSlot[] = ordered.map((t) => t.code);
  const initialFlippedIndices: number[] = [];

  ordered.forEach((t, i) => {
    if (t.is_rotated) {
      initialFlippedIndices.push(i);
    }
  });

  while (hand.length < HAND_SIZE) {
    hand.push(null);
  }

  return { hand, initialFlippedIndices };
};
