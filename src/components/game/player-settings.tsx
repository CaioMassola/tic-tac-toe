import type { ChangeEvent, MouseEvent } from "react";
import type { Mark } from "@/lib/game";
import type { TranslationProps } from "@/lib/translations";
type PlayerSettingsProps = TranslationProps & {
  name: string;
  playerMark: Mark;
  onNameChange: (name: string) => void;
  onMarkChange: (mark: Mark) => void;
};

export function PlayerSettings({
  t,
  name,
  playerMark,
  onNameChange,
  onMarkChange,
}: PlayerSettingsProps) {
  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    onNameChange(event.currentTarget.value);
  }

  function handleMarkChange(event: MouseEvent<HTMLButtonElement>) {
    const mark = event.currentTarget.value;
    if ((mark === "X" || mark === "O") && mark !== playerMark) onMarkChange(mark);
  }

  return (
    <section className="panel p-6">
      <h2 className="font-semibold text-sm">{t.players}</h2>
      <p className="text-xs text-muted mt-1.5 mb-5">{t.playersSub}</p>
      <label className="block text-sm">
        {t.nickname}
        <input
          className="input mt-2"
          maxLength={20}
          autoComplete="nickname"
          placeholder={t.nicknamePlaceholder}
          value={name}
          onChange={handleNameChange}
        />
      </label>
      <fieldset className="mt-5">
        <legend className="text-sm mb-2">{t.yourMark}</legend>
        <div className="segmented grid grid-cols-2 gap-1 p-1">
          {(["X", "O"] as const).map((mark) => (
            <button
              key={mark}
              type="button"
              aria-pressed={playerMark === mark}
              className={playerMark === mark ? "selected" : ""}
              value={mark}
              onClick={handleMarkChange}
            >
              {mark === "X" ? t.playFirst : t.playSecond}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted mt-3">{t.markChangeNote}</p>
    </section>
  );
}
