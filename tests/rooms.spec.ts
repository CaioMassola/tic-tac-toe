import { test, expect } from "@playwright/test";

test("two browsers share a real room and reject a third player", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const guestContext = await browser.newContext();
  const thirdContext = await browser.newContext();
  let disconnect!: () => void;
  await guestContext.routeWebSocket("**/ws", (socket) => {
    socket.connectToServer();
    disconnect = () => socket.close();
  });
  const guest = await guestContext.newPage();
  const third = await thirdContext.newPage();
  try {
    await page.goto("/online");
    await page.getByLabel("Seu apelido").fill("Ana");
    await page.getByRole("button", { name: "Criar minha sala" }).click();
    await expect(page.getByRole("status")).toHaveText("Aguardando seu amigo…");
    const code = await page.getByTestId("room-code").innerText();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    await expect(
      page.getByRole("button", { name: "Iniciar partida", exact: true }),
    ).toBeDisabled();

    await guest.goto("http://127.0.0.1:3000/online");
    await guest.getByRole("button", { name: "Entrar em uma sala", exact: true }).click();
    await guest.getByLabel("Seu apelido").fill("Beto");
    await guest.getByLabel("Código da sala").fill(code);
    await guest.getByRole("button", { name: "Entrar na sala", exact: true }).click();
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("status")).toHaveText(
        "Os dois jogadores estão na sala!",
      );
      await expect(participant.getByRole("listitem")).toHaveText(["X — Ana", "O — Beto"]);
      await expect(participant.getByTestId("room-code")).toHaveText(code);
    }
    await expect(page.getByText("Seu símbolo: X")).toBeVisible();
    await expect(guest.getByText("Seu símbolo: O")).toBeVisible();
    await expect(
      guest.getByRole("button", { name: "Iniciar partida", exact: true }),
    ).toHaveCount(0);

    await third.goto("http://127.0.0.1:3000/online");
    await third.getByRole("button", { name: "Entrar em uma sala", exact: true }).click();
    await third.getByLabel("Seu apelido").fill("Third");
    await third.getByLabel("Código da sala").fill(code);
    await third.getByRole("button", { name: "Entrar na sala", exact: true }).click();
    await expect(third.locator("form").getByRole("alert")).toHaveText(
      "Esta sala já tem dois jogadores.",
    );

    // A connection interruption keeps the membership and re-fetches the snapshot.
    await guestContext.setOffline(true);
    disconnect();
    await expect(guest.getByRole("status")).toContainText("Conectando", {
      timeout: 15000,
    });
    await guestContext.setOffline(false);
    await expect(guest.getByRole("status")).toHaveText(
      "Os dois jogadores estão na sala!",
      { timeout: 15000 },
    );

    await page.getByRole("button", { name: "Iniciar partida", exact: true }).click();
    for (const participant of [page, guest]) {
      await expect(
        participant.getByRole("heading", { name: "Partida online", exact: true }),
      ).toBeVisible();
      await expect(participant.getByRole("status")).toContainText("Vez de Ana");
    }
    await expect(
      guest.getByRole("button", { name: "Casa 1: vazia", exact: true }),
    ).toBeDisabled();

    async function playRound(moves: number[], startsWithGuest = false) {
      for (const [turn, cell] of moves.entries()) {
        const guestTurn = (turn % 2 === 0) === startsWithGuest;
        const current = guestTurn ? guest : page;
        const opponent = guestTurn ? page : guest;
        const mark = guestTurn ? "O" : "X";
        await expect(
          opponent.getByRole("button", { name: `Casa ${cell}: vazia`, exact: true }),
        ).toBeDisabled();
        await current
          .getByRole("button", { name: `Casa ${cell}: vazia`, exact: true })
          .click();
        for (const participant of [page, guest]) {
          await expect(
            participant.getByRole("button", {
              name: `Casa ${cell}: ${mark}`,
              exact: true,
            }),
          ).toBeDisabled();
        }
      }
    }

    await playRound([1, 4, 2, 5, 3]);
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("status")).toContainText(
        participant === page ? "Você venceu!" : "Você perdeu!",
      );
      await expect(participant.getByTestId("score-X")).toHaveText("1");
    }
    await expect(guest.getByRole("button", { name: "Pedir revanche" })).toBeEnabled();
    await page.getByRole("button", { name: "Jogar novamente" }).click();
    await expect(
      page.getByRole("button", { name: "Confirmado", exact: true }),
    ).toBeDisabled();
    await expect(
      guest.getByText("Seu amigo quer jogar novamente. Confirme para começar."),
    ).toBeVisible();
    await expect(guest.getByRole("status")).toContainText("Você perdeu!");
    await expect(guest.getByRole("heading", { name: "Você perdeu!" })).toHaveCSS(
      "color",
      "rgb(248, 113, 113)",
    );
    await guest.getByRole("button", { name: "Ana quer jogar novamente" }).click();
    await expect(guest.getByRole("status")).toContainText("Vez de Beto");
    await playRound([1, 4, 2, 5, 3], true);
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("status")).toContainText(
        participant === guest ? "Você venceu!" : "Você perdeu!",
      );
      await expect(participant.getByTestId("score-O")).toHaveText("1");
    }
    await guest.getByRole("button", { name: "Jogar novamente" }).click();
    await expect(
      guest.getByRole("button", { name: "Confirmado", exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole("status")).toContainText("Você perdeu!");
    await page.getByRole("button", { name: "Beto quer jogar novamente" }).click();
    await expect(guest.getByRole("status")).toContainText("Vez de Ana");
    await playRound([1, 2, 3, 5, 4, 6, 8, 7, 9]);
    for (const participant of [page, guest]) {
      await expect(participant.getByRole("status")).toContainText("Deu velha!");
      await expect(participant.getByTestId("score-X")).toHaveText("1");
      await expect(participant.getByTestId("score-O")).toHaveText("1");
      await expect(participant.getByTestId("score-draw")).toHaveText("1");
      expect(
        await participant.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  } finally {
    await guestContext.close();
    await thirdContext.close();
  }
});

test("room codes do not grant access to private WebSocket events", async ({
  page,
  request,
}) => {
  const response = await request.post("http://localhost:8080/api/rooms", {
    data: { nickname: "Ana" },
  });
  const membership = await response.json();
  await page.goto("/online");
  const rejected = await page.evaluate(async (code: string) => {
    return new Promise<string>((resolve) => {
      const socket = new WebSocket("ws://localhost:8080/ws", ["v12.stomp"]);
      const timeout = window.setTimeout(() => {
        socket.close();
        resolve("timeout");
      }, 5000);
      socket.onopen = () =>
        socket.send(`CONNECT\naccept-version:1.2\nhost:localhost\ntoken:${code}\n\n\0`);
      socket.onmessage = (event) => {
        window.clearTimeout(timeout);
        resolve(String(event.data));
        socket.close();
      };
      socket.onclose = (event) => {
        window.clearTimeout(timeout);
        resolve(`closed:${event.code}`);
      };
      socket.onerror = () => {
        window.clearTimeout(timeout);
        resolve("socket-error");
      };
    });
  }, membership.room.code);
  expect(rejected).toMatch(/^ERROR/);
});
