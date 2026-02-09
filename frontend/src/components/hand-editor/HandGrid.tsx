import { useRef } from "react";
import type { HandSlot } from "../../types/api.ts";
import { tileCodeToSvg } from "../../utils/TileFont.ts";

interface HandGridProps {
  hand: HandSlot[];
  selectedIndex: number;
  flippedIndices: Set<number>;
  onSlotClick: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

export const HandGrid = ({
  hand,
  selectedIndex,
  flippedIndices,
  onSlotClick,
  onReorder,
}: HandGridProps) => {
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const clearDragState = () => {
    document.querySelectorAll(".hand-slot--drag-over").forEach((el) => {
      el.classList.remove("hand-slot--drag-over");
    });
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
  };

  // Mouse drag (desktop)
  const handleDragStart = (index: number, e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (_index: number, e: React.DragEvent) => {
    e.currentTarget.classList.add("hand-slot--drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("hand-slot--drag-over");
  };

  const handleDrop = (dropTargetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    const fromStr = e.dataTransfer.getData("text/plain");
    const from = fromStr !== "" ? Number(fromStr) : dragIndexRef.current;
    if (from !== null && from !== dropTargetIndex) {
      onReorder(from, dropTargetIndex);
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
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragIndexRef.current === null) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);

    // Check for drop targets first
    const dropTarget = el?.closest("[data-drop-target]") as HTMLElement | null;
    if (dropTarget) {
      dragOverIndexRef.current = null;
      document.querySelectorAll(".hand-slot--drag-over").forEach((e) => {
        e.classList.remove("hand-slot--drag-over");
      });
      dropTarget.classList.add("drag-over");
      return;
    }

    // Check for grid slots
    const slot = el?.closest("[data-slot-index]") as HTMLElement | null;
    if (slot) {
      const idx = Number(slot.dataset.slotIndex);
      dragOverIndexRef.current = idx;
      document.querySelectorAll(".hand-slot--drag-over").forEach((e) => {
        e.classList.remove("hand-slot--drag-over");
      });
      document.querySelectorAll("[data-drop-target].drag-over").forEach((e) => {
        e.classList.remove("drag-over");
      });
      slot.classList.add("hand-slot--drag-over");
    } else {
      dragOverIndexRef.current = null;
      document.querySelectorAll(".hand-slot--drag-over").forEach((e) => {
        e.classList.remove("hand-slot--drag-over");
      });
      document.querySelectorAll("[data-drop-target].drag-over").forEach((e) => {
        e.classList.remove("drag-over");
      });
    }
  };

  const handleTouchEnd = () => {
    const from = dragIndexRef.current;
    const toIdx = dragOverIndexRef.current;

    // Check for drop target
    const activeTarget = document.querySelector(
      "[data-drop-target].drag-over",
    ) as HTMLElement | null;
    if (from !== null && activeTarget) {
      const target = activeTarget.dataset.dropTarget;
      if (target === "win" || target === "change") {
        // Dispatch a custom event so HandEditor can handle it
        activeTarget.dispatchEvent(
          new CustomEvent("tile-drop", { detail: { fromIndex: from }, bubbles: true }),
        );
      }
    } else if (from !== null && toIdx !== null && from !== toIdx) {
      onReorder(from, toIdx);
    }

    document.querySelectorAll("[data-drop-target].drag-over").forEach((e) => {
      e.classList.remove("drag-over");
    });
    clearDragState();
  };

  return (
    <div
      className="hand-grid"
      data-testid="hand-grid"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {hand.map((slot, i) => {
        const svg = slot ? tileCodeToSvg(slot) : null;
        return (
          <button
            key={`slot-${i}`}
            className={`hand-slot${i === selectedIndex ? " hand-slot--selected" : ""}${slot === null ? " hand-slot--empty" : ""}${flippedIndices.has(i) ? " hand-slot--flipped" : ""}`}
            onClick={() => onSlotClick(i)}
            aria-label={slot ? `Slot ${i + 1}: ${slot}` : `Slot ${i + 1}: empty`}
            data-slot-index={i}
            draggable={slot !== null}
            onDragStart={(e) => handleDragStart(i, e)}
            onTouchStart={() => handleTouchStart(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => handleDragEnter(i, e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(i, e)}
            onDragEnd={handleDragEnd}
          >
            {svg ? <img src={svg} alt={slot!} /> : "?"}
          </button>
        );
      })}
    </div>
  );
};
