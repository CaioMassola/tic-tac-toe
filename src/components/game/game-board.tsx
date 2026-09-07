import { memo, type MouseEvent } from "react";
import { Symbol } from "@/components/icons";
import type { Board, Mark } from "@/lib/game";
import type { TranslationProps } from "@/lib/translations";

type GameBoardProps = TranslationProps & {
  board: Board;
  turn: Mark;
  winner: Mark | "draw" | null;
  winningLine: number[];
  onMove: (index: number) => void;
};

export const GameBoard = memo(function GameBoard({
  t,
  board,
  turn,
  winner,
  winningLine,
  onMove,
}: GameBoardProps) {
  function handleCellClick(event: MouseEvent<HTMLButtonElement>) {
    const index = Number(event.currentTarget.value);

    onMove(index);
  }

  return (
    <div className="game-board" role="group" aria-label={t.board}>
      {board.map((mark, index) => (
        <button
          key={index}
          aria-label={`${t.cell} ${index + 1}: ${mark || t.empty}`}
          disabled={!!mark || !!winner}
          value={index}
          onClick={handleCellClick}
          className={`game-cell ${winningLine.includes(index) ? "won" : ""} ${winner && !winningLine.includes(index) ? "finished" : ""}`}
        >
          {mark ? (
            <Symbol mark={mark} className="placed-mark" />
          ) : !winner ? (
            <Symbol mark={turn} className="ghost-mark" />
          ) : null}
        </button>
      ))}
    </div>
  );
});
