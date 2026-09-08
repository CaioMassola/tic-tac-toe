"use client";

import { useRef } from "react";
import { Icon } from "@/components/icons";
import { PageIntro } from "@/components/shared/page-intro";
import { useTranslation } from "@/hooks/use-translation";
import { useLocalGame } from "@/hooks/use-local-game";
import { GameBoard } from "./game-board";
import { GameStatus } from "./game-status";
import { Scoreboard } from "./scoreboard";
import { PlayerSettings } from "./player-settings";
import { RoundHistory } from "./round-history";
import { ResetSessionDialog } from "./reset-session-dialog";

export function LocalGameScreen() {
  const t = useTranslation();
  const {
    state,
    name,
    playerMark,
    thinking,
    setPlayerMark,
    setPlayerName,
    winner,
    line,
    getPlayerName,
    playMove,
    nextRound,
    resetSession,
  } = useLocalGame(t);
  const dialog = useRef<HTMLDialogElement>(null);

  function openResetDialog() {
    dialog.current?.showModal();
  }

  return (
    <>
      <PageIntro t={t} label={t.localMode} title={t.gameTitle} subtitle={t.gameSub} />

      <div className="grid lg:grid-cols-[1fr_330px] gap-6 items-start">
        <section className="panel game-panel p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="badge accent-badge">
              <span className="status-dot" />
              {t.local}
            </span>
            <span className="text-xs text-muted font-mono">
              {t.round} {String(state.round).padStart(2, "0")}
            </span>
          </div>

          <GameStatus
            t={t}
            winner={winner}
            turn={state.turn}
            getPlayerName={getPlayerName}
            turnLabel={
              state.turn === playerMark
                ? name.trim()
                  ? `${t.yourTurn}, ${name.trim()}`
                  : t.yourTurn
                : undefined
            }
          />

          <fieldset disabled={thinking}>
            <GameBoard
              t={t}
              board={state.board}
              turn={state.turn}
              winner={winner}
              winningLine={line}
              onMove={playMove}
            />
          </fieldset>

          <div className="flex justify-center mt-6 min-h-12">
            {winner ? (
              <button onClick={nextRound} className="button-primary">
                <Icon name="refresh" />
                {t.next}
              </button>
            ) : (
              <span className="text-muted text-xs flex items-center gap-2">
                <Icon name="users" className="w-4 h-4" />
                {thinking ? t.computerThinking : t.local}
              </span>
            )}
          </div>
          <div className="border-t border-line mt-5 pt-5 text-center">
            <button
              className="text-xs text-muted inline-flex items-center gap-2 hover:text-foreground"
              onClick={openResetDialog}
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              {t.reset}
            </button>
          </div>
        </section>

        <aside className="space-y-5">
          <Scoreboard t={t} scores={state.scores} getPlayerName={getPlayerName} />

          <PlayerSettings
            t={t}
            name={name}
            playerMark={playerMark}
            onNameChange={setPlayerName}
            onMarkChange={setPlayerMark}
          />

          <RoundHistory t={t} history={state.history} getPlayerName={getPlayerName} />

          <p className="text-xs text-muted leading-5 px-1 flex gap-2">
            <Icon name="info" className="w-4 h-4 mt-0.5" />
            {t.sessionNote}
          </p>
        </aside>
      </div>
      <div className="tip-banner mt-6 flex items-center gap-4">
        <Icon name="spark" className="text-accent" />
        <p className="text-sm">
          <strong>{t.strategy}</strong>
          <span className="text-muted block sm:inline sm:ml-3 mt-1 sm:mt-0">
            {t.strategyText}
          </span>
        </p>
      </div>

      <ResetSessionDialog t={t} dialogRef={dialog} onConfirm={resetSession} />
    </>
  );
}
