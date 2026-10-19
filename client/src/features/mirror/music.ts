import type { MoodId } from "./emotion";

const NOTES: Record<MoodId, number[]> = {
  joyful: [261.63, 329.63, 392, 329.63, 440, 392, 329.63, 293.66],
  calm: [196, 220, 261.63, 220, 174.61, 196, 220, 261.63],
  focused: [220, 261.63, 293.66, 261.63, 329.63, 293.66, 261.63, 220],
  tense: [174.61, 196, 220, 196, 164.81, 174.61, 196, 220],
  surprised: [220, 261.63, 329.63, 293.66, 392, 329.63, 261.63, 293.66],
  reflective: [164.81, 196, 220, 261.63, 220, 196, 174.61, 196],
};

export type AmbientPlayer = {
  setMood: (mood: MoodId) => void;
  setVolume: (volume: number) => void;
  stop: () => void;
};

/** A quiet, original soundscape synthesized in this browser tab. */
export function createAmbientPlayer(initialMood: MoodId, initialVolume: number): AmbientPlayer {
  const context = new window.AudioContext();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 950;
  master.gain.value = 0;
  filter.connect(master);
  master.connect(context.destination);

  const fundamental = context.createOscillator();
  const harmony = context.createOscillator();
  const fundamentalGain = context.createGain();
  const harmonyGain = context.createGain();
  fundamental.type = "triangle";
  harmony.type = "sine";
  fundamentalGain.gain.value = 0.3;
  harmonyGain.gain.value = 0.15;
  fundamental.connect(fundamentalGain).connect(filter);
  harmony.connect(harmonyGain).connect(filter);
  fundamental.start();
  harmony.start();

  let mood = initialMood;
  let step = 0;
  let stopped = false;
  const now = context.currentTime;
  master.gain.setTargetAtTime(Math.max(0, Math.min(1, initialVolume)) * 0.18, now, 0.8);

  const playStep = () => {
    if (stopped) return;
    const scale = NOTES[mood];
    const frequency = scale[step % scale.length];
    fundamental.frequency.setTargetAtTime(frequency, context.currentTime, 0.6);
    harmony.frequency.setTargetAtTime(frequency * 1.5, context.currentTime, 0.8);
    filter.frequency.setTargetAtTime(mood === "tense" ? 700 : 1050, context.currentTime, 1.2);
    step += 1;
  };

  const interval = window.setInterval(playStep, 1700);
  playStep();
  void context.resume();

  return {
    setMood(nextMood) {
      mood = nextMood;
      step = 0;
      playStep();
    },
    setVolume(volume) {
      master.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)) * 0.18, context.currentTime, 0.2);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      window.clearInterval(interval);
      master.gain.setTargetAtTime(0, context.currentTime, 0.18);
      window.setTimeout(() => {
        fundamental.stop();
        harmony.stop();
        void context.close();
      }, 900);
    },
  };
}
