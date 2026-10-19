import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { classifyExpression, type ExpressionRead } from "./emotion";

export type CameraState = "off" | "requesting" | "loading" | "live" | "no-face" | "error";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL_PATH = "/models/face_landmarker.task";

function explainCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Camera access was denied. Allow camera permission in your browser settings, then try again.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No camera was found. Connect a camera and try again.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The camera is already in use by another app. Close that app and try again.";
    }
  }
  return "The camera or expression model could not start. Check your connection and camera settings, then try again.";
}

export function useEmotionMirror() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const busyRef = useRef(false);
  const generationRef = useRef(0);
  const lastFrameRef = useRef(-1);
  const lastRunAtRef = useRef(0);
  const candidateMoodRef = useRef<string | null>(null);
  const candidateFramesRef = useRef(0);
  const [cameraState, setCameraState] = useState<CameraState>("off");
  const [errorMessage, setErrorMessage] = useState("");
  const [expression, setExpression] = useState<ExpressionRead | null>(null);

  const releaseResources = useCallback(() => {
    runningRef.current = false;
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    detectorRef.current?.close();
    detectorRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (busyRef.current || runningRef.current) return;
    busyRef.current = true;
    const generation = ++generationRef.current;
    setErrorMessage("");
    setExpression(null);
    setCameraState("requesting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access. Open the mirror in a modern browser over HTTPS.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("The camera preview is not available yet. Please try again.");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (generation !== generationRef.current) return;
      setCameraState("loading");

      const { FilesetResolver, FaceLandmarker: FaceLandmarkerFactory } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      if (generation !== generationRef.current) return;

      let detector: FaceLandmarker;
      try {
        detector = await FaceLandmarkerFactory.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
      } catch {
        if (generation !== generationRef.current) return;
        detector = await FaceLandmarkerFactory.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
      }
      if (generation !== generationRef.current) {
        detector.close();
        return;
      }
      detectorRef.current = detector;
      lastFrameRef.current = -1;
      lastRunAtRef.current = 0;
      candidateMoodRef.current = null;
      candidateFramesRef.current = 0;
      runningRef.current = true;
      setCameraState("live");
    } catch (error) {
      if (generation !== generationRef.current) return;
      releaseResources();
      setErrorMessage(error instanceof Error && !(error instanceof DOMException) ? error.message : explainCameraError(error));
      setCameraState("error");
    } finally {
      busyRef.current = false;
    }
  }, [releaseResources]);

  const stopCamera = useCallback(() => {
    generationRef.current += 1;
    releaseResources();
    setExpression(null);
    setErrorMessage("");
    setCameraState("off");
  }, [releaseResources]);

  useEffect(() => {
    if (cameraState !== "live" && cameraState !== "no-face") return;

    const detectFrame = (timestamp: number) => {
      if (!runningRef.current) return;
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (
        video && detector && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime !== lastFrameRef.current && timestamp - lastRunAtRef.current > 180
      ) {
        lastFrameRef.current = video.currentTime;
        lastRunAtRef.current = timestamp;
        try {
          const result = detector.detectForVideo(video, performance.now());
          const categories = result.faceBlendshapes[0]?.categories;
          if (!result.faceLandmarks.length || !categories?.length) {
            candidateMoodRef.current = null;
            candidateFramesRef.current = 0;
            setExpression(null);
            setCameraState((current) => current === "no-face" ? current : "no-face");
          } else {
            const next = classifyExpression(categories);
            if (candidateMoodRef.current === next.mood) {
              candidateFramesRef.current += 1;
            } else {
              candidateMoodRef.current = next.mood;
              candidateFramesRef.current = 1;
            }
            if (candidateFramesRef.current >= 2) {
              setExpression(next);
              setCameraState((current) => current === "no-face" ? "live" : current);
            }
          }
        } catch {
          releaseResources();
          setErrorMessage("The expression model stopped unexpectedly. Your camera has been turned off; you can try again.");
          setCameraState("error");
        }
      }
      animationRef.current = requestAnimationFrame(detectFrame);
    };

    animationRef.current = requestAnimationFrame(detectFrame);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [cameraState, releaseResources]);

  useEffect(() => () => {
    generationRef.current += 1;
    releaseResources();
  }, [releaseResources]);

  return {
    videoRef,
    cameraState,
    errorMessage,
    expression,
    cameraActive: cameraState === "loading" || cameraState === "live" || cameraState === "no-face",
    startCamera,
    stopCamera,
  };
}
