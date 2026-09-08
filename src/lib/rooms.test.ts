import { afterEach, describe, expect, it, vi } from "vitest";
import { backendUrl, enterRoom, watchRoom, sendRoomCommand } from "./rooms";
import type { StompConfig } from "@stomp/stompjs";

const stomp = vi.hoisted(() => ({
  config: {} as StompConfig,
  activate: vi.fn(),
  deactivate: vi.fn(),
  subscribe: vi.fn(),
  publish: vi.fn(),
}));
vi.mock("@stomp/stompjs", () => ({
  Client: class {
    constructor(config: StompConfig) {
      stomp.config = config;
    }
    activate = stomp.activate;
    deactivate = stomp.deactivate;
    subscribe = stomp.subscribe;
    publish = stomp.publish;
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("room transport", () => {
  it("sends authenticated commands with the snapshot revision", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({ revision: 4 }) } as Response);
    expect(await sendRoomCommand("private", 3, { type: "move", index: 0 })).toEqual({
      revision: 4,
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/rooms/actions"),
      expect.objectContaining({
        headers: { "Content-Type": "application/json", Authorization: "Bearer private" },
        body: '{"type":"move","index":0,"revision":3}',
      }),
    );
  });

  it.each([
    [401, "sessionExpired"],
    [403, "actionRejected"],
    [409, "actionRejected"],
    [500, "actionFailed"],
  ])("maps command error %s", async (status, error) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status } as Response);
    await expect(sendRoomCommand("private", 3, { type: "start" })).rejects.toThrow(
      error as string,
    );
  });

  it("uses configured URLs and creates or joins with trimmed names", async () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "");
    expect(backendUrl()).toBe("http://localhost:8080");
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "https://api.example/");
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ token: "private" }),
    } as Response);
    expect(await enterRoom("create", " Ana ", "")).toEqual({ token: "private" });
    expect(fetch).toHaveBeenLastCalledWith(
      "https://api.example/api/rooms",
      expect.objectContaining({ method: "POST", body: '{"nickname":"Ana"}' }),
    );
    await enterRoom("join", "Beto", "ABC123");
    expect(fetch).toHaveBeenLastCalledWith(
      "https://api.example/api/rooms/ABC123/join",
      expect.any(Object),
    );
  });

  it.each([
    [404, "roomNotFound"],
    [409, "roomFull"],
    [503, "unavailable"],
  ])("maps HTTP %s", async (status, error) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status } as Response);
    await expect(enterRoom("join", "Ana", "ABC123")).rejects.toThrow(error as string);
  });

  it("propagates network failures without claiming success", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    await expect(enterRoom("create", "Ana", "")).rejects.toThrow("offline");
  });

  it("authenticates, subscribes, resynchronizes on connect and cleans up", () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "https://api.example");
    const onRoom = vi.fn(),
      onConnection = vi.fn(),
      onExpired = vi.fn();
    const stop = watchRoom("private", onRoom, onConnection, onExpired);
    expect(stomp.config.brokerURL).toBe("wss://api.example/ws");
    expect(stomp.config.connectHeaders).toEqual({ token: "private" });
    expect(stomp.activate).toHaveBeenCalled();
    stomp.config.onConnect!({} as never);
    expect(stomp.subscribe).toHaveBeenLastCalledWith(
      "/user/queue/room",
      expect.any(Function),
    );
    expect(stomp.publish).toHaveBeenCalledWith({ destination: "/app/room", body: "" });
    const callback = stomp.subscribe.mock.lastCall![1];
    callback({ body: '{"status":"READY"}' });
    expect(onRoom).toHaveBeenCalledWith({ status: "READY" });
    expect(onConnection).toHaveBeenLastCalledWith(true);
    stomp.config.onWebSocketClose!({} as never);
    expect(onConnection).toHaveBeenLastCalledWith(false);
    stomp.config.onStompError!({} as never);
    expect(onExpired).toHaveBeenCalled();
    stop();
    expect(stomp.deactivate).toHaveBeenCalled();
  });
});
