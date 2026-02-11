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
    <div className="win-tile-section">
      <div className="win-tile-zones">
        <div className="win-tile-zone">
          <div className="zone-label">Win Tile</div>
          <button
            className={`win-tile-slot${winTile ? " win-tile-slot--filled" : ""}`}
            data-drop-target="win"
            data-testid="win-tile-slot"
            onDragEnter={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("drag-over");
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("drag-over");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("drag-over");
              const idx = getDropIndex(e);
              if (idx !== null) onDropToWin(idx);
            }}
            onClick={onWinTileClick}
            aria-label={winTile ? `Win tile: ${winTile}` : "Win tile slot"}
          >
            {svg ? (
              <img src={svg} alt={winTile!} />
            ) : (
              <span className="win-tile-placeholder">Drag here</span>
            )}
          </button>
        </div>

        <div className="swap-zone">
          <div className="zone-label">Swap</div>
          <div
            className="change-tile-zone"
            data-drop-target="change"
            data-testid="change-tile-zone"
            onDragEnter={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("drag-over");
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("drag-over");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("drag-over");
              const idx = getDropIndex(e);
              if (idx !== null) onDropToChange(idx);
            }}
          >
            Drag here
          </div>
        </div>
      </div>

      <div className="win-type-toggle">
        <button
          className={`segment${!isTsumo ? " segment--active" : ""}`}
          onClick={() => onSetTsumo(false)}
        >
          Ron
        </button>
        <button
          className={`segment${isTsumo ? " segment--active" : ""}`}
          onClick={() => onSetTsumo(true)}
        >
          Tsumo
        </button>
      </div>
    </div>
  );
};
