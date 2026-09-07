"use client";

import { useState, type ChangeEvent, type FormEvent, type MouseEvent } from "react";

type RoomMode = "create" | "join";
type RoomError = "invalidName" | "invalidCode" | "unavailable" | null;

export function useRoomForm() {
  const [mode, setMode] = useState<RoomMode>("create");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<RoomError>(null);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (nickname.trim().length < 2) {
      setError("invalidName");

      return;
    }

    if (mode === "join" && !/^[A-Z0-9]{6}$/.test(code)) {
      setError("invalidCode");

      return;
    }

    setError("unavailable");
  }

  return {
    mode,
    nickname,
    code,
    error,
    handleModeChange,
    handleNicknameChange,
    handleCodeChange,
    handleSubmit,
  };
}
