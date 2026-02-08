import type { MeldInfo } from "../types/api.ts";

/**
 * Normalize a tile code so red fives (0m/0p/0s) become their regular equivalent (5m/5p/5s).
 */
function normalizeTile(code: string): string {
  if (code.startsWith("0")) return "5" + code.slice(1);
  return code;
}

/**
 * Parse a tile code into { number, suit }. Red fives are treated as 5.
 */
function parseTile(code: string): { number: number; suit: string } {
  const raw = parseInt(code.slice(0, -1), 10);
  const suit = code.slice(-1);
  return { number: raw === 0 ? 5 : raw, suit };
}

/**
 * Check if three tile codes form a valid pon (three of the same tile, normalizing red fives).
 */
function isPon(a: string, b: string, c: string): boolean {
  return normalizeTile(a) === normalizeTile(b) && normalizeTile(b) === normalizeTile(c);
}

/**
 * Check if three tile codes form a valid chi (consecutive same-suit numbered tiles).
 */
function isChi(a: string, b: string, c: string): boolean {
  const pa = parseTile(a);
  const pb = parseTile(b);
  const pc = parseTile(c);

  if (pa.suit !== pb.suit || pb.suit !== pc.suit) return false;
  if (pa.suit === "z") return false; // honors can't form sequences

  const nums = [pa.number, pb.number, pc.number].sort((x, y) => x - y);
  return nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1;
}

/**
 * Given the 14-tile hand and a set of flipped indices, infer melds.
 *
 * Each flipped tile represents the stolen tile in one meld.
 * For each flipped index, we try 3-tile windows containing it and pick
 * the first valid pon or chi. Indices are processed left-to-right (greedy)
 * and cannot overlap between melds.
 *
 * Returns the inferred melds or an error string.
 */
export function inferMelds(
  hand: string[],
  flippedIndices: Set<number>,
): { melds: MeldInfo[] } | { error: string } {
  if (flippedIndices.size === 0) return { melds: [] };

  const sorted = [...flippedIndices].sort((a, b) => a - b);
  const used = new Set<number>();
  const melds: MeldInfo[] = [];

  for (const flipped of sorted) {
    if (used.has(flipped)) continue;

    // Try 3-tile windows that include the flipped index
    const windows: [number, number, number][] = [
      [flipped - 2, flipped - 1, flipped],
      [flipped - 1, flipped, flipped + 1],
      [flipped, flipped + 1, flipped + 2],
    ];

    let found = false;
    for (const window of windows) {
      const [a, b, c] = window;

      // All indices must be valid and not already used
      if (a < 0 || c >= hand.length) continue;
      if (used.has(a) || used.has(b) || used.has(c)) continue;

      const tiles = [hand[a], hand[b], hand[c]];
      if (isPon(tiles[0], tiles[1], tiles[2])) {
        melds.push({ type: "pon", tiles });
        used.add(a);
        used.add(b);
        used.add(c);
        found = true;
        break;
      } else if (isChi(tiles[0], tiles[1], tiles[2])) {
        melds.push({ type: "chi", tiles });
        used.add(a);
        used.add(b);
        used.add(c);
        found = true;
        break;
      }
    }

    if (!found) {
      return {
        error: `No valid meld found for tile at position ${flipped + 1}`,
      };
    }
  }

  return { melds };
}
