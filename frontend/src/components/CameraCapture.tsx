import { useRef, useState, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access camera";
      setError(message);
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture, stopCamera]);

  // Attach stream to video element after it mounts
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      // Explicitly play for mobile browsers
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, but autoPlay attribute should handle it
      });
    }
  }, [stream, isCameraActive]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  if (error) {
    return (
      <div className="camera-error">
        <p>Camera error: {error}</p>
        <button onClick={startCamera}>Try Again</button>
      </div>
    );
  }

  if (!isCameraActive) {
    return (
      <button
        onClick={startCamera}
        disabled={disabled}
        className="start-camera-btn"
      >
        Open Camera
      </button>
    );
  }

  return (
    <div className="camera-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onPlaying={() => setIsVideoReady(true)}
        className="camera-preview"
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="camera-controls">
        <button onClick={captureImage} disabled={disabled || !isVideoReady} className="capture-btn">
          {isVideoReady ? "Capture" : "Loading..."}
        </button>
        <button onClick={stopCamera} className="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );
}
