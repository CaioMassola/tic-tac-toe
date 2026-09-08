"use client";

import type { Membership } from "@/lib/rooms";
import { useOnlineRoom } from "@/hooks/use-online-room";
import { OnlineGame } from "./online-game";
import { ConnectionNotice } from "./connection-notice";
import type { TranslationProps } from "@/lib/translations";

export function RoomLobby({
  membership,
  t,
}: TranslationProps & { membership: Membership }) {
  const { room, connected, expired, pending, error, startGame, playMove, nextRound } =
    useOnlineRoom(membership);
  const blocked = !connected || expired || pending;

  return (
    <>
      {!room.game && <ConnectionNotice t={t} />}
      <section className="panel p-6 sm:p-8" aria-label={t.roomLobby}>
        <h2 className="text-2xl font-bold">{room.game ? t.onlineMatch : t.roomLobby}</h2>
        {!room.game && (
          <>
            <p className="text-sm text-muted mt-5">{t.code}</p>
            <p className="font-mono text-3xl tracking-[4px] mt-2" data-testid="room-code">
              {room.code}
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
    </>
  );
}
