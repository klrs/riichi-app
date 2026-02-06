import { useState, useRef } from "react";
import type { HandSlot } from "../types/api.ts";
import { HAND_SIZE, SUIT_DEFINITIONS } from "../constants/tiles.ts";
import { tileCodeToSvg } from "../utils/TileFont.ts";
import "./HandConfirmation.css";

interface HandConfirmationProps {
  initialHand: HandSlot[];
  onConfirm: (hand: string[]) => void;
  onRetake: () => void;
}

const findFirstEmptyIndex = (hand: HandSlot[]): number => {
  const idx = hand.indexOf(null);
  return idx === -1 ? 0 : idx;
};

export const HandConfirmation = ({ initialHand, onConfirm, onRetake }: HandConfirmationProps) => {
  const [hand, setHand] = useState<HandSlot[]>(initialHand);
  const [selectedIndex, setSelectedIndex] = useState<number>(findFirstEmptyIndex(initialHand));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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
  };

  const handleConfirm = () => {
    if (isFull) {
      onConfirm(hand as string[]);
    }
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
              className={`hand-slot${i === selectedIndex ? " hand-slot--selected" : ""}${slot === null ? " hand-slot--empty" : ""}${i === dragIndex ? " hand-slot--dragging" : ""}${i === dragOverIndex ? " hand-slot--drag-over" : ""}`}
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

      <div className="hand-actions">
        <button className="retake-btn" onClick={onRetake}>
          Retake
        </button>
        {hand[selectedIndex] !== null && (
          <button className="clear-btn" onClick={handleClear}>
            Clear
          </button>
        )}
        <button className="confirm-btn" onClick={handleConfirm} disabled={!isFull}>
          Confirm Hand
        </button>
      </div>
    </div>
  );
};
