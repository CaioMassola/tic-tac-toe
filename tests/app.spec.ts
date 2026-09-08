import { test, expect } from "@playwright/test";

test("home, themes, and all locales persist across navigation and reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Só maisuma partida.");
  await page.getByRole("button", { name: "Ativar tema claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Idioma").selectOption("en-US");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Just onemore round.");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("link", { name: "How to play", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Three in a row. That's it.",
  );
  await page.getByLabel("Language").selectOption("es");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tres en línea. Así de fácil.",
  );
  await page.getByRole("button", { name: "Activar tema oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});

test("computer game supports both symbols, rematches and reset", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await page.getByLabel("Seu apelido").fill("Ana");
  for (const cell of [1, 2, 4]) {
    await expect(page.getByRole("status")).toContainText("Sua vez, Ana");
    await page
      .getByRole("button", { name: "Casa " + cell + ": vazia", exact: true })
      .click();
  }
  await expect(page.getByRole("status")).toContainText("Máquina venceu!");
  await expect(page.getByTestId("score-O")).toHaveText("1");
  await page.getByRole("button", { name: "Jogar novamente" }).click();
  await expect(page.getByRole("status")).toContainText("Sua vez, Ana");
  await page.getByRole("button", { name: "Reiniciar sessão" }).click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByTestId("score-O")).toHaveText("1");
  await page.getByRole("button", { name: "Reiniciar sessão" }).click();
  await page.getByRole("button", { name: "Sim, reiniciar" }).click();
  await expect(page.getByTestId("score-O")).toHaveText("0");
  await page.getByRole("button", { name: "O · Segundo" }).click();
  await expect(
    page.getByRole("button", { name: "Casa 5: X", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Casa 1: vazia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Casa 1: O", exact: true }),
  ).toBeVisible();
});

test("online validates inputs and honestly reports missing server", async ({ page }) => {
  await page.route("**/api/rooms**", (route) => route.abort());
  await page.goto("/online");
  await page.getByRole("button", { name: "Criar minha sala" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "pelo menos 2 caracteres",
  );
  await page.getByLabel("Seu apelido").fill("Ana");
  await page.getByRole("button", { name: "Criar minha sala" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Nenhuma sala foi criada",
  );
  await page.getByRole("button", { name: "Entrar em uma sala", exact: true }).click();
  await page.getByRole("button", { name: "Entrar na sala", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "6 letras ou números",
  );
  await page.getByLabel("Código da sala").fill("abc123");
  await page.getByRole("button", { name: "Entrar na sala", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "servidor de partidas não está disponível",
  );
});

test("all screens fit the viewport in all languages and themes", async ({
  page,
}, testInfo) => {
  for (const route of ["/", "/play", "/online", "/rules"]) {
    await page.goto(route);
    for (const locale of ["pt-BR", "en-US", "es"]) {
      await page.locator("select").selectOption(locale);
      for (const theme of ["dark", "light"]) {
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
          await page.locator("header button").click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      }
    }
  }
  await page.goto("/");
  await page.locator("select").selectOption("pt-BR");
  await page.locator("header button").click();
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}-dark.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.locator("header button").click();
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}-light.png`,
    fullPage: true,
    animations: "disabled",
  });
});
