type Wind = "east" | "south" | "west" | "north";

const WIND_KANJI: Record<Wind, string> = {
  east: "\u6771",
  south: "\u5357",
  west: "\u897F",
  north: "\u5317",
};

interface ScoringOptionsProps {
  isRiichi: boolean;
  isOpenHand: boolean;
  doraCount: number;
  roundWind: Wind;
  seatWind: Wind;
  onSetRiichi: (riichi: boolean) => void;
  onSetDoraCount: (count: number) => void;
  onSetRoundWind: (wind: Wind) => void;
  onSetSeatWind: (wind: Wind) => void;
}

const roundWinds: Wind[] = ["east", "south"];
const seatWinds: Wind[] = ["east", "south", "west", "north"];

export const ScoringOptions = ({
  isRiichi,
  isOpenHand,
  doraCount,
  roundWind,
  seatWind,
  onSetRiichi,
  onSetDoraCount,
  onSetRoundWind,
  onSetSeatWind,
}: ScoringOptionsProps) => {
  return (
    <div className="scoring-options">
      <div className="option-row">
        <span className="option-label">Riichi</span>
        <div className="pill-toggle pill-toggle--small">
          <button
            className={`pill-segment${!isRiichi || isOpenHand ? " pill-segment--active" : ""}${isOpenHand ? " pill-segment--disabled" : ""}`}
            onClick={() => !isOpenHand && onSetRiichi(false)}
            disabled={isOpenHand}
          >
            No
          </button>
          <button
            className={`pill-segment${isRiichi && !isOpenHand ? " pill-segment--active" : ""}${isOpenHand ? " pill-segment--disabled" : ""}`}
            onClick={() => !isOpenHand && onSetRiichi(true)}
            disabled={isOpenHand}
          >
            Yes
          </button>
        </div>
      </div>

      <div className="option-row">
        <span className="option-label">Dora</span>
        <div className="dora-stepper">
          <button
            className="stepper-btn"
            onClick={() => onSetDoraCount(Math.max(0, doraCount - 1))}
            disabled={doraCount === 0}
            aria-label="Decrease dora"
          >
            -
          </button>
          <span className="stepper-value" data-testid="dora-count">
            {doraCount}
          </span>
          <button
            className="stepper-btn"
            onClick={() => onSetDoraCount(doraCount + 1)}
            aria-label="Increase dora"
          >
            +
          </button>
        </div>
      </div>

      <div className="scoring-divider" />

      <div className="option-group">
        <span className="option-label">Round Wind</span>
        <div className="wind-group">
          {roundWinds.map((w) => (
            <button
              key={w}
              className={`wind-btn round-wind-btn${roundWind === w ? " wind-btn--active" : ""}`}
              onClick={() => onSetRoundWind(w)}
            >
              {WIND_KANJI[w]}
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <span className="option-label">Seat Wind</span>
        <div className="wind-group">
          {seatWinds.map((w) => (
            <button
              key={w}
              className={`wind-btn seat-wind-btn${seatWind === w ? " wind-btn--active" : ""}`}
              onClick={() => onSetSeatWind(w)}
            >
              {WIND_KANJI[w]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
