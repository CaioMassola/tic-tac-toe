import { Symbol } from "@/components/icons";
import type { GameState, Mark } from "@/lib/game";
import type { TranslationProps } from "@/lib/translations";

type ScoreboardProps = TranslationProps & {
  scores: GameState["scores"];
  getPlayerName: (mark: Mark) => string;
};

export function Scoreboard({ t, scores, getPlayerName }: ScoreboardProps) {
  return (
    <section className="panel p-6">
      <h2 className="eyebrow text-muted mb-5">{t.scoreboard}</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        {(["X", "draw", "O"] as const).map((mark) => (
          <div
            className={`score-box ${mark === "draw" ? "" : mark === "X" ? "score-x" : "score-o"}`}
            key={mark}
          >
            <div className="h-6 flex justify-center">
              {mark === "draw" ? (
                <span className="text-muted text-xl">=</span>
              ) : (
                <Symbol mark={mark} className="w-6 h-6" />
              )}
            </div>
            <strong
              className="block text-3xl mt-2 font-semibold tabular-nums"
              data-testid={`score-${mark}`}
            >
              {scores[mark]}
            </strong>
            <span
              className="block truncate text-[10px] text-muted mt-1"
              title={mark === "draw" ? t.draws : getPlayerName(mark)}
            >
              {mark === "draw" ? t.draws : getPlayerName(mark)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
