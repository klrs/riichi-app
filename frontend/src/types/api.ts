export type TileCode = string;
export type HandSlot = TileCode | null;

export interface DetectedTile {
  code: string;
  confidence: number;
  bbox: [number, number, number, number];
  name: string;
  is_red_five: boolean;
  is_back: boolean;
  is_rotated: boolean;
  suit: string | null;
  number: number | null;
}

export interface TileDetectionResponse {
  tiles: DetectedTile[];
  count: number;
}

export type MeldType = "chi" | "pon";

export interface MeldInfo {
  type: MeldType;
  tiles: string[];
}

export interface HandEvaluationRequest {
  tiles: string[];
  win_tile_index: number;
  is_tsumo: boolean;
  seat_wind: "east" | "south" | "west" | "north";
  round_wind: "east" | "south" | "west" | "north";
  is_riichi: boolean;
  melds: MeldInfo[];
}

export interface YakuResult {
  name: string;
  han_value: number;
  is_yakuman: boolean;
}

export interface CostResult {
  main: number;
  additional: number;
}

export interface HandEvaluationResponse {
  han: number | null;
  fu: number | null;
  yaku: YakuResult[] | null;
  cost: CostResult | null;
  error: string | null;
}
