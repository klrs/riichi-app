import { http, HttpResponse } from "msw";
import type { TileDetectionResponse } from "../../src/types/api";

export const mockDetectionResponse: TileDetectionResponse = {
  count: 3,
  tiles: [
    {
      code: "1m",
      confidence: 0.95,
      bbox: [100, 100, 200, 250],
      name: "1 Man",
      is_red_five: false,
      is_back: false,
      suit: "m",
      number: 1,
    },
    {
      code: "5p",
      confidence: 0.88,
      bbox: [220, 100, 320, 250],
      name: "5 Pin",
      is_red_five: false,
      is_back: false,
      suit: "p",
      number: 5,
    },
    {
      code: "9s",
      confidence: 0.92,
      bbox: [340, 100, 440, 250],
      name: "9 Sou",
      is_red_five: false,
      is_back: false,
      suit: "s",
      number: 9,
    },
  ],
};

export const handlers = [
  http.post("/api/detect", async () => {
    return HttpResponse.json(mockDetectionResponse);
  }),
];

export const errorHandlers = [
  http.post("/api/detect", async () => {
    return new HttpResponse("Detection service unavailable", { status: 500 });
  }),
];
