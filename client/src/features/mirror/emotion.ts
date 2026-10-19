import type { Category } from "@mediapipe/tasks-vision";

export type MoodId = "joyful" | "calm" | "focused" | "tense" | "surprised" | "reflective";

export type Mood = {
  id: MoodId;
  label: string;
  emoji: string;
  color: string;
  descriptor: string;
  suggestions: string[];
};

export type ExpressionRead = {
  mood: MoodId;
  confidence: number;
};

export const MOODS: Mood[] = [
  {
    id: "joyful",
    label: "Joyful",
    emoji: "☺️",
    color: "#d9f179",
    descriptor: "A little more room for the good stuff.",
    suggestions: [
      "Send someone a small note to share the good feeling.",
      "Put on one favorite song and let yourself enjoy it.",
      "Take a quick photo of something that made today feel lighter.",
    ],
  },
  {
    id: "calm",
    label: "Calm",
    emoji: "😌",
    color: "#b7d8c8",
    descriptor: "A softer pace might feel right.",
    suggestions: [
      "Take three slow breaths, letting each exhale last a little longer.",
      "Unclench your jaw and drop your shoulders for a moment.",
      "Give yourself two quiet minutes before the next thing.",
    ],
  },
  {
    id: "focused",
    label: "Focused",
    emoji: "🧐",
    color: "#a8d4df",
    descriptor: "Your attention looks gathered.",
    suggestions: [
      "Choose one small next step and give it your full attention.",
      "Clear one distraction from your space before you begin.",
      "Try a 15-minute focus sprint, then take a short stretch break.",
    ],
  },
  {
    id: "tense",
    label: "Tense",
    emoji: "😮‍💨",
    color: "#edb28f",
    descriptor: "A gentle reset could help you loosen up.",
    suggestions: [
      "Roll your shoulders slowly, then let your hands rest open.",
      "Step away for a minute and notice five things around you.",
      "Breathe in comfortably, then exhale slowly without forcing it.",
    ],
  },
  {
    id: "surprised",
    label: "Surprised",
    emoji: "😯",
    color: "#eacb76",
    descriptor: "Something may have caught your attention.",
    suggestions: [
      "Pause and name what just changed for you.",
      "Take a beat before deciding what the moment needs next.",
      "If it feels welcome, follow your curiosity for a minute.",
    ],
  },
  {
    id: "reflective",
    label: "Reflective",
    emoji: "🌙",
    color: "#c4b4e5",
    descriptor: "A little space to think may be welcome.",
    suggestions: [
      "Write one sentence about what is taking up your mind.",
      "Look away from the screen and let your thoughts settle.",
      "Ask yourself what would make the next hour feel easier.",
    ],
  },
];

export function getMood(id: MoodId): Mood {
  return MOODS.find((mood) => mood.id === id) ?? MOODS[1];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * MediaPipe returns facial blendshape activations, not emotion probabilities.
 * This deliberately broad heuristic turns a few visible-expression cues into
 * a playful mirror label; the UI explains that it is not a read of inner state.
 */
export function classifyExpression(categories: Category[]): ExpressionRead {
  const scores = new Map(categories.map((category) => [category.categoryName, category.score]));
  const get = (name: string) => scores.get(name) ?? 0;
  const avg = (...names: string[]) => names.reduce((sum, name) => sum + get(name), 0) / names.length;

  const smile = avg("mouthSmileLeft", "mouthSmileRight");
  const cheekLift = avg("cheekSquintLeft", "cheekSquintRight");
  const browDown = avg("browDownLeft", "browDownRight");
  const eyeWide = avg("eyeWideLeft", "eyeWideRight");
  const eyeSquint = avg("eyeSquintLeft", "eyeSquintRight");
  const frown = avg("mouthFrownLeft", "mouthFrownRight");
  const mouthPress = avg("mouthPressLeft", "mouthPressRight");
  const browUp = get("browInnerUp");
  const jawOpen = get("jawOpen");

  const candidates: Array<{ mood: MoodId; score: number }> = [
    { mood: "joyful", score: smile * 0.82 + cheekLift * 0.18 },
    { mood: "surprised", score: eyeWide * 0.34 + browUp * 0.32 + jawOpen * 0.34 },
    { mood: "tense", score: browDown * 0.38 + frown * 0.37 + mouthPress * 0.25 },
    { mood: "focused", score: eyeSquint * 0.58 + browDown * 0.22 + jawOpen * 0.08 },
  ];
  const strongest = candidates.reduce((best, candidate) => candidate.score > best.score ? candidate : best);
  const mood = strongest.score < 0.2 ? "calm" : strongest.mood;
  const confidence = Math.round(clamp(42 + strongest.score * 110, 42, 92));

  return { mood, confidence };
}
