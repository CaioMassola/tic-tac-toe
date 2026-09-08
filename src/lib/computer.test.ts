import { describe, expect, it } from "vitest";
import { getComputerMove } from "./computer";
import { getResult, type Board, type Mark } from "./game";

describe("computer strategy", () => {
  it.each(["X", "O"] as Mark[])(
    "never loses as %s against any human move",
    (computer) => {
      function walk(board: Board, turn: Mark) {
        const { winner } = getResult(board);
        if (winner) {
          expect(winner).not.toBe(computer === "X" ? "O" : "X");

          return;
        }
        const moves =
          turn === computer
            ? [getComputerMove(board, computer)!]
            : board.flatMap((cell, index) => (cell ? [] : [index]));
        for (const move of moves) {
          expect(board[move]).toBeNull();
          const next = [...board];
          next[move] = turn;
          walk(next, turn === "X" ? "O" : "X");
        }
      }

      walk(Array(9).fill(null), "X");
    },
  );

  it("does not mutate the board or play after a finished round", () => {
    const board: Board = ["X", "X", null, "O", "O", null, null, null, null];
    expect(getComputerMove(board, "O")).toBe(5);
    expect(board[5]).toBeNull();
    expect(
      getComputerMove(["X", "X", "X", "O", "O", null, null, null, null], "O"),
    ).toBeNull();
    expect(
      getComputerMove(["X", "O", "X", "X", "O", "O", "O", "X", "X"], "X"),
    ).toBeNull();
  });
});
