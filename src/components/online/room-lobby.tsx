"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import type { Membership } from "@/lib/rooms";
import { useOnlineRoom } from "@/hooks/use-online-room";
import { OnlineGame } from "./online-game";
import { ConnectionNotice } from "./connection-notice";
import { RoomChat } from "./room-chat";
import type { TranslationProps } from "@/lib/translations";

export function RoomLobby({
  membership,
  t,
}: TranslationProps & { membership: Membership }) {
  const { room, connected, expired, pending, error, startGame, playMove, nextRound } =
    useOnlineRoom(membership);
  const blocked = !connected || expired || pending;
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
        className={room.players.length === 2 ? "online-room-grid" : "max-w-2xl mx-auto"}
      >
        <section className="panel p-6 sm:p-8 min-w-0" aria-label={t.roomLobby}>
          <h2 className="text-2xl font-bold">
            {room.game ? t.onlineMatch : t.roomLobby}
          </h2>
          {canInvite && (
            <>
              <p className="text-sm text-muted mt-5">{t.code}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <p
                  className="font-mono text-3xl tracking-[4px] select-all"
                  data-testid="room-code"
                >
                  {room.code}
                </p>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleCopyCode}
                >
                  <Icon name={copyStatus === "copied" ? "check" : "copy"} />
                  {copyStatus === "copied" ? t.codeCopied : t.copyCode}
                </button>
              </div>
              <p aria-live="polite" className="text-sm text-muted mt-2">
                {copyStatus === "copied"
                  ? t.codeCopied
                  : copyStatus === "error"
                    ? t.copyCodeError
                    : ""}
              </p>
              <p className="text-sm text-muted mt-3">{t.shareCode}</p>
            </>
          )}
          <p className="mt-4">
            {t.yourMark}: <strong>{membership.mark}</strong>
          </p>
          <ul className="space-y-3 mt-5">
            {room.players.map((player) => (
              <li key={player.mark}>
                <strong>{player.mark}</strong> — {player.nickname}
              </li>
            ))}
          </ul>
          {!room.game && (
            <p role="status" className="mt-6 font-semibold">
              {expired
                ? t.sessionExpired
                : !connected
                  ? t.reconnecting
                  : room.status === "READY"
                    ? t.roomReady
                    : t.waitingPlayer}
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
              className="button-primary mt-5"
              disabled={blocked || room.status !== "READY"}
              onClick={startGame}
            >
              {t.startOnlineGame}
            </button>
          ) : (
            <p className="text-sm text-muted mt-4">{t.waitingHost}</p>
          )}
          {error && (
            <p role="alert" className="form-alert mt-4">
              {t[error]}
            </p>
          )}
          <p className="text-sm text-muted mt-3">{t.lobbyNote}</p>
          <a href="/online" className="button-secondary mt-5">
            {t.backToRooms}
          </a>
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
