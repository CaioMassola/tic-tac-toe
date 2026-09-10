import { test, expect } from "@playwright/test";
import { backendUrl } from "../src/lib/rooms";

test("two browsers share a real room and reject a third player", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(60000);
  const guestContext = await browser.newContext();
  const thirdContext = await browser.newContext();
  const disconnects: (() => void)[] = [];
  await guestContext.routeWebSocket("**/ws", (socket) => {
    socket.connectToServer();
    disconnects.push(() => socket.close());
  });
  const guest = await guestContext.newPage();
  const third = await thirdContext.newPage();
  try {
    await page.goto("/online");
    await page.getByLabel("Seu apelido").fill("Ana");
    await page.getByRole("button", { name: "Criar minha sala" }).click();
    await expect(page.getByRole("status")).toHaveText("Aguardando seu amigo");
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
      await expect(participant.getByRole("listitem")).toHaveText(["Ana", "Beto"]);
      await expect(participant.getByTestId("room-code")).toHaveCount(0);
      await expect(
        participant.getByRole("button", { name: "Copiar código" }),
      ).toHaveCount(0);
    }
    await expect(page.getByText("Seu símbolo: X")).toBeVisible();
    await expect(guest.getByText("Seu símbolo: O")).toBeVisible();
    await expect(
      guest.getByRole("button", { name: "Iniciar partida", exact: true }),
    ).toHaveCount(0);

    // Chat is available before starting and shares messages without changing the game.
    await expect(page.getByLabel("Mensagem", { exact: true })).toBeEnabled();
    await guest.getByLabel("Mensagem", { exact: true }).fill("Boa sorte, Ana!");
    await expect(page.getByText("Beto está digitando…")).toBeVisible();
    await guest.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
    await expect(page.getByRole("log").getByText("Boa sorte, Ana!")).toBeVisible();
    await expect(page.getByText("Beto está digitando…")).toHaveCount(0);
    await page.getByLabel("Mensagem", { exact: true }).fill("Boa sorte, Beto!");
    await page.getByLabel("Mensagem", { exact: true }).press("Enter");
    await expect(guest.getByRole("log").getByText("Boa sorte, Beto!")).toBeVisible();
    await page.getByRole("button", { name: "Recolher chat" }).click();
    await expect(page.getByRole("log")).toHaveCount(0);
    await guest.getByLabel("Mensagem", { exact: true }).fill("Vamos jogar?");
    await guest.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
    await expect(page.getByLabel("1 novas mensagens")).toBeVisible();
    await page.getByRole("button", { name: "Expandir chat" }).click();
    await expect(page.getByRole("log").getByText("Vamos jogar?")).toBeVisible();
    await expect(page.getByLabel("1 novas mensagens")).toHaveCount(0);

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
    disconnects.forEach((disconnect) => disconnect());
    await expect(guest.getByRole("status")).toContainText("Conectando", {
      timeout: 15000,
    });
    await guestContext.setOffline(false);
    await expect(guest.getByRole("status")).toHaveText(
      "Os dois jogadores estão na sala!",
      { timeout: 15000 },
    );

    await page.getByRole("button", { name: "Iniciar partida", exact: true }).click();
    await expect(guest.getByRole("log").getByText("Boa sorte, Ana!")).toBeVisible();
    const chatBounds = await page
      .getByRole("complementary", { name: "Chat da sala" })
      .boundingBox();
    const gameBounds = await page
      .getByRole("region", { name: "Sala de espera" })
      .boundingBox();
    if (testInfo.project.name === "desktop")
      expect(chatBounds!.x).toBeGreaterThan(gameBounds!.x + gameBounds!.width);
    else expect(chatBounds!.y).toBeGreaterThan(gameBounds!.y);
    await page.screenshot({
      path: testInfo.outputPath("online-chat.png"),
      fullPage: true,
    });
    for (const participant of [page, guest]) {
      await expect(
        participant.getByRole("heading", { name: "Partida online", exact: true }),
      ).toBeVisible();
      await expect(participant.getByRole("status")).toContainText(
        participant === page ? "Sua vez" : "Vez de Ana",
      );
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
    await expect(guest.getByRole("status")).toContainText("Sua vez");
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
  const response = await request.post(`${backendUrl()}/api/rooms`, {
    data: { nickname: "Ana" },
  });
  const membership = await response.json();
  await page.goto("/online");
  const rejected = await page.evaluate(
    async ({ code, url }) => {
      return new Promise<string>((resolve) => {
        const socket = new WebSocket(`${url.replace(/^http/, "ws")}/ws`, ["v12.stomp"]);
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
    },
    { code: membership.room.code as string, url: backendUrl() },
  );
  expect(rejected).toMatch(/^ERROR/);
});
