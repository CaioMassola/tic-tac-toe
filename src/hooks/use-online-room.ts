"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  sendRoomCommand,
  watchRoom,
  type Membership,
  type Room,
  type RoomCommand,
} from "@/lib/rooms";

export function useOnlineRoom(membership: Membership) {
  const [room, setRoom] = useState(membership.room);
  const [connected, setConnected] = useState(false);
  const [expired, setExpired] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"actionFailed" | "actionRejected" | null>(null);
  const sending = useRef(false);
  const updateRoom = useCallback((snapshot: Room) => {
    setRoom((current) => (snapshot.revision >= current.revision ? snapshot : current));
  }, []);

  useEffect(() => {
    const stop = watchRoom(membership.token, updateRoom, setConnected, () =>
      setExpired(true),
    );
    const timeout = window.setTimeout(
      () => {
        setExpired(true);
        stop();
      },
      Math.max(0, Date.parse(membership.room.expiresAt) - Date.now()),
    );

    return () => {
      window.clearTimeout(timeout);
      stop();
    };
  }, [membership, updateRoom]);

  async function command(action: RoomCommand) {
    if (sending.current || !connected || expired) return;
    sending.current = true;
    setPending(true);
    setError(null);
    try {
      updateRoom(await sendRoomCommand(membership.token, room.revision, action));
    } catch (cause) {
      if (cause instanceof Error && cause.message === "sessionExpired") setExpired(true);
      else
        setError(
          cause instanceof Error && cause.message === "actionRejected"
            ? "actionRejected"
            : "actionFailed",
        );
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  function startGame() {
    void command({ type: "start" });
  }

  function playMove(index: number) {
    void command({ type: "move", index });
  }

  function nextRound() {
    void command({ type: "next" });
  }

  return { room, connected, expired, pending, error, startGame, playMove, nextRound };
}
