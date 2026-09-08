# Trio room backend

Spring Boot 4.1.1, Java 21 bytecode, Maven Wrapper. Implements room membership, a live lobby, host-controlled starts, authoritative moves, wins/draws, session scores, five recent rounds, and rematches with alternating starters. Explicit leaving, session recovery after page reload, and deployment remain future work.

## Run and test

From this directory on Windows:

```powershell
.\mvnw.cmd verify
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

On Linux/macOS, use `bash mvnw verify`. The wrapper downloads Maven and dependencies on first use. Java 21+ must be installed and available on PATH (the development environment was tested with Java 26). CI runs with Java 21. The first run needs network access to Maven Central.

Start the frontend using `npm run dev` from the repository root. Open `http://localhost:3000/online` in two browsers. Create a room as Ana, copy the six-character code, then join as Beto. Both lobbies should show X — Ana and O — Beto.

Configuration:

| Variable                             | Default                                       | Purpose                                                         |
| ------------------------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| `PORT`                               | `8080`                                        | HTTP and WebSocket port                                         |
| `TRIO_ALLOWED_ORIGINS`               | `http://localhost:3000,http://127.0.0.1:3000` | Exact allowed frontend origins, comma-separated                 |
| `NEXT_PUBLIC_BACKEND_URL` (frontend) | `http://localhost:8080`                       | Browser-accessible backend origin; rebuild Next.js when changed |

## Contract

| Method / destination               | Input                 | Result                                                  |
| ---------------------------------- | --------------------- | ------------------------------------------------------- |
| `GET /api/health`                  | —                     | `{"status":"UP"}`                                       |
| `POST /api/rooms`                  | `{"nickname":"Ana"}`  | 201, membership with X                                  |
| `POST /api/rooms/ABC123/join`      | `{"nickname":"Beto"}` | 200, membership with O                                  |
| STOMP CONNECT `/ws`                | Native header `token` | Authenticated private session                           |
| STOMP SUBSCRIBE `/user/queue/room` | —                     | Room snapshots                                          |
| STOMP SEND `/app/room`             | Empty body            | Request current snapshot after subscribing/reconnecting |

A membership response is shaped like this (the token is private, never part of shared snapshots):

```json
{
  "token": "private-member-token",
  "mark": "X",
  "room": {
    "code": "ABC123",
    "status": "WAITING",
    "players": [{ "nickname": "Ana", "mark": "X" }],
    "expiresAt": "2026-09-07T13:30:00Z",
    "revision": 1,
    "game": null
  }
}
```

Status progresses from `WAITING` to `READY` when the second player joins, then `PLAYING` when the host starts, and `FINISHED` on a win/draw. A rematch returns to `PLAYING`. The player list indicates membership, not live presence. Nicknames are trimmed and must have 2–20 characters. Codes have six uppercase ASCII letters or digits. Errors use `{ "code": "..." }`: `invalidName`/`invalidCode` (400), `roomNotFound` (404), `roomFull` (409), `capacity` (503). Malformed JSON uses Spring's standard 400 response. Tokens are checked at CONNECT and on every SUBSCRIBE/SEND. Only the private room subscription and snapshot command are allowed; clients cannot publish room snapshots or read another member's queue.

### Game commands

Send `POST /api/rooms/actions` with `Authorization: Bearer <membership token>`, JSON content type, and the current room `revision`. Successful commands return the complete room snapshot and broadcast it to both members. Membership and each accepted command increment the revision. The frontend ignores snapshots older than the one already displayed, including delayed HTTP responses.

```json
{ "type": "start", "revision": 2 }
```

```json
{ "type": "move", "index": 0, "revision": 3 }
```

```json
{ "type": "next", "revision": 8 }
```

Only the host (X) can use `start` and `next`. Start requires two members; next requires a finished round. Move indices are integers 0–8, the cell must be empty, and the member must own the current turn. The first round starts with X; rematches alternate starters and preserve scores/history. The `game` snapshot contains `board`, `turn`, `winner` (null, X, O, or draw), `line`, `round`, `scores`, and `history`. All mutation and snapshot publication happen under the room-service lock.

Commands reject missing/expired tokens (401), host-only violations (403), stale or missing revisions and illegal game-state transitions (409), and unknown actions/malformed bodies (400). Fractional indices/revisions are not truncated. A rejected command does not change the board or score; valid members receive a current snapshot to resynchronize. No automatic command retry is used, since the first request might already have succeeded. Reconnection requests a fresh snapshot.

Rooms are synchronized in memory, capped at 1,000, and expire 30 minutes after creation. Expired entries are removed on the next room operation. Restarting the process clears them all. No database or account login is required. Losing connectivity retains membership while the page remains open; refreshing or leaving loses the token and keeps the slot occupied until expiration. The frontend reconnects automatically and requests the latest snapshot; expired or invalid credentials require a new room.

## Validation and next milestone

`mvnw verify` checks HTTP contracts, validation, CORS, expiration, token isolation, concurrent joins/moves, all winning lines, draws, rematches, scoring, and history limits. The root `npm run test:e2e` starts the packaged backend and exercises rooms across separate browser contexts, host-only controls, wins for X and O, a draw, rematches, third-player rejection, network reconnection, and invalid STOMP authentication. Build the JAR before running browser tests.

Next: explicit leaving, refresh recovery, and presence indicators. Before publishing, configure HTTPS/WSS hosting and allowed origins; the frontend Vercel deployment does not deploy this Java service.

References: [Spring Boot requirements](https://docs.spring.io/spring-boot/system-requirements.html), [STOMP token authentication](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/authentication-token-based.html), and [private user destinations](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/user-destination.html).
