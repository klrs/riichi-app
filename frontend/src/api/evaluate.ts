import type { HandEvaluationRequest, HandEvaluationResponse } from "../types/api.ts";

export async function evaluateHand(
  request: HandEvaluationRequest,
): Promise<HandEvaluationResponse> {
  const response = await fetch("/api/hand/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evaluation failed: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<HandEvaluationResponse>;
}
