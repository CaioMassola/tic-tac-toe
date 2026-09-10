import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import * as audio from "@/lib/sounds";
import type { Mark } from "@/lib/game";
import { useGameSounds } from "./use-game-sounds";

it.each(["X", "O"] as const)(
  "notifies %s only on new moves, turns and results",
  (mark) => {
    const play = vi.spyOn(audio, "playSound").mockImplementation(() => {});
    const initial = {
      board: Array<Mark | null>(9).fill(null),
      turn: "X" as Mark,
      round: 1,
      winner: null as Mark | "draw" | null,
    };
    const { rerender } = renderHook(({ game }) => useGameSounds(game, mark), {
      initialProps: { game: initial },
    });
    expect(play).not.toHaveBeenCalled();
    const next = {
      ...initial,
      board: ["X" as Mark, ...Array<null>(8).fill(null)],
      turn: "O" as Mark,
    };
    rerender({ game: next });
    expect(play.mock.calls.map(([sound]) => sound)).toEqual(
      mark === "O" ? ["move", "turn"] : ["move"],
    );
    play.mockClear();
    rerender({ game: { ...next } });
    expect(play).not.toHaveBeenCalled();
    rerender({
      game: {
        ...next,
        board: ["X", "O", "X", "O", "X", null, null, null, null],
        winner: "X",
      },
    });
    expect(play).toHaveBeenCalledExactlyOnceWith(mark === "X" ? "win" : "lose");
  },
);

it("plays a draw once and ignores resetting the session", () => {
  const play = vi.spyOn(audio, "playSound").mockImplementation(() => {});
  const game = {
    board: Array<Mark | null>(8).fill("X").concat(null),
    turn: "X" as Mark,
    round: 1,
    winner: null as Mark | "draw" | null,
  };
  const { rerender } = renderHook(({ game }) => useGameSounds(game, "X"), {
    initialProps: { game },
  });
  rerender({ game: { ...game, board: Array<Mark>(9).fill("X"), winner: "draw" } });
  expect(play).toHaveBeenCalledExactlyOnceWith("draw");
  play.mockClear();
  rerender({ game: { ...game, board: Array<null>(9).fill(null) } });
  expect(play).not.toHaveBeenCalled();
});
