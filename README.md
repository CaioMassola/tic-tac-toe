# trio — Tic-tac-toe

A learning frontend built with Next.js (App Router), React, TypeScript, and Tailwind CSS. This standalone project lives in `{path}/tic-tac-toe`.

## Getting started

Requirements: Node.js 24 and npm.

```powershell
cd "{path}/tic-tac-toe"
npm install
npm run dev
```

Open http://localhost:3000. To run a local production build, use `npm run build` followed by `npm start`.

The address http://127.0.0.1:3000 is also permitted by `allowedDevOrigins` in `next.config.ts`. In Next.js 16.3, other development hosts must be explicitly allowed: a blocked development connection can leave the page visible without enabling clicks. After changing this configuration, restart the server and reload the page.

## Features

- `/`: home page, introduction, and game mode selection.
- `/play`: local two-player game with custom names, wins, draws, scores, the last five rounds, and rematches with alternating starting players.
- `/online`: preview of the create/join room screens with nickname and room code validation.
- `/rules`: rules and winning examples.
- Dark and light themes; Brazilian Portuguese, American English, and Spanish. Preferences are saved in the browser, with an in-memory fallback when storage is blocked.
- Responsive interface, keyboard-accessible controls, screen reader announcements for results, and support for reduced motion preferences.

**Online mode does not connect players yet.** The forms report that the server is unavailable and do not simulate a created room. The next step is to implement Java/Spring Boot, a room API, and WebSocket/STOMP. The server will be authoritative for online moves.

Scores and player names last while the game screen remains open. Leaving or refreshing starts a new session. Theme and language preferences persist.

## Project structure

```text
src/
  app/                  Routes, layout, theme, and global styles
  components/
    layout/             Page structure, header, footer, and logo
    home/               Introduction and game mode cards
    game/               Board, status, scores, players, and history
    online/             Room form and invitation instructions
    rules/              Rules and winning examples
    shared/             Page introduction and illustrative board
    icons.tsx           SVG icons and X/O symbols
  hooks/
    use-local-game.ts   Session state and game actions
    use-room-form.ts    Room form state, validation, and handlers
    use-translation.ts  Access to the selected language dictionary
  lib/
    game.ts             Pure rules and local game reducer
    game.test.ts        Rules and translation tests
    preferences.ts      Theme and language persistence
    translations.ts     Typed pt-BR, en-US, and es dictionaries
tests/app.spec.ts       Desktop and mobile browser flows
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

For browser testing, run `npm run test:e2e`. Playwright automatically starts the development server or reuses a server already running on port 3000 outside CI.

Unit tests cover winning lines, draws, invalid moves, scoring, rematches, resets, and all 255,168 possible complete games starting with X. Playwright checks languages, persistence, themes, gameplay, and forms at desktop and mobile sizes.

## Continuous integration

The GitHub Actions workflow in `.github/workflows/ci.yml` runs on pushes to `main`, pull requests, and manual dispatches from the Actions tab. It uses Node.js 24 and installs dependencies from `package-lock.json` with `npm ci`.

Checks run in order: lint, production build, unit and integration tests with the existing 100% coverage thresholds, then Playwright tests on desktop and mobile using Chromium against the production build. A failed step stops the remaining checks. When running Playwright with `CI=true` locally, run `npm run build` first; outside CI, Playwright starts the development server.

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
