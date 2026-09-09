# trio — Tic-tac-toe

A learning project built with Next.js (App Router), React, TypeScript, Tailwind CSS, and a Java/Spring Boot backend. This standalone project lives in `{path}/tic-tac-toe`.

## Getting started

Requirements: Node.js 24 and npm.

```powershell
cd "{path}/tic-tac-toe"
npm install
npm run dev
```

Open http://localhost:3000. To run a local production build, use `npm run build` followed by `npm start`.

For development, run these commands from the project root:

| Command             | Starts                                           |
| ------------------- | ------------------------------------------------ |
| `npm run dev:all`   | Frontend and backend together, with labeled logs |
| `npm run dev:front` | Only the frontend on port 3000                   |
| `npm run dev:back`  | Only the backend on port 8080                    |

`npm run dev` remains an alias for starting the frontend. The backend command uses the Maven Wrapper to compile and start Spring Boot from source; Java 21 or later is required. The first run may download Maven dependencies. With `dev:all`, Ctrl+C stops both services, and if either exits, the other is stopped too. Stop existing servers before running these commands on the same ports.

The address http://127.0.0.1:3000 is also permitted by `allowedDevOrigins` in `next.config.ts`. In Next.js 16.3, other development hosts must be explicitly allowed: a blocked development connection can leave the page visible without enabling clicks. After changing this configuration, restart the server and reload the page.

## Features

- `/`: home page, introduction, and game mode selection.
- `/play`: game against the computer with one player name, X/O selection, scores, and round history. X always starts, including rematches; changing symbols resets the session.
- `/online`: create/join two-player rooms, host-controlled start, server-authoritative moves, wins/draws, scores, the last five rounds, and rematches with alternating starters. Both browsers receive updates through authenticated WebSocket/STOMP.
- Room chat becomes available when both players join, before the match starts. It sits on the right on desktop and below the game on mobile, with fixed X/O avatars, timestamps, typing indicators, and a collapsible panel with unread-message counts.
- `/rules`: rules and winning examples.
- Dark and light themes; Brazilian Portuguese, American English, and Spanish. Preferences are saved in the browser, with an in-memory fallback when storage is blocked.
- Responsive interface, keyboard-accessible controls, screen reader announcements for results, and support for reduced motion preferences.

**Online matches are playable.** Start the backend to use rooms; see [backend setup and API](backend/README.md). The host (X) can start once the second player joins and can start a rematch after a win/draw. Only the player whose turn it is can move. The server checks player identity, game rules, and the room revision before changing state, preventing duplicate or delayed requests from affecting another turn or round.

Rooms live in one backend process, expire 30 minutes after creation, and disappear when it restarts. Each member gets a private token and X/O assignment. Temporary WebSocket interruptions reconnect and request a fresh room snapshot. In this milestone, membership exists only while the online page remains open: refreshing or leaving loses access and does not free the occupied slot. Session recovery and explicit leaving are next-stage work. The lobby's player list represents membership, not live presence.

Chat uses an independent authenticated channel and revision counter, so messages and typing do not invalidate game moves. The server keeps the latest 100 messages per room, limits messages to 500 characters and one per player every 300 ms, and assigns the sender from the private token. Retrying the same message ID does not duplicate it while it remains in the history. Typing notifications expire after four seconds. Reconnecting restores the chat history; failed sends retain the draft for retry. Messages disappear with the room.

To run both applications, build and start Java in one terminal (Java 21 or later, no separate Maven installation required):

```powershell
cd "{path}/tic-tac-toe/backend"
.\mvnw.cmd verify
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Run `npm run dev` from the project root in another terminal. Open `/online` in two browsers, create a room in the first, and enter its code in the second. Click **Iniciar partida** in the host's browser; the board appears in both. Play a round and have both players click **Jogar novamente** to start a rematch. A third player receives a room-full error.

`NEXT_PUBLIC_BACKEND_URL` defaults to `http://localhost:8080`. See `.env.example`; rebuild the frontend after changing this variable. The backend accepts the local frontend origins by default; configure `TRIO_ALLOWED_ORIGINS` for other origins. Production requires a publicly reachable HTTPS/WSS backend; deployment is still pending.

Scores and player names last while the game screen remains open. Leaving or refreshing starts a new session. Theme and language preferences persist.

## Project structure

```text
src/
  app/                  Routes, layout, theme, and global styles
  components/
    layout/             Page structure, header, footer, and logo
    home/               Introduction and game mode cards
    game/               Board, status, scores, players, and history
    online/             Room form, live lobby, online board and invitation instructions
    rules/              Rules and winning examples
    shared/             Page introduction and illustrative board
    icons.tsx           SVG icons and X/O symbols
  hooks/
    use-local-game.ts   Session state and game actions
    use-room-form.ts    Room form state, validation, and handlers
    use-online-room.ts  Connection, versioned snapshots, and authenticated commands
    use-translation.ts  Access to the selected language dictionary
  lib/
    game.ts             Pure rules and local game reducer
    game.test.ts        Rules and translation tests
    preferences.ts      Theme and language persistence
    rooms.ts            Room types, HTTP commands, and STOMP transport
    translations.ts     Typed pt-BR, en-US, and es dictionaries
tests/app.spec.ts       Desktop and mobile browser flows
tests/rooms.spec.ts     Real online matches, rematches, and reconnects
backend/               Spring Boot room API, rules, and tests
```

Start with `lib/game.ts` to understand the rules. Then explore `hooks/use-local-game.ts`, which connects the reducer to session actions. The `components/game/local-game-screen.tsx` screen composes components and passes data and events through props; each component has a defined responsibility.

Routes in `app/` compose `AppShell` with the corresponding screen. The room form manages its own fields and validation. Text uses typed dictionaries; a missing translation causes a TypeScript error.

JSX events use named handlers, such as `onChange={handleLocaleChange}`. ESLint prevents anonymous functions in event props. Form rules live in `useRoomForm`; components adapt browser events when needed.

Hooks have distinct responsibilities:

- `useState`: fields, form errors, and player names.
- `useReducer`: coordinated changes to the board, turn, scores, and history.
- `useCallback`: stable references for actions exposed by `useLocalGame`.
- `useMemo`: game result and winning line reference, recalculated when the board changes. Together with `memo(GameBoard)` and a stable `playMove`, this lets the board avoid rendering again solely because a name was edited.

Simple HTML element handlers do not need memoization. Memoization preserves references and avoids work in specific situations; it does not replace organized logic or imply a measured performance improvement.

Components use Tailwind for layout, spacing, and typography. Global CSS defines theme tokens and the board's visual components. Typography uses local system fonts, with no downloads during the build.

## Validation

```powershell
npm run lint
npm run format:check
npm test
npm run test:coverage
npm run build
```

Run `npm run format` to format the project. Prettier standardizes JSX, TypeScript, CSS, and configuration files with two-space indentation. ESLint requires blank lines between functions and before exports and returns. `.editorconfig` defines UTF-8, line endings, and indentation for compatible editors.

For browser testing, first run `backend/mvnw.cmd -f backend/pom.xml verify` (Windows) or `bash backend/mvnw -f backend/pom.xml verify` (Linux/macOS), then `npm run test:e2e`. Playwright automatically starts the frontend and the packaged Java backend, or reuses servers on ports 3000 and 8080 outside CI. Room tests use real HTTP and WebSocket connections across independent browser contexts; the server-unavailable scenario explicitly blocks requests.

Unit tests cover winning lines, draws, invalid moves, scoring, rematches, resets, and all 255,168 possible complete games starting with X. Playwright checks languages, persistence, themes, gameplay, and forms at desktop and mobile sizes.

## Continuous integration

The GitHub Actions workflow in `.github/workflows/ci.yml` runs on pushes to `main`, pull requests, and manual dispatches from the Actions tab. It uses Node.js 24 and installs dependencies from `package-lock.json` with `npm ci`.

Checks run in order: Java 21 backend tests and packaging, lint, production build, unit and integration tests with the existing 100% coverage thresholds, then Playwright tests on desktop and mobile using Chromium against the production build and Java backend. A failed step stops the remaining checks. When running Playwright with `CI=true` locally, build both applications first; outside CI, Playwright starts the development server and the packaged backend.

### Vercel deployment

After validation succeeds on `main`, the `deploy` job builds and publishes production artifacts to the existing Vercel project `tic-tac-toe`. Pull requests only run validation. `vercel.json` disables automatic Git deployments so they cannot bypass CI.

Configure these repository secrets in GitHub under **Settings > Secrets and variables > Actions**:

- `VERCEL_TOKEN`: a Vercel token with access to the project's team.
- `VERCEL_ORG_ID`: the account/team ID that owns the project.
- `VERCEL_PROJECT_ID`: the ID of the existing `tic-tac-toe` project, not its name.

The IDs are available in `.vercel/project.json` after linking the existing project with the Vercel CLI. Keep tokens and `.vercel` files out of Git. See the [official Vercel setup guide](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

Missing secrets fail the deployment job with an explicit error. Once configured, rerun the failed job from GitHub Actions or manually run the CI workflow on `main`. Until configured, the current live deployment stays online but new production deployments cannot run.

## Code coverage

The project uses `@vitest/coverage-v8`, which is compatible with Vitest. `karma-coverage` is a plugin for the Karma runner and does not collect coverage from Vitest tests.

Run `npm run test:coverage` to execute unit and integration tests and generate:

- `coverage/index.html`: a browsable report by file.
- `coverage/lcov.info`: integration with analysis tools and CI.
- `coverage/coverage-summary.json`: percentages in JSON format.
- A terminal summary of lines, statements, functions, and branches.

The configuration includes **all `.ts` and `.tsx` files in `src`**, including files without tests. It excludes only tests themselves, type declarations, and infrastructure in `src/test`. CSS, images, dependencies, and Next.js generated code are outside this metric.

Thresholds are **100% per file** across all four metrics. If code changes without sufficient tests, `npm run test:coverage` fails. Do not add production code exclusions to bypass the threshold; add relevant scenarios.

Integration tests use React Testing Library and JSDOM to exercise screens, events, hooks, validation, saved preferences, storage failures, and game results. Native dialog behavior is simulated in JSDOM and verified in the browser with Playwright. Execution of the preferences script before hydration also has a behavioral test; its embedded text is not separately instrumented by the TSX report.

E2E tests remain separate in `npm run test:e2e`; their results do not contribute to Vitest coverage. **100% coverage means that instrumented code was exercised, not that every possible scenario or defect has been eliminated.**

Playwright uses the installed Microsoft Edge browser by default. In another environment, install Chromium with `npx playwright install chromium` and run:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm run test:e2e
```

To check the production version, run `npm run build`, keep `npm start` running, and execute `npm run test:e2e` in another terminal. Screenshots are saved in `test-results/`.

References: [Next.js](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind CSS](https://tailwindcss.com/docs/installation/using-postcss).
