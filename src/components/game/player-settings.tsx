import type { ChangeEvent } from "react";
import { Symbol } from "@/components/icons";
import type { Mark } from "@/lib/game";
import type { TranslationProps } from "@/lib/translations";

type PlayerSettingsProps = TranslationProps & {
  names: Record<Mark, string>;
  onNameChange: (mark: Mark, name: string) => void;
};

export function PlayerSettings({ t, names, onNameChange }: PlayerSettingsProps) {
  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;

    if (name === "X" || name === "O") {
      onNameChange(name, value);
    }
  }

  return (
    <section className="panel p-6">
      <h2 className="font-semibold text-sm">{t.players}</h2>
      <p className="text-xs text-muted mt-1.5 mb-5">{t.playersSub}</p>
      {(["X", "O"] as const).map((mark) => (
        <label className="flex items-center gap-3 mt-3" key={mark}>
          <span className="h-7 w-7 shrink-0">
            <Symbol mark={mark} />
          </span>
          <span className="sr-only">{mark === "X" ? t.nameX : t.nameO}</span>
          <input
            className="input min-w-0"
            maxLength={20}
            placeholder={mark === "X" ? t.playerX : t.playerO}
            value={names[mark]}
            name={mark}
            onChange={handleNameChange}
          />
        </label>
      ))}
    </section>
  );
}
