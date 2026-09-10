import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as rooms from "@/lib/rooms";
import { translations } from "@/lib/translations";
import { useOnlineRoom } from "@/hooks/use-online-room";
import { RoomLobby } from "./room-lobby";

beforeEach(() => {
  vi.spyOn(rooms, "watchChat").mockReturnValue(vi.fn());
});

const game: rooms.OnlineGameState = {
  board: Array(9).fill(null),
  turn: "X",
  winner: null,
  line: [],
  round: 1,
  scores: { X: 0, O: 0, draw: 0 },
  history: [],
  rematchReady: [],
};
const ready: rooms.Room = {
  code: "ABC123",
  status: "READY",
  players: [
    { nickname: "Ana", mark: "X" },
    { nickname: "Beto", mark: "O" },
  ],
  expiresAt: new Date(Date.now() + 1800000).toISOString(),
  revision: 2,
  game: null,
};
const membership: rooms.Membership = { token: "private", mark: "X", room: ready };
const playing: rooms.Room = { ...ready, revision: 3, status: "PLAYING", game };

function mockConnection() {
  let update!: Parameters<typeof rooms.watchRoom>[1];
  let connection!: Parameters<typeof rooms.watchRoom>[2];
  let expire!: Parameters<typeof rooms.watchRoom>[3];
  vi.spyOn(rooms, "watchRoom").mockImplementation(
    (_, onRoom, onConnection, onExpired) => {
      update = onRoom;
      connection = onConnection;
      expire = onExpired;

      return vi.fn();
    },
  );

  return {
    update(room: rooms.Room) {
      act(() => update(room));
    },
    connected(value: boolean) {
      act(() => connection(value));
    },
    expire() {
      act(() => expire());
    },
  };
}

describe("online match", () => {
  it.each(["X", "O"] as const)(
    "waits for both confirmations when %s requests a rematch",
    async (mark) => {
      const connection = mockConnection();
      const finished: rooms.Room = {
        ...playing,
        status: "FINISHED",
        revision: 8,
        game: { ...game, winner: "draw" },
      };
      const confirmed: rooms.Room = {
        ...finished,
        revision: 9,
        game: { ...finished.game!, rematchReady: [mark] },
      };
      const send = vi.spyOn(rooms, "sendRoomCommand").mockResolvedValue(confirmed);
      render(
        <RoomLobby
          membership={{ ...membership, mark, room: finished }}
          t={translations["pt-BR"]}
        />,
      );
      connection.connected(true);
      expect(
        screen.getByRole("button", { name: translations["pt-BR"].next }),
      ).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: translations["pt-BR"].next }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: translations["pt-BR"].rematchConfirmed }),
        ).toBeDisabled(),
      );
      expect(screen.getByText(translations["pt-BR"].waitingRematch)).toBeVisible();
      expect(screen.getByRole("status")).toHaveTextContent(translations["pt-BR"].draw);
      expect(send).toHaveBeenCalledTimes(1);
      connection.update({
        ...playing,
        revision: 10,
        game: { ...game, round: 2, turn: "O" },
      });
      expect(
        screen.queryByRole("button", { name: translations["pt-BR"].rematchConfirmed }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        mark === "O" ? "Sua vez" : "Vez de Beto",
      );
    },
  );

  it("invites the other player to confirm and preserves confirmations on reconnect", () => {
    const connection = mockConnection();
    const finished: rooms.Room = {
      ...playing,
      revision: 9,
      status: "FINISHED",
      game: { ...game, winner: "X", rematchReady: ["X"] },
    };
    render(
      <RoomLobby
        membership={{ ...membership, mark: "O", room: finished }}
        t={translations["pt-BR"]}
      />,
    );
    connection.connected(true);
    expect(screen.getByText(translations["pt-BR"].opponentRematchReady)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Ana quer jogar novamente" }),
    ).toBeEnabled();
    connection.connected(false);
    expect(
      screen.getByRole("button", { name: "Ana quer jogar novamente" }),
    ).toBeDisabled();
    connection.update(finished);
    connection.connected(true);
    expect(screen.getByText(translations["pt-BR"].opponentRematchReady)).toBeVisible();
  });

  it("shows O's rematch invitation to X and confirms it", async () => {
    const connection = mockConnection();
    const finished: rooms.Room = {
      ...playing,
      revision: 9,
      status: "FINISHED",
      game: { ...game, winner: "draw", rematchReady: ["O"] },
    };
    const send = vi.spyOn(rooms, "sendRoomCommand").mockResolvedValue({
      ...playing,
      revision: 10,
      game: { ...game, round: 2 },
    });
    render(
      <RoomLobby
        membership={{ ...membership, room: finished }}
        t={translations["pt-BR"]}
      />,
    );
    connection.connected(true);
    const invitation = screen.getByRole("button", {
      name: "Beto quer jogar novamente",
    });
    expect(invitation).toBeEnabled();
    expect(screen.getByText(translations["pt-BR"].opponentRematchReady)).toBeVisible();
    fireEvent.click(invitation);
    await waitFor(() => expect(invitation).not.toBeInTheDocument());
    expect(send).toHaveBeenCalledExactlyOnceWith("private", 9, { type: "next" });
    expect(screen.getByText("Sua vez! Escolha uma casa vazia.")).toBeVisible();
  });

  it("lets the losing player request a rematch and wait for the opponent", async () => {
    const connection = mockConnection();
    const finished: rooms.Room = {
      ...playing,
      revision: 8,
      status: "FINISHED",
      game: {
        ...game,
        board: ["X", "X", "X", "O", "O", null, null, null, null],
        winner: "X",
        line: [0, 1, 2],
      },
    };
    const send = vi.spyOn(rooms, "sendRoomCommand").mockResolvedValue({
      ...finished,
      revision: 9,
      game: { ...finished.game!, rematchReady: ["O"] },
    });
    render(
      <RoomLobby
        membership={{ ...membership, mark: "O", room: finished }}
        t={translations["pt-BR"]}
      />,
    );
    connection.connected(true);
    const request = screen.getByRole("button", { name: "Pedir revanche" });
    expect(request).toBeEnabled();
    expect(screen.getByText(translations["pt-BR"].rematchPrompt)).toBeVisible();
    fireEvent.click(request);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: translations["pt-BR"].rematchConfirmed }),
      ).toBeDisabled(),
    );
    expect(send).toHaveBeenCalledExactlyOnceWith("private", 8, { type: "next" });
    expect(screen.getByText(translations["pt-BR"].waitingRematch)).toBeVisible();
    expect(screen.getByRole("button", { name: "Casa 1: X" })).toBeDisabled();
  });

  it("lets the host start, plays server moves and starts a rematch", async () => {
    const connection = mockConnection();
    const send = vi.spyOn(rooms, "sendRoomCommand").mockResolvedValue(playing);
    render(<RoomLobby membership={membership} t={translations["pt-BR"]} />);
    expect(screen.getByRole("button", { name: "Iniciar partida" })).toBeDisabled();
    connection.connected(true);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar partida" }));
    expect(screen.getByRole("button", { name: "Iniciar partida" })).toBeDisabled();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Partida online" })).toBeVisible(),
    );
    expect(send).toHaveBeenLastCalledWith("private", 2, { type: "start" });
    expect(screen.getByRole("status")).toHaveTextContent("Sua vez");
    expect(screen.getByText("Sua vez! Escolha uma casa vazia.")).toBeVisible();
    send.mockResolvedValue({
      ...playing,
      revision: 4,
      game: { ...game, board: ["X", ...Array(8).fill(null)], turn: "O" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Casa 1: vazia" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Casa 1: X" })).toBeVisible(),
    );
    expect(send).toHaveBeenLastCalledWith("private", 3, { type: "move", index: 0 });
    expect(screen.getByRole("button", { name: "Casa 2: vazia" })).toBeDisabled();
    connection.update({
      ...playing,
      revision: 8,
      status: "FINISHED",
      game: {
        ...game,
        board: ["X", "X", "X", "O", "O", null, null, null, null],
        winner: "X",
        line: [0, 1, 2],
        scores: { X: 1, O: 0, draw: 0 },
        history: [{ round: 1, winner: "X" }],
      },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Você venceu!");
    expect(screen.getByTestId("score-X")).toHaveTextContent("1");
    send.mockResolvedValue({
      ...playing,
      revision: 9,
      game: { ...game, round: 2, turn: "O", scores: { X: 1, O: 0, draw: 0 } },
    });
    fireEvent.click(screen.getByRole("button", { name: "Jogar novamente" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Vez de Beto"),
    );
    expect(send).toHaveBeenLastCalledWith("private", 8, { type: "next" });
  });

  it("keeps guest controls restricted and disables play on connection loss or expiry", async () => {
    const connection = mockConnection();
    const send = vi
      .spyOn(rooms, "sendRoomCommand")
      .mockRejectedValue(new Error("actionRejected"));
    render(
      <RoomLobby membership={{ ...membership, mark: "O" }} t={translations["pt-BR"]} />,
    );
    connection.connected(true);
    expect(
      screen.queryByRole("button", { name: "Iniciar partida" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(translations["pt-BR"].waitingHost)).toBeVisible();
    connection.update(playing);
    expect(screen.getByRole("button", { name: "Casa 1: vazia" })).toBeDisabled();
    connection.update({ ...playing, revision: 4, game: { ...game, turn: "O" } });
    fireEvent.click(screen.getByRole("button", { name: "Casa 1: vazia" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        translations["pt-BR"].actionRejected,
      ),
    );
    send.mockResolvedValue({
      ...playing,
      revision: 5,
      status: "FINISHED",
      game: {
        ...game,
        winner: "draw",
        scores: { X: 0, O: 0, draw: 1 },
        history: [{ round: 1, winner: "draw" }],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Casa 1: vazia" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Deu velha!"),
    );
    expect(screen.getByText(translations["pt-BR"].rematchPrompt)).toBeVisible();
    expect(screen.getByRole("button", { name: "Jogar novamente" })).toBeEnabled();
    connection.connected(false);
    expect(screen.getByRole("alert")).toHaveTextContent("Conectando");
    connection.expire();
    expect(screen.getByRole("alert")).toHaveTextContent("expirou");
  });

  it("blocks duplicate and disconnected commands and ignores older snapshots", async () => {
    const connection = mockConnection();
    let resolve!: (room: rooms.Room) => void;
    const send = vi.spyOn(rooms, "sendRoomCommand").mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { result } = renderHook(() => useOnlineRoom(membership));
    act(() => result.current.startGame());
    expect(send).not.toHaveBeenCalled();
    connection.connected(true);
    act(() => {
      result.current.startGame();
      result.current.startGame();
    });
    expect(send).toHaveBeenCalledTimes(1);
    connection.update({ ...playing, revision: 4 });
    await act(async () => resolve(playing));
    expect(result.current.room.revision).toBe(4);
    connection.update(ready);
    expect(result.current.room.revision).toBe(4);
    connection.expire();
    act(() => result.current.playMove(0));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each([new TypeError("offline"), "failure", new Error("sessionExpired")])(
    "handles action failure without inventing a move: %s",
    async (error) => {
      const connection = mockConnection();
      vi.spyOn(rooms, "sendRoomCommand").mockRejectedValue(error);
      const { result } = renderHook(() => useOnlineRoom(membership));
      connection.connected(true);
      act(() => result.current.startGame());
      await waitFor(() => expect(result.current.pending).toBe(false));
      expect(result.current.room).toEqual(ready);
      if (error instanceof Error && error.message === "sessionExpired")
        expect(result.current.expired).toBe(true);
      else expect(result.current.error).toBe("actionFailed");
    },
  );
});
