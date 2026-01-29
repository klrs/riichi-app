export interface DetectedTile {
  code: string;
  confidence: number;
  bbox: [number, number, number, number];
  name: string;
  is_red_five: boolean;
  is_back: boolean;
  suit: string | null;
  number: number | null;
}

export interface TileDetectionResponse {
  tiles: DetectedTile[];
  count: number;
}
