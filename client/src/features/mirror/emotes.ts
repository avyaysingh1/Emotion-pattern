export type FaceEmoteId = "none" | "shades" | "bunny" | "crown" | "hearts" | "sparkles" | "mustache" | "handlebar" | "pencil";

export type NormalizedFacePoint = { x: number; y: number };

export type FaceAnchors = {
  eyeLeft: NormalizedFacePoint;
  eyeRight: NormalizedFacePoint;
  faceLeft: NormalizedFacePoint;
  faceRight: NormalizedFacePoint;
  forehead: NormalizedFacePoint;
  nose: NormalizedFacePoint;
};

export type FaceEmote = {
  id: FaceEmoteId;
  label: string;
  emoji: string;
};

export const FACE_EMOTES: readonly FaceEmote[] = [
  { id: "none", label: "Off", emoji: "○" },
  { id: "shades", label: "Shades", emoji: "🕶️" },
  { id: "bunny", label: "Bunny", emoji: "🐰" },
  { id: "crown", label: "Crown", emoji: "👑" },
  { id: "hearts", label: "Hearts", emoji: "💖" },
  { id: "sparkles", label: "Sparkles", emoji: "✨" },
  { id: "mustache", label: "Moustache", emoji: "🥸" },
  { id: "handlebar", label: "Handlebar", emoji: "🧔" },
  { id: "pencil", label: "Pencil", emoji: "〰️" },
];
