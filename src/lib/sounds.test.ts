import { beforeEach, afterEach, expect, it, vi } from "vitest";

const oscillators: {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onended?: () => void;
}[] = [];
const gain = {
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
};
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  oscillators.length = 0;
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      currentTime = 0;
      destination = {};
      createGain() {
        return { gain, connect: vi.fn(), disconnect: vi.fn() };
      }
      createOscillator() {
        const oscillator = {
          frequency: { value: 0 },
          connect: vi.fn(),
          disconnect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        oscillators.push(oscillator);

        return oscillator;
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

it("waits for interaction, synthesizes short cues and silences immediately", async () => {
  const audio = await import("./sounds");
  audio.playSound("win");
  expect(oscillators).toHaveLength(0);
  audio.unlockSounds();
  audio.playSound("win");
  expect(oscillators).toHaveLength(4);
  expect(oscillators[3].stop).toHaveBeenCalledWith(0.48);
  oscillators[0].onended!();
  expect(oscillators[0].disconnect).toHaveBeenCalledOnce();
  audio.toggleSounds();
  expect(gain.value).toBe(0);
  expect(localStorage.getItem("trio-sound")).toBe("off");
  audio.playSound("move");
  expect(oscillators).toHaveLength(4);
  audio.toggleSounds();
  audio.playSound("message");
  expect(oscillators).toHaveLength(6);
});

it("keeps mute usable when storage is blocked", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const audio = await import("./sounds");
  expect(audio.soundsEnabled()).toBe(true);
  const changed = vi.fn();
  const stop = audio.subscribeSounds(changed);
  audio.toggleSounds();
  expect(audio.soundsEnabled()).toBe(false);
  expect(changed).toHaveBeenCalledOnce();
  stop();
  audio.toggleSounds();
  expect(changed).toHaveBeenCalledOnce();
});

it("ignores suspended audio and handles rejected resume and device failures", async () => {
  const resume = vi.fn().mockRejectedValue(new Error("autoplay blocked"));
  const device = {
    state: "suspended",
    resume,
    createGain: () => ({ gain, connect: vi.fn() }),
    createOscillator: () => {
      throw new Error("device unavailable");
    },
  };
  vi.stubGlobal(
    "AudioContext",
    class {
      constructor() {
        return device;
      }
    },
  );
  const audio = await import("./sounds");
  audio.unlockSounds();
  await Promise.resolve();
  expect(resume).toHaveBeenCalledOnce();
  audio.playSound("move");
  expect(oscillators).toHaveLength(0);
  device.state = "running";
  expect(() => audio.playSound("move")).not.toThrow();
});

it("restores mute and tolerates browsers without audio support", async () => {
  localStorage.setItem("trio-sound", "off");
  const audio = await import("./sounds");
  expect(audio.soundsEnabled()).toBe(false);
  audio.unlockSounds();
  expect(oscillators).toHaveLength(0);
  vi.stubGlobal("AudioContext", undefined);
  expect(() => audio.toggleSounds()).not.toThrow();
  expect(() => audio.playSound("move")).not.toThrow();
});
