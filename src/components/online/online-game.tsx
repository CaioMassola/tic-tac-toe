import type { Mark } from "@/lib/game";
import type { OnlineGameState, Room } from "@/lib/rooms";
import type { TranslationProps } from "@/lib/translations";
import { GameBoard } from "@/components/game/game-board";
import { GameStatus } from "@/components/game/game-status";
import { Scoreboard } from "@/components/game/scoreboard";
import { RoundHistory } from "@/components/game/round-history";

type Props = TranslationProps & {
  game: OnlineGameState;
  players: Room["players"];
  mark: Mark;
  blocked: boolean;
  onMove: (index: number) => void;
  onNext: () => void;
};

export function OnlineGame({ t, game, players, mark, blocked, onMove, onNext }: Props) {
  const ready = game.rematchReady.includes(mark);
  const opponentReady = game.rematchReady.includes(mark === "X" ? "O" : "X");

  function getPlayerName(player: Mark) {
    return players[player === "X" ? 0 : 1].nickname;
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-muted">
        {t.round} {game.round}
      </p>
      <GameStatus
        t={t}
        winner={game.winner}
        turn={game.turn}
        getPlayerName={getPlayerName}
        playerMark={mark}
      />
      <fieldset disabled={blocked || game.turn !== mark} aria-label={t.board}>
        <GameBoard
          t={t}
          board={game.board}
          turn={game.turn}
          winner={game.winner}
          winningLine={game.line}
          onMove={onMove}
        />
      </fieldset>
      <div className="text-center my-5">
        {game.winner ? (
          <>
            <button
              className="button-primary"
              disabled={blocked || ready}
              onClick={onNext}
            >
              {ready
                ? t.rematchConfirmed
                : opponentReady
                  ? t.rematchRequest.replace("{name}", () =>
                      getPlayerName(mark === "X" ? "O" : "X"),
                    )
                  : game.winner !== "draw" && game.winner !== mark
                    ? t.requestRematch
                    : t.next}
            </button>
            <p className="text-sm text-muted mt-3" aria-live="polite">
              {ready
                ? t.waitingRematch
                : opponentReady
                  ? t.opponentRematchReady
                  : t.rematchPrompt}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            {game.turn === mark ? t.onlineYourTurn : t.onlineOpponentTurn}
          </p>
        )}
      </div>
      <div className="space-y-4">
        <Scoreboard t={t} scores={game.scores} getPlayerName={getPlayerName} />
        <RoundHistory t={t} history={game.history} getPlayerName={getPlayerName} />
      </div>
    </div>
  );
}
