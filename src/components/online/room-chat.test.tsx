import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import * as rooms from "@/lib/rooms";
import { useRoomChat } from "@/hooks/use-room-chat";
import { translations } from "@/lib/translations";
import { RoomChat } from "./room-chat";

const t = translations["pt-BR"];
const players: rooms.Room["players"] = [
  { nickname: "Ana", mark: "X" },
  { nickname: "Beto", mark: "O" },
];
const membership: rooms.Membership = {
  token: "private",
  mark: "X",
  room: {
    code: "ABC123",
    status: "READY",
    players,
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    revision: 2,
    game: null,
  },
};
const empty: rooms.Chat = { revision: 0, messages: [], typing: {} };

function connection() {
  let update!: (chat: rooms.Chat) => void;
  let connected!: (value: boolean) => void;
  let expired!: () => void;
  const stop = vi.fn();
  vi.spyOn(rooms, "watchChat").mockImplementation((_, onChat, onConnected, onExpired) => {
    update = onChat;
    connected = onConnected;
    expired = onExpired;

    return stop;
  });

  return {
    update: (chat: rooms.Chat) => act(() => update(chat)),
    connected: (value: boolean) => act(() => connected(value)),
    expire: () => act(() => expired()),
    stop,
  };
}

afterEach(() => vi.useRealTimers());

it("sends messages, preserves failed drafts and blocks empty or duplicate submissions", async () => {
  const socket = connection();
  let resolve!: (chat: rooms.Chat) => void;
  const send = vi.spyOn(rooms, "sendChatCommand").mockResolvedValue(empty);
  render(<RoomChat membership={membership} players={players} disabled={false} t={t} />);
  const input = screen.getByLabelText(t.chatMessage);
  const form = input.closest("form")!;
  expect(input).toBeDisabled();
  fireEvent.submit(form);
  socket.connected(true);
  expect(screen.getByText(t.chatEmpty)).toBeVisible();
  fireEvent.submit(form);
  fireEvent.change(input, { target: { value: " " } });
  fireEvent.submit(form);
  fireEvent.change(input, { target: { value: "Boa sorte!" } });
  send.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fireEvent.submit(form);
  expect(screen.getByRole("button", { name: t.chatSending })).toBeDisabled();
  fireEvent.submit(form);
  await act(async () =>
    resolve({
      revision: 1,
      typing: {},
      messages: [
        { id: "one", mark: "X", text: "Boa sorte!", sentAt: new Date().toISOString() },
      ],
    }),
  );
  expect(input).toHaveValue("");
  expect(screen.getByText("Boa sorte!")).toBeVisible();
  fireEvent.change(input, { target: { value: "Oi de novo" } });
  send.mockRejectedValueOnce(new Error("offline"));
  fireEvent.submit(form);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(t.chatFailed));
  expect(input).toHaveValue("Oi de novo");
  fireEvent.blur(input);
  expect(send).toHaveBeenLastCalledWith("private", { typing: false });
});

it("shows both avatars, expires typing, counts unread messages and preserves scrolling", () => {
  vi.useFakeTimers();
  const socket = connection();
  vi.spyOn(rooms, "sendChatCommand").mockResolvedValue(empty);
  const { rerender, unmount } = render(
    <RoomChat membership={membership} players={players} disabled={false} t={t} />,
  );
  socket.connected(true);
  socket.update({
    ...empty,
    revision: 1,
    typing: { O: new Date(Date.now() + 4000).toISOString() },
  });
  expect(screen.getByText("Beto está digitando…")).toBeVisible();
  act(() => vi.advanceTimersByTime(4500));
  expect(screen.queryByText("Beto está digitando…")).not.toBeInTheDocument();
  const log = screen.getByRole("log");
  Object.defineProperties(log, {
    scrollHeight: { value: 1000 },
    clientHeight: { value: 300 },
  });
  log.scrollTop = 0;
  fireEvent.scroll(log);
  const incoming: rooms.Chat = {
    revision: 2,
    typing: {},
    messages: [
      { id: "first", mark: "O", text: "Olá!", sentAt: new Date().toISOString() },
    ],
  };
  socket.update(incoming);
  expect(log.scrollTop).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: t.chatCollapse }));
  expect(screen.queryByRole("log")).not.toBeInTheDocument();
  socket.update({
    ...incoming,
    revision: 3,
    messages: [
      ...incoming.messages,
      { id: "second", mark: "O", text: "Vamos jogar?", sentAt: new Date().toISOString() },
      { id: "own", mark: "X", text: "Sim!", sentAt: new Date().toISOString() },
    ],
  });
  expect(screen.getByLabelText("1 novas mensagens")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: t.chatExpand }));
  expect(screen.getByText("Vamos jogar?")).toBeVisible();
  expect(screen.queryByLabelText("1 novas mensagens")).not.toBeInTheDocument();
  log.scrollTop = 700;
  fireEvent.scroll(log);
  socket.update({ ...incoming, revision: 4 });
  expect(log.scrollTop).toBe(1000);
  rerender(
    <RoomChat
      membership={{ ...membership, mark: "O" }}
      players={players}
      disabled={true}
      t={t}
    />,
  );
  expect(screen.getByLabelText(t.chatMessage)).toBeDisabled();
  socket.expire();
  expect(screen.getByText(t.sessionExpired)).toBeVisible();
  unmount();
  expect(socket.stop).toHaveBeenCalledOnce();
});

it("guards commands, retries with the same id and ignores stale snapshots", async () => {
  const socket = connection();
  const send = vi.spyOn(rooms, "sendChatCommand").mockResolvedValue(empty);
  const { result } = renderHook(() => useRoomChat("private"));
  await act(async () => expect(await result.current.send("hi")).toBe(false));
  act(() => result.current.typing(true));
  expect(send).not.toHaveBeenCalled();
  socket.connected(true);
  await act(async () => expect(await result.current.send(" ")).toBe(false));
  send.mockRejectedValueOnce("offline");
  await act(async () => expect(await result.current.send("Hi")).toBe(false));
  const failed = send.mock.lastCall![1];
  await act(async () => expect(await result.current.send("Hi")).toBe(true));
  expect(send).toHaveBeenLastCalledWith("private", failed);
  socket.update({ ...empty, revision: 5 });
  socket.update({ ...empty, revision: 4 });
  expect(result.current.chat.revision).toBe(5);
  let resolve!: (chat: rooms.Chat) => void;
  send.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  let pending!: Promise<boolean>;
  act(() => {
    pending = result.current.send("new");
  });
  await act(async () => expect(await result.current.send("duplicate")).toBe(false));
  await act(async () => {
    resolve(empty);
    await pending;
  });
  send.mockRejectedValueOnce(new Error("sessionExpired"));
  await act(async () => expect(await result.current.send("last")).toBe(false));
  expect(result.current.expired).toBe(true);
  await act(async () => expect(await result.current.send("blocked")).toBe(false));
  act(() => result.current.typing(false));
});

it("throttles typing updates, sends stop notifications and tolerates notification failures", async () => {
  const socket = connection();
  const send = vi.spyOn(rooms, "sendChatCommand").mockResolvedValue(empty);
  const { result } = renderHook(() => useRoomChat("private"));
  socket.connected(true);
  const now = vi.spyOn(Date, "now").mockReturnValue(10000);
  await act(async () => {
    result.current.typing(true);
    result.current.typing(true);
  });
  expect(send).toHaveBeenCalledTimes(1);
  now.mockReturnValue(12000);
  await act(async () => result.current.typing(true));
  expect(send).toHaveBeenCalledTimes(2);
  send.mockRejectedValueOnce(new Error("offline"));
  await act(async () => result.current.typing(false));
  expect(result.current.error).toBe(false);
  socket.expire();
  expect(result.current.expired).toBe(true);
});
