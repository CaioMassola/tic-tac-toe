"use client";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  gameReducer,
  getResult,
  initialGame,
  type GameState,
  type Mark,
} from "@/lib/game";
import { getComputerMove } from "@/lib/computer";
import type { Dictionary } from "@/lib/translations";
type Session = { game: GameState; playerMark: Mark };
type Action =
  | { type: "human"; index: number }
  | { type: "computer"; index: number }
  | { type: "mark"; mark: Mark }
  | { type: "next" | "reset" };

function sessionReducer(session: Session, action: Action): Session {
  const { game, playerMark } = session;
  if (action.type === "mark") return { game: initialGame, playerMark: action.mark };
  if (action.type === "human" || action.type === "computer") {
    if ((game.turn === playerMark) !== (action.type === "human")) return session;

    return { ...session, game: gameReducer(game, { type: "move", index: action.index }) };
  }
  const next = gameReducer(game, action);

  return {
    ...session,
    game:
      action.type === "next" && next !== game
        ? { ...next, starter: "X", turn: "X" }
        : next,
  };
}

export function useLocalGame(t: Dictionary) {
  const [{ game: state, playerMark }, dispatch] = useReducer(sessionReducer, {
    game: initialGame,
    playerMark: "X",
  });
  const [name, setPlayerName] = useState("");
  const { winner, line } = useMemo(() => getResult(state.board), [state.board]);
  const thinking = !winner && state.turn !== playerMark;
  useEffect(() => {
    if (!thinking) return;
    const timer = setTimeout(() => {
      // This effect only runs on an unfinished board, which has a legal move.
      const index = getComputerMove(state.board, state.turn)!;
      dispatch({ type: "computer", index });
    }, 400);

    return () => clearTimeout(timer);
  }, [thinking, state.board, state.turn]);
  const getPlayerName = useCallback(
    (mark: Mark) => (mark === playerMark ? name.trim() || t.you : t.computer),
    [name, playerMark, t.you, t.computer],
  );
  const playMove = useCallback((index: number) => dispatch({ type: "human", index }), []);
  const setPlayerMark = useCallback((mark: Mark) => dispatch({ type: "mark", mark }), []);
  const nextRound = useCallback(() => dispatch({ type: "next" }), []);
  const resetSession = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    state,
    name,
    playerMark,
    thinking,
    winner,
    line,
    getPlayerName,
    setPlayerName,
    setPlayerMark,
    playMove,
    nextRound,
    resetSession,
  };
}
