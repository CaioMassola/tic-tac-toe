export type Mark = "X" | "O";

export type Board = (Mark | null)[];

export const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function getResult(board: Board): {
  winner: Mark | "draw" | null;
  line: number[];
} {
  for (const line of winningLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line };
  }

  return { winner: board.every(Boolean) ? "draw" : null, line: [] };
}

export type GameState = {
  board: Board;
  turn: Mark;
  starter: Mark;
  round: number;
  scores: { X: number; O: number; draw: number };
  history: { round: number; winner: Mark | "draw" }[];
};

export const initialGame: GameState = {
  board: Array(9).fill(null),
  turn: "X",
  starter: "X",
  round: 1,
  scores: { X: 0, O: 0, draw: 0 },
  history: [],
};

export function gameReducer(
  state: GameState,
  action: { type: "move"; index: number } | { type: "next" | "reset" },
): GameState {
  if (action.type === "reset") return initialGame;
  if (action.type === "next") {
    if (!getResult(state.board).winner) return state;
    const starter = state.starter === "X" ? "O" : "X";

    return {
      ...state,
      board: Array(9).fill(null),
      starter,
      turn: starter,
      round: state.round + 1,
    };
  }
  if (
    action.type !== "move" ||
    !Number.isInteger(action.index) ||
    action.index < 0 ||
    action.index > 8 ||
    state.board[action.index] ||
    getResult(state.board).winner
  )
    return state;
  const board = [...state.board];
  board[action.index] = state.turn;
  const { winner } = getResult(board);

  return {
    ...state,
    board,
    turn: state.turn === "X" ? "O" : "X",
    scores: winner
      ? { ...state.scores, [winner]: state.scores[winner] + 1 }
      : state.scores,
    history: winner
      ? [{ round: state.round, winner }, ...state.history].slice(0, 5)
      : state.history,
  };
}
