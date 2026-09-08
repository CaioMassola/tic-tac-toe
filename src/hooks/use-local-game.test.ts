import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useLocalGame } from "./use-local-game";
import { translations } from "@/lib/translations";
import { getComputerMove } from "@/lib/computer";
import type { Mark } from "@/lib/game";

afterEach(() => vi.useRealTimers());

it.each(["X", "O"] as Mark[])(
  "scores draws and preserves the selected %s side across rematches",
  (mark) => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useLocalGame(translations["pt-BR"]));
    act(() => result.current.setPlayerMark(mark));
    for (let turn = 0; turn < 9 && !result.current.winner; turn++) {
      if (result.current.thinking) {
        act(() => vi.advanceTimersByTime(400));
      } else {
        const move = getComputerMove(result.current.state.board, mark)!;
        act(() => result.current.playMove(move));
      }
    }
    expect(result.current.winner).toBe("draw");
    expect(result.current.state.scores.draw).toBe(1);
    expect(result.current.state.history).toEqual([{ round: 1, winner: "draw" }]);
    act(() => result.current.nextRound());
    expect(result.current.playerMark).toBe(mark);
    expect(result.current.state.turn).toBe("X");
    expect(result.current.state.scores.draw).toBe(1);
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.state.board.filter(Boolean)).toHaveLength(mark === "X" ? 0 : 1);
    unmount();
  },
);

it("rejects extra human moves and cancels pending computer moves on reset and unmount", () => {
  vi.useFakeTimers();
  const { result, unmount } = renderHook(() => useLocalGame(translations["pt-BR"]));
  act(() => result.current.nextRound());
  expect(result.current.state.round).toBe(1);
  act(() => {
    result.current.playMove(0);
    result.current.playMove(1);
  });
  expect(result.current.state.board.filter(Boolean)).toHaveLength(1);
  act(() => result.current.resetSession());
  act(() => vi.advanceTimersByTime(400));
  expect(result.current.state.board.filter(Boolean)).toHaveLength(0);
  act(() => result.current.setPlayerMark("O"));
  act(() => result.current.resetSession());
  act(() => vi.advanceTimersByTime(400));
  expect(result.current.state.board.filter(Boolean)).toEqual(["X"]);
  expect(result.current.playerMark).toBe("O");
  act(() => result.current.playMove(0));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
