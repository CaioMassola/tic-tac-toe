"use client";

import { useState } from "react";
import { Icon, Symbol } from "@/components/icons";
import type { Membership } from "@/lib/rooms";
import { useOnlineRoom } from "@/hooks/use-online-room";
import { OnlineGame } from "./online-game";
import { ConnectionNotice } from "./connection-notice";
import { RoomChat } from "./room-chat";
import type { TranslationProps } from "@/lib/translations";

function WaitingDots() {
  return (
    <span className="lobby-waiting-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function RoomLobby({
  membership,
  t,
}: TranslationProps & { membership: Membership }) {
  const { room, connected, expired, pending, error, startGame, playMove, nextRound } =
    useOnlineRoom(membership);
  const blocked = !connected || expired || pending;
  const waitingForPlayer = connected && !expired && !room.game && room.players.length < 2;
  const canInvite = !room.game && membership.mark === "X" && room.players.length < 2;
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <>
      {canInvite && <ConnectionNotice t={t} />}
      <div
        className={room.players.length === 2 ? "online-room-grid" : "max-w-3xl mx-auto"}
      >
        <section className="panel p-6 sm:p-8 min-w-0" aria-label={t.roomLobby}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={room.game ? "hidden" : "mode-icon shrink-0"}>
                <Icon name="users" />
              </span>
              <h2 className={room.game ? "text-lg font-bold" : "text-2xl font-bold"}>
                {room.game ? t.onlineMatch : t.roomLobby}
              </h2>
            </div>
            <span className="badge accent-badge">
              {t.yourMark}: <strong>{membership.mark}</strong>
            </span>
          </div>
          {canInvite && (
            <div className="lobby-invite mt-6">
              <div>
                <p className="eyebrow text-muted">{t.code}</p>
                <p
                  className="font-mono text-3xl sm:text-4xl tracking-[4px] select-all mt-3"
                  data-testid="room-code"
                >
                  {room.code}
                </p>
                <p className="text-sm text-muted leading-6 mt-3">{t.shareCode}</p>
              </div>
              <div>
                <button
                  type="button"
                  className="button-secondary w-full whitespace-nowrap"
                  onClick={handleCopyCode}
                >
                  <Icon name={copyStatus === "copied" ? "check" : "copy"} />
                  {copyStatus === "copied" ? t.codeCopied : t.copyCode}
                </button>
                <p aria-live="polite" className="text-sm text-muted mt-2">
                  {copyStatus === "copied"
                    ? t.codeCopied
                    : copyStatus === "error"
                      ? t.copyCodeError
                      : ""}
                </p>
              </div>
            </div>
          )}
          {!room.game && (
            <ul className="grid sm:grid-cols-2 gap-3 mt-6">
              {room.players.map((player) => (
                <li
                  key={player.mark}
                  className={`lobby-player lobby-player-${player.mark}`}
                >
                  <Symbol mark={player.mark} className="w-10 h-10 shrink-0" />
                  <span className="min-w-0 break-words">{player.nickname}</span>
                </li>
              ))}
              {room.players.length < 2 && (
                <li className="lobby-player lobby-player-empty">
                  <Icon name="users" className="w-10 h-10 shrink-0" />
                  <span className="text-sm">{t.waitingPlayer}</span>
                  {waitingForPlayer && <WaitingDots />}
                </li>
              )}
            </ul>
          )}
          {!room.game && (
            <p
              role="status"
              className="mt-6 font-semibold flex items-center gap-3 border-t border-line pt-6"
            >
              <Icon
                name={
                  room.status === "READY" && connected && !expired ? "check" : "clock"
                }
                className="shrink-0 text-accent"
              />
              {expired
                ? t.sessionExpired
                : !connected
                  ? t.reconnecting
                  : room.status === "READY"
                    ? t.roomReady
                    : t.waitingPlayer}
              {waitingForPlayer && <WaitingDots />}
            </p>
          )}
          {room.game ? (
            <>
              {(expired || !connected) && (
                <p role="alert" className="form-alert mt-4">
                  {expired ? t.sessionExpired : t.reconnecting}
                </p>
              )}
              <OnlineGame
                t={t}
                game={room.game}
                players={room.players}
                mark={membership.mark}
                blocked={blocked}
                onMove={playMove}
                onNext={nextRound}
              />
            </>
          ) : membership.mark === "X" ? (
            <button
              className="button-primary lobby-start mt-5"
              disabled={blocked || room.status !== "READY"}
              onClick={startGame}
            >
              {t.startOnlineGame}
              <Icon name="arrow" />
            </button>
          ) : (
            <p className="text-sm text-muted mt-4">{t.waitingHost}</p>
          )}
          {error && (
            <p role="alert" className="form-alert mt-4">
              {t[error]}
            </p>
          )}
          <div className="border-t border-line mt-6 pt-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-xs text-muted leading-5 flex-1">{t.lobbyNote}</p>
            <a href="/online" className="button-secondary shrink-0">
              <Icon name="back" />
              {t.backToRooms}
            </a>
          </div>
        </section>
        {room.players.length === 2 && (
          <RoomChat
            membership={membership}
            players={room.players}
            disabled={!connected || expired}
            t={t}
          />
        )}
      </div>
    </>
  );
}
