import type { HandEvaluationResponse } from "../../types/api.ts";

interface ScoreResultProps {
  result: HandEvaluationResponse | null;
  isTsumo: boolean;
  loading: boolean;
  fetchError: string | null;
}

export const ScoreResult = ({ result, isTsumo, loading, fetchError }: ScoreResultProps) => {
  if (loading) {
    return (
      <div className="score-loading" data-testid="score-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="scoring-error">
        <p>{fetchError}</p>
      </div>
    );
  }

  if (!result) return null;

  if (result.error) {
    return (
      <div className="scoring-error">
        <p>{result.error}</p>
      </div>
    );
  }

  return (
    <div className="scoring-result" data-testid="score-result">
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
                  {result.cost.additional.toLocaleString()} / {result.cost.main.toLocaleString()}{" "}
                  pts
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
  );
};
