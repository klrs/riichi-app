import { useState, useRef } from "react";
import type { HandSlot, MeldInfo } from "../types/api.ts";
import { HAND_SIZE, SUIT_DEFINITIONS } from "../constants/tiles.ts";
import { tileCodeToSvg } from "../utils/TileFont.ts";
import { inferMelds } from "../utils/meldInference.ts";
import "./HandConfirmation.css";

interface HandConfirmationProps {
  initialHand: HandSlot[];
  initialFlippedIndices: number[];
  onConfirm: (hand: string[], melds: MeldInfo[], flippedIndices: number[]) => void;
  onRetake: () => void;
}

const findFirstEmptyIndex = (hand: HandSlot[]): number => {
  const idx = hand.indexOf(null);
  return idx === -1 ? 0 : idx;
};

export const HandConfirmation = ({ initialHand, initialFlippedIndices, onConfirm, onRetake }: HandConfirmationProps) => {
  const [hand, setHand] = useState<HandSlot[]>(initialHand);
  const [selectedIndex, setSelectedIndex] = useState<number>(findFirstEmptyIndex(initialHand));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set(initialFlippedIndices));
  const [meldError, setMeldError] = useState<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const isFull = hand.every((slot) => slot !== null);

  const handleSlotClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handlePickTile = (code: string) => {
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

  const reorderTile = (from: number, to: number) => {
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

  const clearDragState = () => {
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Mouse drag (desktop)
  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
    setDragIndex(index);
  };

  const handleDrop = (dropTargetIndex: number) => {
    if (dragIndex !== null && dragIndex !== dropTargetIndex) {
      reorderTile(dragIndex, dropTargetIndex);
    }
    clearDragState();
  };

  const handleDragEnd = () => {
    clearDragState();
  };

  // Touch drag (mobile)
  const handleTouchStart = (index: number) => {
    if (hand[index] === null) return;
    dragIndexRef.current = index;
    setDragIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragIndexRef.current === null) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const slot = el?.closest("[data-slot-index]") as HTMLElement | null;
    if (slot) {
      const idx = Number(slot.dataset.slotIndex);
      dragOverIndexRef.current = idx;
      setDragOverIndex(idx);
    } else {
      dragOverIndexRef.current = null;
      setDragOverIndex(null);
    }
  };

  const handleTouchEnd = () => {
    const from = dragIndexRef.current;
    const to = dragOverIndexRef.current;
    if (from !== null && to !== null && from !== to) {
      reorderTile(from, to);
    }
    clearDragState();
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

  const handleFlip = () => {
    const newFlipped = new Set(flippedIndices);
    if (newFlipped.has(selectedIndex)) {
      newFlipped.delete(selectedIndex);
    } else {
      newFlipped.add(selectedIndex);
    }
    setFlippedIndices(newFlipped);
    setMeldError(null);
  };

  const handleConfirm = () => {
    if (!isFull) return;

    const fullHand = hand as string[];
    const result = inferMelds(fullHand, flippedIndices);
    if ("error" in result) {
      setMeldError(result.error);
      return;
    }

    setMeldError(null);
    onConfirm(fullHand, result.melds, [...flippedIndices]);
  };

  return (
    <div className="hand-confirmation">
      <div
        className="hand-grid"
        data-testid="hand-grid"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {hand.slice(0, HAND_SIZE).map((slot, i) => {
          const svg = slot ? tileCodeToSvg(slot) : null;
          return (
            <button
              key={`slot-${i}`}
              className={`hand-slot${i === selectedIndex ? " hand-slot--selected" : ""}${slot === null ? " hand-slot--empty" : ""}${i === dragIndex ? " hand-slot--dragging" : ""}${i === dragOverIndex ? " hand-slot--drag-over" : ""}${flippedIndices.has(i) ? " hand-slot--flipped" : ""}`}
              onClick={() => handleSlotClick(i)}
              aria-label={slot ? `Slot ${i + 1}: ${slot}` : `Slot ${i + 1}: empty`}
              data-slot-index={i}
              draggable={slot !== null}
              onDragStart={() => handleDragStart(i)}
              onTouchStart={() => handleTouchStart(i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverIndex(i)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              {svg ? <img src={svg} alt={slot!} /> : "?"}
            </button>
          );
        })}
      </div>

      <div className="tile-picker" data-testid="tile-picker">
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
                    onClick={() => handlePickTile(code)}
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

      {meldError && (
        <div className="meld-error">
          <p>{meldError}</p>
        </div>
      )}

      <div className="hand-actions">
        <button className="retake-btn" onClick={onRetake}>
          Retake
        </button>
        {hand[selectedIndex] !== null && (
          <>
            <button className="clear-btn" onClick={handleClear}>
              Clear
            </button>
            <button
              className={`flip-btn${flippedIndices.has(selectedIndex) ? " flip-btn--active" : ""}`}
              onClick={handleFlip}
            >
              Flip
            </button>
          </>
        )}
        <button className="confirm-btn" onClick={handleConfirm} disabled={!isFull}>
          Confirm Hand
        </button>
      </div>
    </div>
  );
};
