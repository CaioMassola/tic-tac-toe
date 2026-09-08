"use client";

import {
  useState,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { enterRoom, type Membership, type RoomError } from "@/lib/rooms";

type RoomMode = "create" | "join";

export function useRoomForm() {
  const [mode, setMode] = useState<RoomMode>("create");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<RoomError | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  function handleModeChange(event: MouseEvent<HTMLButtonElement>) {
    const value = event.currentTarget.value;

    if (value === "create" || value === "join") {
      setMode(value);
      setError(null);
    }
  }

  function handleNicknameChange(event: ChangeEvent<HTMLInputElement>) {
    setNickname(event.currentTarget.value);
    setError(null);
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCode(event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      setError("invalidName");

      return;
    }

    if (mode === "join" && !/^[A-Z0-9]{6}$/.test(code)) {
      setError("invalidCode");

      return;
    }

    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      setMembership(await enterRoom(mode, nickname, code));
    } catch (cause) {
      setError(
        cause instanceof Error &&
          (cause.message === "roomNotFound" || cause.message === "roomFull")
          ? cause.message
          : "unavailable",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return {
    mode,
    nickname,
    code,
    error,
    pending,
    membership,
    handleModeChange,
    handleNicknameChange,
    handleCodeChange,
    handleSubmit,
  };
}
