import type { FaceAnchors, FaceEmoteId, NormalizedFacePoint } from "./emotes";

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const MUSTACHE_PATHS: Partial<Record<FaceEmoteId, string>> = {
  mustache: "M 0 0 C -.12 -.10 -.24 -.16 -.34 -.12 C -.35 -.02 -.31 .11 -.20 .13 C -.10 .15 -.04 .08 0 .05 C .04 .08 .10 .15 .20 .13 C .31 .11 .35 -.02 .34 -.12 C .24 -.16 .12 -.10 0 0 Z",
  handlebar: "M 0 0 C -.12 -.07 -.22 -.14 -.31 -.11 C -.40 -.08 -.37 .04 -.27 .04 C -.35 .12 -.36 .23 -.29 .27 C -.23 .30 -.18 .18 -.16 .09 C -.11 .06 -.05 .06 0 .10 C .05 .06 .11 .06 .16 .09 C .18 .18 .23 .30 .29 .27 C .36 .23 .35 .12 .27 .04 C .37 .04 .40 -.08 .31 -.11 C .22 -.14 .12 -.07 0 0 Z",
  pencil: "M -.35 .04 C -.22 -.01 -.10 -.02 0 .03 C .10 -.02 .22 -.01 .35 .04 L .34 .11 C .18 .07 .08 .08 0 .10 C -.08 .08 -.18 .07 -.34 .11 Z",
};

type Props = {
  emoteId: FaceEmoteId;
  anchors: FaceAnchors | null;
  videoWidth: number;
  videoHeight: number;
};

type Point = { x: number; y: number };

function mirroredPixels(point: NormalizedFacePoint, width: number, height: number): Point {
  return { x: (1 - point.x) * width, y: point.y * height };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function FaceEmoteOverlay({ emoteId, anchors, videoWidth, videoHeight }: Props) {
  if (!anchors || emoteId === "none" || videoWidth <= 0 || videoHeight <= 0) return null;

  const eyes = [
    mirroredPixels(anchors.eyeLeft, videoWidth, videoHeight),
    mirroredPixels(anchors.eyeRight, videoWidth, videoHeight),
  ].sort((a, b) => a.x - b.x);
  const faceSides = [
    mirroredPixels(anchors.faceLeft, videoWidth, videoHeight),
    mirroredPixels(anchors.faceRight, videoWidth, videoHeight),
  ].sort((a, b) => a.x - b.x);
  const [eyeLeft, eyeRight] = eyes;
  const [faceLeft, faceRight] = faceSides;
  const eyeCenter = midpoint(eyeLeft, eyeRight);
  const faceCenter = midpoint(faceLeft, faceRight);
  const forehead = mirroredPixels(anchors.forehead, videoWidth, videoHeight);
  const nose = mirroredPixels(anchors.nose, videoWidth, videoHeight);
  const eyeDistance = Math.max(distance(eyeLeft, eyeRight), videoWidth * 0.035);
  const faceWidth = Math.max(distance(faceLeft, faceRight), eyeDistance * 1.7, videoWidth * 0.08);
  const angle = Math.atan2(eyeRight.y - eyeLeft.y, eyeRight.x - eyeLeft.x) * (180 / Math.PI);
  const cheekY = eyeCenter.y + (nose.y - eyeCenter.y) * 0.68;
  const cheekLeftX = faceLeft.x + faceWidth * 0.14;
  const cheekRightX = faceRight.x - faceWidth * 0.14;
  const emoteTransform = (x: number, y: number) => `translate(${x} ${y}) rotate(${angle})`;
  const crownWidth = faceWidth * 0.64;
  const crownHeight = faceWidth * 0.36;
  const halfCrown = crownWidth / 2;

  return (
    <svg
      className="face-emote-layer"
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {emoteId === "shades" && (
        <text
          x={eyeCenter.x}
          y={eyeCenter.y}
          transform={emoteTransform(eyeCenter.x, eyeCenter.y)}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={EMOJI_FONT}
          fontSize={Math.max(28, eyeDistance * 1.85)}
        >
          🕶️
        </text>
      )}

      {emoteId === "bunny" && (
        <g transform={emoteTransform(faceCenter.x, forehead.y + faceWidth * 0.10)}>
          <ellipse cx={-faceWidth * 0.19} cy={-faceWidth * 0.27} rx={faceWidth * 0.12} ry={faceWidth * 0.37} fill="#fff8f5" stroke="#d8aaa5" strokeWidth={faceWidth * 0.025} />
          <ellipse cx={-faceWidth * 0.19} cy={-faceWidth * 0.28} rx={faceWidth * 0.055} ry={faceWidth * 0.27} fill="#efb6bd" />
          <ellipse cx={faceWidth * 0.19} cy={-faceWidth * 0.27} rx={faceWidth * 0.12} ry={faceWidth * 0.37} fill="#fff8f5" stroke="#d8aaa5" strokeWidth={faceWidth * 0.025} />
          <ellipse cx={faceWidth * 0.19} cy={-faceWidth * 0.28} rx={faceWidth * 0.055} ry={faceWidth * 0.27} fill="#efb6bd" />
        </g>
      )}

      {emoteId === "crown" && (
        <g transform={emoteTransform(faceCenter.x, forehead.y - faceWidth * 0.08)}>
          <path
            d={`M ${-halfCrown} ${crownHeight * 0.34} L ${-halfCrown} ${-crownHeight * 0.34} L ${-crownWidth * 0.20} ${crownHeight * 0.02} L 0 ${-crownHeight * 0.58} L ${crownWidth * 0.20} ${crownHeight * 0.02} L ${halfCrown} ${-crownHeight * 0.34} L ${halfCrown} ${crownHeight * 0.34} Z`}
            fill="#d9f179"
            stroke="#fff8da"
            strokeWidth={faceWidth * 0.022}
            strokeLinejoin="round"
          />
          <rect x={-halfCrown} y={crownHeight * 0.22} width={crownWidth} height={crownHeight * 0.16} rx={crownHeight * 0.05} fill="#a9bf51" />
          <circle cx={0} cy={-crownHeight * 0.24} r={faceWidth * 0.035} fill="#fff8da" />
        </g>
      )}

      {emoteId === "hearts" && (
        <g fontFamily={EMOJI_FONT} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(24, faceWidth * 0.27)}>
          <text x={cheekLeftX} y={cheekY} transform={`rotate(${angle} ${cheekLeftX} ${cheekY})`}>💖</text>
          <text x={cheekRightX} y={cheekY} transform={`rotate(${angle} ${cheekRightX} ${cheekY})`}>💖</text>
        </g>
      )}

      {emoteId === "sparkles" && (
        <g fontFamily={EMOJI_FONT} textAnchor="middle" dominantBaseline="central">
          <text x={faceCenter.x} y={forehead.y - faceWidth * 0.18} fontSize={Math.max(26, faceWidth * 0.34)}>✨</text>
          <text x={cheekLeftX} y={eyeCenter.y - faceWidth * 0.08} fontSize={Math.max(18, faceWidth * 0.16)}>✦</text>
          <text x={cheekRightX} y={eyeCenter.y - faceWidth * 0.08} fontSize={Math.max(18, faceWidth * 0.16)}>✦</text>
        </g>
      )}

      {MUSTACHE_PATHS[emoteId] && (
        <g transform={`translate(${nose.x} ${nose.y + faceWidth * 0.045}) rotate(${angle}) scale(${faceWidth})`}>
          <path d={MUSTACHE_PATHS[emoteId]} fill="#403029" stroke="#241d19" strokeWidth=".012" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
