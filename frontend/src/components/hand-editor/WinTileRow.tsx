import { tileCodeToSvg } from "../../utils/TileFont.ts";

interface WinTileRowProps {
  winTile: string | null;
  isTsumo: boolean;
  onSetTsumo: (tsumo: boolean) => void;
  onDropToWin: (fromIndex: number) => void;
  onDropToChange: (fromIndex: number) => void;
  onWinTileClick: () => void;
}

export const WinTileRow = ({
  winTile,
  isTsumo,
  onSetTsumo,
  onDropToWin,
  onDropToChange,
  onWinTileClick,
}: WinTileRowProps) => {
  const svg = winTile ? tileCodeToSvg(winTile) : null;

  const getDropIndex = (e: React.DragEvent): number | null => {
    const data = e.dataTransfer.getData("text/plain");
    return data !== "" ? Number(data) : null;
  };

  return (
    <div className="win-tile-row">
      <button
        className={`win-tile-slot${winTile ? " win-tile-slot--filled" : ""}`}
        data-drop-target="win"
        data-testid="win-tile-slot"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const idx = getDropIndex(e);
          if (idx !== null) onDropToWin(idx);
        }}
        onClick={onWinTileClick}
        aria-label={winTile ? `Win tile: ${winTile}` : "Win tile slot"}
      >
        {svg ? (
          <img src={svg} alt={winTile!} />
        ) : (
          <span className="win-tile-placeholder">Win tile</span>
        )}
      </button>

      <div className="win-type-toggle">
        <button
          className={`toggle-btn${!isTsumo ? " toggle-btn--active" : ""}`}
          onClick={() => onSetTsumo(false)}
        >
          Ron
        </button>
        <button
          className={`toggle-btn${isTsumo ? " toggle-btn--active" : ""}`}
          onClick={() => onSetTsumo(true)}
        >
          Tsumo
        </button>
      </div>

      <div
        className="change-tile-zone"
        data-drop-target="change"
        data-testid="change-tile-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const idx = getDropIndex(e);
          if (idx !== null) onDropToChange(idx);
        }}
      >
        Change tile
      </div>
    </div>
  );
};
