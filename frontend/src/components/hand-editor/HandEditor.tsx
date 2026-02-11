import { useState, useEffect, useRef, useCallback } from "react";
import type { HandSlot, HandEvaluationResponse, MeldInfo } from "../../types/api.ts";
import { HAND_SIZE, SUIT_DEFINITIONS } from "../../constants/tiles.ts";
import { tileCodeToSvg } from "../../utils/TileFont.ts";
import { inferMelds } from "../../utils/meldInference.ts";
import { evaluateHand } from "../../api/evaluate.ts";
import {
  remapFlippedAfterRemoval,
  remapFlippedAfterInsertion,
} from "../../utils/flippedIndexRemap.ts";
import { HandGrid } from "./HandGrid.tsx";
import { WinTileRow } from "./WinTileRow.tsx";
import { ScoringOptions } from "./ScoringOptions.tsx";
import { ScoreResult } from "./ScoreResult.tsx";
import { TilePickerOverlay } from "./TilePickerOverlay.tsx";
import "./HandEditor.css";

type Wind = "east" | "south" | "west" | "north";

interface HandEditorProps {
  initialHand: HandSlot[];
  initialFlippedIndices: number[];
  onRetake: () => void;
}

type PickerTarget = { type: "grid"; index: number } | { type: "win" } | null;

const findFirstEmptyIndex = (hand: HandSlot[]): number => {
  const idx = hand.indexOf(null);
  return idx === -1 ? 0 : idx;
};

export const HandEditor = ({ initialHand, initialFlippedIndices, onRetake }: HandEditorProps) => {
  const [hand, setHand] = useState<HandSlot[]>(initialHand);
  const [selectedIndex, setSelectedIndex] = useState<number>(findFirstEmptyIndex(initialHand));
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set(initialFlippedIndices));
  const [winTile, setWinTile] = useState<string | null>(null);
  const [winTileFlipped, setWinTileFlipped] = useState(false);
  const [isTsumo, setIsTsumo] = useState(false);
  const [isRiichi, setIsRiichi] = useState(false);
  const [seatWind, setSeatWind] = useState<Wind>("east");
  const [roundWind, setRoundWind] = useState<Wind>("east");
  const [doraCount, setDoraCount] = useState(0);
  const [result, setResult] = useState<HandEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [meldError, setMeldError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const isFull = hand.every((slot) => slot !== null);
  const isOpenHand = flippedIndices.size > 0;

  // Live scoring with debounce
  const doEvaluate = useCallback(async () => {
    if (!isFull || !winTile) {
      setResult(null);
      return;
    }

    const fullHand = hand as string[];
    const meldResult = inferMelds(fullHand, flippedIndices);
    if ("error" in meldResult) {
      setMeldError(meldResult.error);
      setResult(null);
      return;
    }
    setMeldError(null);

    const melds: MeldInfo[] = meldResult.melds;
    const tiles = [...fullHand, winTile];
    const winTileIndex = fullHand.length; // win tile is appended at end

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(null);

    try {
      const response = await evaluateHand({
        tiles,
        win_tile_index: winTileIndex,
        is_tsumo: isTsumo,
        seat_wind: seatWind,
        round_wind: roundWind,
        is_riichi: isOpenHand ? false : isRiichi,
        melds,
        dora_count: doraCount,
      });
      if (!controller.signal.aborted) {
        setResult(response);
        setLoading(false);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setFetchError(err instanceof Error ? err.message : "Evaluation failed");
        setLoading(false);
      }
    }
  }, [
    hand,
    winTile,
    isTsumo,
    isRiichi,
    seatWind,
    roundWind,
    doraCount,
    flippedIndices,
    isFull,
    isOpenHand,
  ]);

  useEffect(() => {
    if (!isFull || !winTile) {
      setResult(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      doEvaluate();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [doEvaluate, isFull, winTile]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleSlotClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleReorder = (from: number, to: number) => {
    const next = [...hand];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setHand(next);
    setSelectedIndex(to);

    // Remap flipped indices to follow tiles after reorder
    const newFlipped = new Set<number>();
    for (const idx of flippedIndices) {
      let newIdx = idx;
      if (idx === from) {
        newIdx = to;
      } else if (from < to) {
        if (idx > from && idx <= to) newIdx = idx - 1;
      } else {
        if (idx >= to && idx < from) newIdx = idx + 1;
      }
      newFlipped.add(newIdx);
    }
    setFlippedIndices(newFlipped);
  };

  const extractWinTile = (fromIndex: number) => {
    const tile = hand[fromIndex];
    if (!tile) return;

    const wasFlipped = flippedIndices.has(fromIndex);
    const next = [...hand];
    next.splice(fromIndex, 1);

    // Remap flipped indices after removing the new win tile
    let newFlipped = remapFlippedAfterRemoval(flippedIndices, fromIndex);

    // If there's already a win tile, return it to the hand
    if (winTile !== null) {
      const insertIdx = next.length;
      next.push(winTile);
      newFlipped = remapFlippedAfterInsertion(newFlipped, insertIdx, winTileFlipped);
    }

    setHand(next);
    setWinTile(tile);
    setWinTileFlipped(wasFlipped);
    setFlippedIndices(newFlipped);
    setSelectedIndex(Math.min(fromIndex, next.length - 1));
  };

  const insertWinTileBack = () => {
    if (!winTile) return;
    const next = [...hand];
    const insertIdx = next.length; // append at end
    next.push(winTile);
    setHand(next);
    setFlippedIndices(remapFlippedAfterInsertion(flippedIndices, insertIdx, winTileFlipped));
    setWinTile(null);
    setWinTileFlipped(false);
  };

  const handleWinTileClick = () => {
    if (winTile) {
      // Put win tile back into hand
      insertWinTileBack();
    }
  };

  const handlePickerPick = (code: string) => {
    if (pickerTarget?.type === "grid") {
      const next = [...hand];
      next[pickerTarget.index] = code;
      setHand(next);
    } else if (pickerTarget?.type === "win") {
      setWinTile(code);
    }
    setPickerOpen(false);
    setPickerTarget(null);
  };

  const handleClear = () => {
    const next = [...hand];
    next[selectedIndex] = null;
    setHand(next);

    if (flippedIndices.has(selectedIndex)) {
      const newFlipped = new Set(flippedIndices);
      newFlipped.delete(selectedIndex);
      setFlippedIndices(newFlipped);
    }
  };

  const handleFlip = (index: number) => {
    const newFlipped = new Set(flippedIndices);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedIndices(newFlipped);
    setMeldError(null);
  };

  const handlePickTileInline = (code: string) => {
    const next = [...hand];
    next[selectedIndex] = code;
    setHand(next);

    if (hand[selectedIndex] === null) {
      const nextEmpty = next.indexOf(null);
      if (nextEmpty !== -1) {
        setSelectedIndex(nextEmpty);
      }
    }
  };

  // Show inline picker when hand has empty slots (initial editing mode)
  const hasEmptySlots = hand.some((slot) => slot === null);

  return (
    <div className="hand-editor">
      <HandGrid
        hand={hand}
        selectedIndex={selectedIndex}
        flippedIndices={flippedIndices}
        onSlotClick={handleSlotClick}
        onReorder={handleReorder}
        onFlip={isFull ? handleFlip : undefined}
        onDropToWin={isFull ? (fromIndex) => { if (hand[fromIndex]) extractWinTile(fromIndex); } : undefined}
        onDropToChange={isFull ? (fromIndex) => { setPickerTarget({ type: "grid", index: fromIndex }); setPickerOpen(true); } : undefined}
      />

      {hasEmptySlots ? (
        <div className="inline-tile-picker" data-testid="tile-picker">
          {SUIT_DEFINITIONS.map((suit) => (
            <div key={suit.label} className="tile-picker-suit">
              <div className="tile-picker-suit-label">{suit.label}</div>
              <div className="tile-picker-tiles">
                {suit.codes.map((code) => {
                  const svg = tileCodeToSvg(code);
                  return (
                    <button
                      key={code}
                      className="tile-picker-btn"
                      onClick={() => handlePickTileInline(code)}
                      aria-label={`Pick ${code}`}
                    >
                      {svg ? <img src={svg} alt={code} /> : code}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <WinTileRow
            winTile={winTile}
            isTsumo={isTsumo}
            onSetTsumo={setIsTsumo}
            onDropToWin={(fromIndex: number) => {
              if (hand[fromIndex]) extractWinTile(fromIndex);
            }}
            onDropToChange={(fromIndex: number) => {
              setPickerTarget({ type: "grid", index: fromIndex });
              setPickerOpen(true);
            }}
            onWinTileClick={handleWinTileClick}
          />

          <ScoringOptions
            isRiichi={isRiichi}
            isOpenHand={isOpenHand}
            doraCount={doraCount}
            roundWind={roundWind}
            seatWind={seatWind}
            onSetRiichi={setIsRiichi}
            onSetDoraCount={setDoraCount}
            onSetRoundWind={setRoundWind}
            onSetSeatWind={setSeatWind}
          />

          {meldError && (
            <div className="meld-error">
              <p>{meldError}</p>
            </div>
          )}

          <ScoreResult
            result={result}
            isTsumo={isTsumo}
            loading={loading}
            fetchError={fetchError}
          />
        </>
      )}

      <div className="hand-actions">
        <button className="retake-btn" onClick={onRetake}>
          Retake
        </button>
        {hand[selectedIndex] !== null && hand.length === HAND_SIZE && (
          <button className="clear-btn" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>

      {pickerOpen && (
        <TilePickerOverlay
          onPick={handlePickerPick}
          onClose={() => {
            setPickerOpen(false);
            setPickerTarget(null);
          }}
        />
      )}
    </div>
  );
};
