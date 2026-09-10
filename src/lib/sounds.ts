"use client";

export type Sound = "move" | "join" | "turn" | "win" | "lose" | "draw" | "message";

const notes: Record<Sound, number[]> = {
  move: [440],
  join: [523, 659],
  turn: [659, 880],
  win: [523, 659, 784, 1047],
  lose: [392, 330, 262],
  draw: [440, 440],
  message: [880, 1047],
};
let context: AudioContext | undefined;
let master: GainNode | undefined;
let enabled: boolean | undefined;

export function soundsEnabled() {
  if (enabled !== undefined) return enabled;
  try {
    return localStorage.getItem("trio-sound") !== "off";
  } catch {
    return true;
  }
}

export function unlockSounds() {
  if (!soundsEnabled()) return;
  try {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.08;
      master.connect(context.destination);
    }
    if (context.state === "suspended") void context.resume().catch(() => {});
  } catch {
    // Audio is optional on browsers without Web Audio support.
  }
}

export function toggleSounds() {
  enabled = !soundsEnabled();
  try {
    localStorage.setItem("trio-sound", enabled ? "on" : "off");
  } catch {
    // Retain the setting in memory when storage is unavailable.
  }
  if (master) master.gain.value = enabled ? 0.08 : 0;
  if (enabled) unlockSounds();
  window.dispatchEvent(new Event("trio-sound"));
}

export function subscribeSounds(callback: () => void) {
  window.addEventListener("trio-sound", callback);

  return () => window.removeEventListener("trio-sound", callback);
}

export function playSound(sound: Sound) {
  if (!soundsEnabled() || !context || !master || context.state !== "running") return;
  try {
    notes[sound].forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const envelope = context!.createGain();
      const start = context!.currentTime + index * 0.12;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(1, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.11);
      oscillator.connect(envelope);
      envelope.connect(master!);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + 0.12);
    });
  } catch {
    // An unavailable audio device must never interrupt the game.
  }
}
