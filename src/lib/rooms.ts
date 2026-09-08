import { Client } from "@stomp/stompjs";
import type { GameState, Mark } from "./game";

export type OnlineGameState = Omit<GameState, "starter"> & {
  winner: Mark | "draw" | null;
  line: number[];
  rematchReady: Mark[];
};

export type RoomCommand = { type: "start" | "move" | "next"; index?: number };

export type Room = {
  code: string;
  status: "WAITING" | "READY" | "PLAYING" | "FINISHED";
  players: { nickname: string; mark: "X" | "O" }[];
  expiresAt: string;
  revision: number;
  game: OnlineGameState | null;
};

export type Membership = { token: string; mark: "X" | "O"; room: Room };

export type RoomError =
  "invalidName" | "invalidCode" | "unavailable" | "roomNotFound" | "roomFull";

export function backendUrl() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(
    /\/$/,
    "",
  );
}

export async function enterRoom(
  mode: "create" | "join",
  nickname: string,
  code: string,
): Promise<Membership> {
  const response = await fetch(
    `${backendUrl()}/api/rooms${mode === "join" ? `/${code}/join` : ""}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) {
    if (response.status === 404) throw new Error("roomNotFound");
    if (response.status === 409) throw new Error("roomFull");
    throw new Error("unavailable");
  }

  return response.json();
}

export async function sendRoomCommand(
  token: string,
  revision: number,
  command: RoomCommand,
): Promise<Room> {
  const response = await fetch(`${backendUrl()}/api/rooms/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...command, revision }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("sessionExpired");
    if (response.status === 403 || response.status === 409)
      throw new Error("actionRejected");
    throw new Error("actionFailed");
  }

  return response.json();
}

export function watchRoom(
  token: string,
  onRoom: (room: Room) => void,
  onConnection: (connected: boolean) => void,
  onExpired: () => void,
) {
  const client = new Client({
    brokerURL: `${backendUrl().replace(/^http/, "ws")}/ws`,
    connectHeaders: { token },
    reconnectDelay: 2000,
    connectionTimeout: 8000,
    onConnect() {
      client.subscribe("/user/queue/room", (message) => {
        onRoom(JSON.parse(message.body));
        onConnection(true);
      });
      client.publish({ destination: "/app/room", body: "" });
    },
    onWebSocketClose() {
      onConnection(false);
    },
    onStompError() {
      void client.deactivate();
      onExpired();
    },
  });
  client.activate();

  return () => {
    void client.deactivate();
  };
}
