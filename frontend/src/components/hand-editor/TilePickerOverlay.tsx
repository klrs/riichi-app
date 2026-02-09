import { SUIT_DEFINITIONS } from "../../constants/tiles.ts";
import { tileCodeToSvg } from "../../utils/TileFont.ts";

interface TilePickerOverlayProps {
  onPick: (code: string) => void;
  onClose: () => void;
}

export const TilePickerOverlay = ({ onPick, onClose }: TilePickerOverlayProps) => {
  return (
    <div
      className="tile-picker-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      <div
        className="tile-picker-sheet"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
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
                    onClick={() => onPick(code)}
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
    </div>
  );
};
