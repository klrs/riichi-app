import type { TileDetectionResponse } from "../types/api.ts";

export async function detectTiles(imageBlob: Blob): Promise<TileDetectionResponse> {
  const formData = new FormData();
  formData.append("file", imageBlob, "capture.jpg");

  const response = await fetch("/api/detect", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Detection failed: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<TileDetectionResponse>;
}
