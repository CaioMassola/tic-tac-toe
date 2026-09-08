import { Icon, Symbol } from "@/components/icons";
import type { Mark } from "@/lib/game";
import type { TranslationProps } from "@/lib/translations";

type GameStatusProps = TranslationProps & {
  winner: Mark | "draw" | null;
  turn: Mark;
  getPlayerName: (mark: Mark) => string;
  turnLabel?: string;
  playerMark?: Mark;
};

export function GameStatus({
  t,
  winner,
  turn,
  getPlayerName,
  turnLabel,
  playerMark,
}: GameStatusProps) {
  const lost = !!playerMark && !!winner && winner !== "draw" && winner !== playerMark;
  const status =
    winner === "draw"
      ? t.draw
      : winner
        ? playerMark
          ? lost
            ? t.youLost
            : t.youWon
          : `${getPlayerName(winner)} ${t.winner}`
        : (turnLabel ?? `${t.turn} ${getPlayerName(turn)}`);

  return (
    <div
      className="text-center mt-7 mb-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`flex items-center justify-center gap-3 ${lost ? "text-danger" : ""}`}
      >
        <span className="w-7 h-7">
          {winner === "draw" ? (
            <Icon name="users" className="w-7 h-7 text-lilac" />
          ) : lost ? (
            <Icon name="info" className="w-7 h-7" />
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
        {winner === "draw" ? t.drawSub : lost ? t.lossSub : winner ? t.winSub : t.turnSub}
      </p>
    </div>
  );
}
