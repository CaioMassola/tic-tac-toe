import { Icon } from "@/components/icons";
import type { GameState, Mark } from "@/lib/game";
import type { TranslationProps } from "@/lib/translations";

type RoundHistoryProps = TranslationProps & {
  history: GameState["history"];
  getPlayerName: (mark: Mark) => string;
};

export function RoundHistory({ t, history, getPlayerName }: RoundHistoryProps) {
  return (
    <section className="panel p-6">
      <h2 className="font-semibold text-sm flex items-center gap-2">
        <Icon name="clock" className="text-muted w-4 h-4" />
        {t.history}
      </h2>
      {history.length ? (
        <ol className="mt-4 space-y-3">
          {history.map((item) => (
            <li className="flex justify-between gap-3 text-xs" key={item.round}>
              <span className="text-muted shrink-0">
                {t.round} {item.round}
              </span>
              <span className="truncate">
                {item.winner === "draw"
                  ? t.draw
                  : `${t.victory} ${getPlayerName(item.winner)}`}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-muted leading-6 mt-3">{t.emptyHistory}</p>
      )}
    </section>
  );
}
