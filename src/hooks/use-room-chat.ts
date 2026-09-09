"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatCommand, watchChat, type Chat } from "@/lib/rooms";

export function useRoomChat(token: string) {
  const [chat, setChat] = useState<Chat>({ revision: -1, messages: [], typing: {} });
  const [connected, setConnected] = useState(false);
  const [expired, setExpired] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const sending = useRef(false);
  const lastTyping = useRef(-Infinity);
  const retry = useRef({ id: "", text: "" });
  const update = useCallback((snapshot: Chat) => {
    setChat((current) => (snapshot.revision >= current.revision ? snapshot : current));
  }, []);

  useEffect(
    () => watchChat(token, update, setConnected, () => setExpired(true)),
    [token, update],
  );

  async function send(text: string) {
    if (sending.current || !connected || expired || !text.trim()) return false;
    sending.current = true;
    setPending(true);
    setError(false);
    if (retry.current.text !== text || !retry.current.id)
      retry.current = { id: crypto.randomUUID(), text };
    try {
      update(await sendChatCommand(token, retry.current));
      retry.current = { id: "", text: "" };

      return true;
    } catch (cause) {
      if (cause instanceof Error && cause.message === "sessionExpired") setExpired(true);
      setError(true);

      return false;
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  function typing(active: boolean) {
    if (!connected || expired) return;
    if (active && Date.now() - lastTyping.current < 2000) return;
    lastTyping.current = active ? Date.now() : -Infinity;
    void sendChatCommand(token, { typing: active })
      .then(update)
      .catch(() => {
        // Typing is ephemeral; a failed notification expires automatically.
      });
  }

  return { chat, connected, expired, pending, error, send, typing };
}
