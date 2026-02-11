import { useState } from "react";
import { CameraCapture } from "./components/CameraCapture.tsx";
import { ImageDropZone } from "./components/ImageDropZone.tsx";
import { HandEditor } from "./components/hand-editor/HandEditor.tsx";
import { detectTiles } from "./api/detect.ts";
import { handFromDetection } from "./utils/handFromDetection.ts";
import type { HandSlot } from "./types/api.ts";
import "./App.css";

type AppState =
  | { status: "idle" }
  | { status: "capturing" }
  | { status: "detecting"; imageBlob: Blob }
  | { status: "editing"; initialHand: HandSlot[]; initialFlippedIndices: number[] }
  | { status: "error"; message: string };

function App() {
  const [state, setState] = useState<AppState>({ status: "idle" });

  const handleCapture = async (imageBlob: Blob) => {
    setState({ status: "detecting", imageBlob });

    try {
      const result = await detectTiles(imageBlob);
      const { hand: initialHand, initialFlippedIndices } = handFromDetection(result);
      setState({ status: "editing", initialHand, initialFlippedIndices });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Detection failed";
      setState({ status: "error", message });
    }
  };

  const handleReset = () => {
    setState({ status: "idle" });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-accent" />
        <h1>Score Calculator</h1>
        <p className="app-header-subtitle">Riichi Mahjong</p>
      </header>

      <main className="app-main">
        {state.status === "idle" && (
          <div className="capture-section">
            <p>Take a photo or drop an image of mahjong tiles to detect them</p>
            <CameraCapture onCapture={handleCapture} />
            <div className="input-divider">or</div>
            <ImageDropZone onDrop={handleCapture} />
          </div>
        )}

        {state.status === "capturing" && <CameraCapture onCapture={handleCapture} />}

        {state.status === "detecting" && (
          <div className="detecting">
            <div className="spinner" />
            <p>Detecting tiles...</p>
          </div>
        )}

        {state.status === "editing" && (
          <HandEditor
            initialHand={state.initialHand}
            initialFlippedIndices={state.initialFlippedIndices}
            onRetake={handleReset}
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
