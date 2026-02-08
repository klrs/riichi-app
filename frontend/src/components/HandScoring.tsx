import { useState } from "react";
import { evaluateHand } from "../api/evaluate.ts";
import type { HandEvaluationResponse, MeldInfo } from "../types/api.ts";
import { tileCodeToSvg } from "../utils/TileFont.ts";
import "./HandScoring.css";

type Wind = "east" | "south" | "west" | "north";

interface HandScoringProps {
  hand: string[];
  melds: MeldInfo[];
  flippedIndices: number[];
  onBack: () => void;
}

export const HandScoring = ({ hand, melds, flippedIndices, onBack }: HandScoringProps) => {
  const isOpenHand = melds.length > 0;
  const flippedSet = new Set(flippedIndices);
  const [winTileIndex, setWinTileIndex] = useState<number | null>(null);
  const [isTsumo, setIsTsumo] = useState(false);
  const [seatWind, setSeatWind] = useState<Wind>("east");
  const [roundWind, setRoundWind] = useState<Wind>("east");
  const [isRiichi, setIsRiichi] = useState(false);
  const [result, setResult] = useState<HandEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (winTileIndex === null) return;

    setLoading(true);
    setFetchError(null);
    setResult(null);

    try {
      const response = await evaluateHand({
        tiles: hand,
        win_tile_index: winTileIndex,
        is_tsumo: isTsumo,
        seat_wind: seatWind,
        round_wind: roundWind,
        is_riichi: isOpenHand ? false : isRiichi,
        melds,
      });
      setResult(response);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  const winds: Wind[] = ["east", "south", "west", "north"];

  return (
    <div className="hand-scoring">
      <div className="scoring-hand-grid">
        {hand.map((tile, i) => {
          const svg = tileCodeToSvg(tile);
          return (
            <button
              key={`tile-${i}`}
              className={`scoring-tile${i === winTileIndex ? " scoring-tile--win" : ""}${flippedSet.has(i) ? " scoring-tile--flipped" : ""}`}
              onClick={() => setWinTileIndex(i)}
              aria-label={`${tile}${i === winTileIndex ? " (win tile)" : ""}`}
            >
              {svg ? <img src={svg} alt={tile} /> : tile}
            </button>
          );
        })}
      </div>

      {winTileIndex !== null && <p className="win-tile-label">Win tile: {hand[winTileIndex]}</p>}

      <div className="scoring-options">
        <div className="option-group">
          <span className="option-label">Win type</span>
          <div className="toggle-group">
            <button
              className={`toggle-btn${!isTsumo ? " toggle-btn--active" : ""}`}
              onClick={() => setIsTsumo(false)}
            >
              Ron
            </button>
            <button
              className={`toggle-btn${isTsumo ? " toggle-btn--active" : ""}`}
              onClick={() => setIsTsumo(true)}
            >
              Tsumo
            </button>
          </div>
        </div>

        <div className="option-group">
          <span className="option-label">Seat Wind</span>
          <div className="toggle-group">
            {winds.map((w) => (
              <button
                key={w}
                className={`toggle-btn${seatWind === w ? " toggle-btn--active" : ""}`}
                onClick={() => setSeatWind(w)}
              >
                {w.charAt(0).toUpperCase() + w.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <span className="option-label">Round Wind</span>
          <div className="toggle-group">
            {winds.map((w) => (
              <button
                key={w}
                className={`toggle-btn${roundWind === w ? " toggle-btn--active" : ""}`}
                onClick={() => setRoundWind(w)}
              >
                {w.charAt(0).toUpperCase() + w.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <span className="option-label">Riichi</span>
          <div className="toggle-group">
            <button
              className={`toggle-btn${!isRiichi || isOpenHand ? " toggle-btn--active" : ""}${isOpenHand ? " toggle-btn--disabled" : ""}`}
              onClick={() => !isOpenHand && setIsRiichi(false)}
              disabled={isOpenHand}
            >
              No
            </button>
            <button
              className={`toggle-btn${isRiichi && !isOpenHand ? " toggle-btn--active" : ""}${isOpenHand ? " toggle-btn--disabled" : ""}`}
              onClick={() => !isOpenHand && setIsRiichi(true)}
              disabled={isOpenHand}
            >
              Yes
            </button>
          </div>
        </div>
      </div>

      {result && !result.error && (
        <div className="scoring-result">
          <div className="result-summary">
            <span className="result-han">{result.han} Han</span>
            <span className="result-fu">{result.fu} Fu</span>
            {result.cost && (
              <span className="result-cost">
                {isTsumo ? (
                  result.cost.main === result.cost.additional ? (
                    <>{result.cost.additional.toLocaleString()} pts all</>
                  ) : (
                    <>
                      {result.cost.additional.toLocaleString()} /{" "}
                      {result.cost.main.toLocaleString()} pts
                    </>
                  )
                ) : (
                  <>{result.cost.main.toLocaleString()} pts</>
                )}
              </span>
            )}
          </div>
          <ul className="yaku-list">
            {result.yaku?.map((y) => (
              <li key={y.name} className="yaku-item">
                <span className="yaku-name">{y.name}</span>
                <span className="yaku-han">{y.is_yakuman ? "Yakuman" : `${y.han_value} Han`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result?.error && (
        <div className="scoring-error">
          <p>{result.error}</p>
        </div>
      )}

      {fetchError && (
        <div className="scoring-error">
          <p>{fetchError}</p>
        </div>
      )}

      <div className="scoring-actions">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <button
          className="calculate-btn"
          onClick={handleCalculate}
          disabled={winTileIndex === null || loading}
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </div>
    </div>
  );
};
