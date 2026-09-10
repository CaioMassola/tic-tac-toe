"use client";

import { useEffect, useRef } from "react";
import type { Mark } from "@/lib/game";
import { playSound } from "@/lib/sounds";

type Snapshot = {
  board: (Mark | null)[];
  round: number;
  turn: Mark;
  winner: Mark | "draw" | null;
};

export function useGameSounds(game: Snapshot, playerMark: Mark) {
  const previous = useRef(game);
  useEffect(() => {
    const before = previous.current;
    previous.current = game;
    const moved = game.board.filter(Boolean).length > before.board.filter(Boolean).length;
    const newRound = game.round > before.round;
    if (!moved && !newRound) return;
    if (game.winner) {
      playSound(
        game.winner === "draw" ? "draw" : game.winner === playerMark ? "win" : "lose",
      );
    } else {
      if (moved) playSound("move");
      if (game.turn === playerMark) playSound("turn");
    }
  }, [game, playerMark]);
}
