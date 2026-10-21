import Delaunator from "delaunator";
import { useMemo } from "react";
import type { NormalizedFacePoint } from "./emotes";

type Props = {
  landmarks: NormalizedFacePoint[] | null;
  videoWidth: number;
  videoHeight: number;
};

function createWireframePath(landmarks: NormalizedFacePoint[], width: number, height: number) {
  if (landmarks.length < 3 || width <= 0 || height <= 0) return "";

  const triangulation = Delaunator.from(landmarks, (point) => point.x, (point) => point.y);
  const edges = new Set<number>();
  const path: string[] = [];
  const pointCount = landmarks.length;

  for (let index = 0; index < triangulation.triangles.length; index += 3) {
    const a = triangulation.triangles[index];
    const b = triangulation.triangles[index + 1];
    const c = triangulation.triangles[index + 2];

    for (const [start, end] of [[a, b], [b, c], [c, a]]) {
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      const edgeKey = low * pointCount + high;
      if (edges.has(edgeKey)) continue;
      edges.add(edgeKey);

      const from = landmarks[start];
      const to = landmarks[end];
      path.push(
        `M ${(1 - from.x) * width} ${from.y * height} L ${(1 - to.x) * width} ${to.y * height}`,
      );
    }
  }

  return path.join(" ");
}

export function FaceWireframeOverlay({ landmarks, videoWidth, videoHeight }: Props) {
  const path = useMemo(
    () => landmarks ? createWireframePath(landmarks, videoWidth, videoHeight) : "",
    [landmarks, videoWidth, videoHeight],
  );

  if (!path || videoWidth <= 0 || videoHeight <= 0) return null;

  return (
    <svg
      className="face-wireframe-layer"
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} fill="none" stroke="#39ff2b" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
