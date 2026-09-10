"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { soundsEnabled, subscribeSounds, toggleSounds, unlockSounds } from "@/lib/sounds";
import type { TranslationProps } from "@/lib/translations";

export function SoundToggle({ t }: TranslationProps) {
  const enabled = useSyncExternalStore(subscribeSounds, soundsEnabled, () => true);
  useEffect(() => {
    window.addEventListener("pointerdown", unlockSounds);
    window.addEventListener("keydown", unlockSounds);

    return () => {
      window.removeEventListener("pointerdown", unlockSounds);
      window.removeEventListener("keydown", unlockSounds);
    };
  }, []);

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggleSounds}
      aria-label={enabled ? t.muteSounds : t.enableSounds}
      title={enabled ? t.muteSounds : t.enableSounds}
    >
      <Icon name={enabled ? "volume" : "muted"} />
    </button>
  );
}
