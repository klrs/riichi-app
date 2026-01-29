import { useState } from "react";
import { CameraCapture } from "./components/CameraCapture.tsx";
import { DetectionResult } from "./components/DetectionResult.tsx";
import { detectTiles } from "./api/detect.ts";
import type { TileDetectionResponse } from "./types/api.ts";
import "./App.css";

type AppState =
  | { status: "idle" }
  | { status: "capturing" }
  | { status: "detecting"; imageBlob: Blob }
  | { status: "result"; imageBlob: Blob; result: TileDetectionResponse }
  | { status: "error"; message: string };

function App() {
  const [state, setState] = useState<AppState>({ status: "idle" });

  const handleCapture = async (imageBlob: Blob) => {
    setState({ status: "detecting", imageBlob });

    try {
      const result = await detectTiles(imageBlob);
      setState({ status: "result", imageBlob, result });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Detection failed";
      setState({ status: "error", message });
    }
  };

  const handleReset = () => {
    setState({ status: "idle" });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Riichi Tile Detector</h1>
      </header>

      <main className="app-main">
        {state.status === "idle" && (
          <div className="capture-section">
            <p>Take a photo of mahjong tiles to detect them</p>
            <CameraCapture onCapture={handleCapture} />
          </div>
        )}

        {state.status === "capturing" && (
          <CameraCapture onCapture={handleCapture} />
        )}

        {state.status === "detecting" && (
          <div className="detecting">
            <div className="spinner" />
            <p>Detecting tiles...</p>
          </div>
        )}

        {state.status === "result" && (
          <DetectionResult
            imageBlob={state.imageBlob}
            detectionResult={state.result}
            onReset={handleReset}
          />
        )}

        {state.status === "error" && (
          <div className="error">
            <p>Error: {state.message}</p>
            <button onClick={handleReset}>Try Again</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
