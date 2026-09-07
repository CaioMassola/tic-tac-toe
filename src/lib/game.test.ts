import { describe, expect, it } from "vitest";
import {
  gameReducer,
  getResult,
  initialGame,
  winningLines,
  type GameState,
  type Mark,
} from "./game";
import { translations } from "./translations";
const play = (moves: number[], start = initialGame) =>
  moves.reduce((state, index) => gameReducer(state, { type: "move", index }), start);

describe("local game rules", () => {
  it.each(winningLines)(
    "detects a winning line at %s, %s, %s for both players",
    (a, b, c) => {
      for (const mark of ["X", "O"] as Mark[]) {
        const board = Array(9).fill(null);
        [a, b, c].forEach((index) => (board[index] = mark));
        expect(getResult(board)).toEqual({ winner: mark, line: [a, b, c] });
      }
    },
  );
  it("alternates turns and rejects occupied and invalid squares", () => {
    const state = play([4]);
    expect(state.turn).toBe("O");
    for (const index of [4, -1, 9, 1.5])
      expect(gameReducer(state, { type: "move", index })).toBe(state);
  });
  it("ends the round, scores the winner once, and prevents further moves", () => {
    const state = play([0, 3, 1, 4, 2]);
    expect(state.scores).toEqual({ X: 1, O: 0, draw: 0 });
    expect(state.history).toEqual([{ round: 1, winner: "X" }]);
    expect(gameReducer(state, { type: "move", index: 8 })).toBe(state);
  });
  it("detects and scores a full-board draw", () => {
    const state = play([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(getResult(state.board).winner).toBe("draw");
    expect(state.scores.draw).toBe(1);
  });
  it("alternates starters for rematches and preserves score", () => {
    const state = gameReducer(play([0, 3, 1, 4, 2]), { type: "next" });
    expect(state.turn).toBe("O");
    expect(state.round).toBe(2);
    expect(state.board.every((cell) => cell === null)).toBe(true);
    expect(state.scores.X).toBe(1);
    expect(gameReducer(initialGame, { type: "next" })).toBe(initialGame);
  });
  it("resets the entire session", () => {
    expect(gameReducer(play([0, 3, 1, 4, 2]), { type: "reset" })).toEqual(initialGame);
  });
  it("all possible completed games have a consistent result and score", () => {
    let completed = 0;

    function walk(state: GameState) {
      const result = getResult(state.board);
      if (result.winner) {
        completed++;
        if (state.scores[result.winner] !== 1 || state.history.length !== 1)
          throw new Error("Invalid terminal score");
        if (result.winner === "draw" && state.board.some((cell) => !cell))
          throw new Error("Premature draw");

        return;
      }
      state.board.forEach((cell, index) => {
        if (!cell) walk(gameReducer(state, { type: "move", index }));
      });
    }

    walk(initialGame);
    expect(completed).toBe(255168);
  });
});

it("provides all translations in every supported language", () => {
  for (const dictionary of Object.values(translations)) {
    expect(Object.keys(dictionary).sort()).toEqual(
      Object.keys(translations["pt-BR"]).sort(),
    );
    expect(Object.values(dictionary).every((value) => value.trim().length > 0)).toBe(
      true,
    );
  }
});
