"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { gameReducer, getResult, initialGame, type Mark } from "@/lib/game";
import type { Dictionary } from "@/lib/translations";

export function useLocalGame(t: Dictionary) {
  const [state, dispatch] = useReducer(gameReducer, initialGame);
  const [names, setNames] = useState<Record<Mark, string>>({ X: "", O: "" });
  const { winner, line } = useMemo(() => getResult(state.board), [state.board]);

  const getPlayerName = useCallback(
    (mark: Mark) => names[mark].trim() || (mark === "X" ? t.playerX : t.playerO),
    [names, t.playerX, t.playerO],
  );

  const setPlayerName = useCallback((mark: Mark, name: string) => {
    setNames((currentNames) => ({ ...currentNames, [mark]: name }));
  }, []);

  const playMove = useCallback((index: number) => {
    dispatch({ type: "move", index });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: "next" });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  return {
    state,
    names,
    winner,
    line,
    getPlayerName,
    setPlayerName,
    playMove,
    nextRound,
    resetSession,
  };
}
