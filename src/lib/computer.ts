import { getResult, type Board, type Mark } from "./game";

// Minimax chooses a winning move when possible and otherwise avoids defeat.
export function getComputerMove(board: Board, mark: Mark): number | null {
  function search(
    position: Board,
    turn: Mark,
    depth = 0,
  ): { score: number; move: number | null } {
    const { winner } = getResult(position);
    if (winner) {
      return {
        score: winner === "draw" ? 0 : winner === mark ? 10 - depth : depth - 10,
        move: null,
      };
    }
    let score = turn === mark ? -Infinity : Infinity;
    let move: number | null = null;
    for (const index of [4, 0, 2, 6, 8, 1, 3, 5, 7]) {
      if (position[index]) continue;
      const next = [...position];
      next[index] = turn;
      const result = search(next, turn === "X" ? "O" : "X", depth + 1);
      if (turn === mark ? result.score > score : result.score < score) {
        score = result.score;
        move = index;
      }
    }

    return { score, move };
  }

  return search(board, mark).move;
}
