import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import * as rooms from "@/lib/rooms";
import { RoomForm } from "./room-form";
import { RoomLobby } from "./room-lobby";
import { useRoomForm } from "@/hooks/use-room-form";
import { translations as dictionaries } from "@/lib/translations";

beforeEach(() => {
  vi.spyOn(rooms, "watchChat").mockReturnValue(vi.fn());
});

const membership: rooms.Membership = {
  token: "private",
  mark: "X",
  room: {
    code: "ABC123",
    status: "WAITING",
    revision: 1,
    game: null,
    players: [{ nickname: "Ana", mark: "X" }],
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
  },
};

describe("room creation and lobby", () => {
  it("copies the room code and confirms success, then reports a clipboard failure", async () => {
    vi.spyOn(rooms, "watchRoom").mockReturnValue(vi.fn());
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    const t = dictionaries["pt-BR"];
    render(<RoomLobby membership={membership} t={t} />);
    await user.click(screen.getByRole("button", { name: t.copyCode }));
    expect(writeText).toHaveBeenCalledWith("ABC123");
    await screen.findByRole("button", { name: t.codeCopied });
    writeText.mockRejectedValueOnce(new Error("Clipboard permission denied"));
    await user.click(screen.getByRole("button", { name: t.codeCopied }));
    expect(await screen.findByText(t.copyCodeError)).toBeVisible();
    expect(screen.getByRole("button", { name: t.copyCode })).toBeEnabled();
  });

  it("disables the form during requests, then shows the actual room", async () => {
    let resolve!: (value: rooms.Membership) => void;
    vi.spyOn(rooms, "enterRoom").mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    vi.spyOn(rooms, "watchRoom").mockReturnValue(vi.fn());
    render(<RoomForm t={dictionaries["pt-BR"]} />);
    fireEvent.change(screen.getByLabelText("Seu apelido"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar minha sala" }));
    expect(screen.getByRole("button", { name: "Conectando…" })).toBeDisabled();
    expect(screen.getByLabelText("Seu apelido")).toBeDisabled();
    await act(async () => resolve(membership));
    expect(screen.getByTestId("room-code")).toHaveTextContent("ABC123");
    expect(screen.queryByLabelText("Seu apelido")).not.toBeInTheDocument();
  });

  it.each([
    new Error("roomNotFound"),
    new Error("roomFull"),
    new Error("offline"),
    "failure",
  ])("shows request errors and allows retry: %s", async (error) => {
    vi.spyOn(rooms, "enterRoom").mockRejectedValue(error);
    render(<RoomForm t={dictionaries["pt-BR"]} />);
    fireEvent.change(screen.getByLabelText("Seu apelido"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar em uma sala" }));
    fireEvent.change(screen.getByLabelText("Código da sala"), {
      target: { value: "ABC123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar na sala" }));
    expect(screen.getByLabelText("Código da sala")).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
    expect(screen.getByRole("button", { name: "Entrar na sala" })).toBeEnabled();
  });

  it("rejects long names and duplicate submission events", async () => {
    const enter = vi.spyOn(rooms, "enterRoom");
    let resolve!: (value: rooms.Membership) => void;
    enter.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { result } = renderHook(useRoomForm);
    act(() =>
      result.current.handleNicknameChange({
        currentTarget: { value: "a".repeat(21) },
      } as never),
    );
    await act(() => result.current.handleSubmit({ preventDefault: vi.fn() } as never));
    expect(result.current.error).toBe("invalidName");
    act(() =>
      result.current.handleNicknameChange({ currentTarget: { value: "Ana" } } as never),
    );
    act(() => {
      void result.current.handleSubmit({ preventDefault: vi.fn() } as never);
      void result.current.handleSubmit({ preventDefault: vi.fn() } as never);
    });
    expect(enter).toHaveBeenCalledTimes(1);
    await act(async () => resolve(membership));
  });

  it("updates both players, reports connection loss and cleans up on unmount", () => {
    let update!: Parameters<typeof rooms.watchRoom>[1];
    let connection!: Parameters<typeof rooms.watchRoom>[2];
    let expired!: Parameters<typeof rooms.watchRoom>[3];
    const stop = vi.fn();
    vi.spyOn(rooms, "watchRoom").mockImplementation(
      (_, onRoom, onConnection, onExpired) => {
        update = onRoom;
        connection = onConnection;
        expired = onExpired;

        return stop;
      },
    );
    const { unmount } = render(
      <RoomLobby membership={membership} t={dictionaries["pt-BR"]} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Conectando");
    act(() => connection(true));
    expect(screen.getByRole("status")).toHaveTextContent("Aguardando");
    act(() =>
      update({
        ...membership.room,
        status: "READY",
        players: [...membership.room.players, { nickname: "Beto", mark: "O" }],
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Os dois jogadores");
    expect(screen.getByText("Beto", { selector: ".lobby-player span" })).toBeVisible();
    act(() => connection(false));
    expect(screen.getByRole("status")).toHaveTextContent("Conectando");
    act(() => expired());
    expect(screen.getByRole("status")).toHaveTextContent("expirou");
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("expires the lobby at the server deadline", () => {
    vi.useFakeTimers();
    const stop = vi.fn();
    vi.spyOn(rooms, "watchRoom").mockReturnValue(stop);
    const { unmount } = render(
      <RoomLobby
        membership={{
          ...membership,
          room: {
            ...membership.room,
            expiresAt: new Date(Date.now() + 1000).toISOString(),
          },
        }}
        t={dictionaries["pt-BR"]}
      />,
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).toHaveTextContent("expirou");
    expect(stop).toHaveBeenCalledTimes(1);
    unmount();
    vi.useRealTimers();
  });
});
