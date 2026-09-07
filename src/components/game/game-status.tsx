import { Icon, Symbol } from "@/components/icons";
import type { Mark } from "@/lib/game";
import type { TranslationProps } from "@/lib/translations";

type GameStatusProps = TranslationProps & {
  winner: Mark | "draw" | null;
  turn: Mark;
  getPlayerName: (mark: Mark) => string;
};

export function GameStatus({ t, winner, turn, getPlayerName }: GameStatusProps) {
  const status =
    winner === "draw"
      ? t.draw
      : winner
        ? `${getPlayerName(winner)} ${t.winner}`
        : `${t.turn} ${getPlayerName(turn)}`;

  return (
    <div
      className="text-center mt-7 mb-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-center gap-3">
        <span className="w-7 h-7">
          {winner === "draw" ? (
            <Icon name="users" className="w-7 h-7 text-lilac" />
          ) : winner ? (
            <Icon name="trophy" className="w-7 h-7 text-accent" />
          ) : (
            <Symbol mark={turn} />
          )}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight break-words min-w-0">
          {status}
        </h2>
      </div>
      <p className="text-xs sm:text-sm text-muted mt-2">
        {winner === "draw" ? t.drawSub : winner ? t.winSub : t.turnSub}
      </p>
    </div>
  );
}
