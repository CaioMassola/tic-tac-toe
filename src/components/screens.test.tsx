import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import PlayPage from "@/app/play/page";
import OnlinePage from "@/app/online/page";
import RulesPage from "@/app/rules/page";

describe("translated screens", () => {
  it("ignores an unsupported language value", () => {
    render(<HomePage />);
    const select = screen.getByRole("combobox");
    const option = document.createElement("option");
    option.value = "unsupported";
    select.appendChild(option);
    fireEvent.change(select, { target: { value: "unsupported" } });
    expect(document.documentElement).toHaveAttribute("lang", "pt-BR");
    expect(localStorage.getItem("trio-locale")).toBeNull();
  });

  it.each([
    ["home", HomePage],
    ["play", PlayPage],
    ["online", OnlinePage],
    ["rules", RulesPage],
  ] as const)("renders %s with language and theme controls", async (_, Page) => {
    const user = userEvent.setup();
    render(<Page />);

    expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir para o conteúdo" })).toHaveAttribute(
      "href",
      "#main",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");

    await user.selectOptions(screen.getByRole("combobox"), "en-US");
    expect(document.documentElement).toHaveAttribute("lang", "en-US");
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    await user.selectOptions(screen.getByRole("combobox"), "es");
    await user.click(screen.getByRole("button", { name: "Activar tema oscuro" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.title).toMatch(/^trio — /);
  });

  it("provides links to the real routes and explains the rules", () => {
    const { unmount } = render(<HomePage />);
    expect(screen.getByRole("link", { name: "Vamos jogar" })).toHaveAttribute(
      "href",
      "/play",
    );
    expect(screen.getByRole("link", { name: "Jogar com amigos" })).toHaveAttribute(
      "href",
      "/online",
    );
    unmount();
    render(<RulesPage />);
    expect(screen.getByRole("heading", { name: "Horizontal" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Vertical" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Diagonal" })).toBeVisible();
  });
});

describe("local session", () => {
  it("rejects a player identifier outside X and O", () => {
    render(<PlayPage />);
    const input = screen.getByLabelText("Nome do jogador X");
    input.setAttribute("name", "invalid");
    fireEvent.change(input, { target: { value: "Invalid player" } });
    expect(screen.getByRole("status")).toHaveTextContent("Vez de Jogador X");
    expect(input).toHaveValue("");
  });

  it("plays wins for both players, a draw, rematches and confirmed reset", async () => {
    const user = userEvent.setup();
    render(<PlayPage />);

    await user.type(screen.getByLabelText("Nome do jogador X"), "Ana");
    await user.type(screen.getByLabelText("Nome do jogador O"), "Beto");
    expect(screen.getByRole("status")).toHaveTextContent("Vez de Ana");

    async function play(moves: number[]) {
      for (const cell of moves) {
        await user.click(screen.getByRole("button", { name: `Casa ${cell}: vazia` }));
      }
    }

    await play([1, 4, 2, 5, 3]);
    expect(screen.getByRole("status")).toHaveTextContent("Ana venceu!");
    expect(screen.getByTestId("score-X")).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Casa 9: vazia" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Jogar novamente" }));
    expect(screen.getByRole("status")).toHaveTextContent("Vez de Beto");
    await play([1, 4, 2, 5, 3]);
    expect(screen.getByRole("status")).toHaveTextContent("Beto venceu!");
    expect(screen.getByTestId("score-O")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Jogar novamente" }));
    await play([1, 2, 3, 5, 4, 6, 8, 7, 9]);
    expect(screen.getByRole("status")).toHaveTextContent("Deu velha!");
    expect(screen.getByTestId("score-draw")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Reiniciar sessão" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(screen.getByTestId("score-X")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Reiniciar sessão" }));
    await user.click(within(dialog).getByRole("button", { name: "Sim, reiniciar" }));
    expect(screen.getByTestId("score-X")).toHaveTextContent("0");
    expect(screen.getByTestId("score-O")).toHaveTextContent("0");
    expect(screen.getByTestId("score-draw")).toHaveTextContent("0");
    expect(screen.getByRole("status")).toHaveTextContent("Vez de Ana");
    expect(screen.getByText("Sua história começa na primeira partida.")).toBeVisible();
  });

  it("uses translated default names when names are empty or whitespace", async () => {
    const user = userEvent.setup();
    render(<PlayPage />);
    fireEvent.change(screen.getByLabelText("Nome do jogador X"), {
      target: { value: "   " },
    });
    await user.selectOptions(screen.getByRole("combobox"), "en-US");
    expect(screen.getByRole("status")).toHaveTextContent("Your turn, Player X");
    await user.click(screen.getByRole("button", { name: "Square 1: empty" }));
    expect(screen.getByRole("status")).toHaveTextContent("Your turn, Player O");
  });
});

describe("room form", () => {
  it("ignores an unsupported room mode", () => {
    render(<OnlinePage />);
    const button = screen.getByRole("button", { name: "Entrar em uma sala" });
    button.setAttribute("value", "invalid");
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Criar sala" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByLabelText("Código da sala")).not.toBeInTheDocument();
  });

  it("validates fields, clears errors on edits and never fabricates a room", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(<OnlinePage />);
    await user.click(screen.getByRole("button", { name: "Criar minha sala" }));
    expect(screen.getByRole("alert")).toHaveTextContent("pelo menos 2 caracteres");
    expect(screen.getByLabelText("Seu apelido")).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText("Seu apelido"), "Ana");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar minha sala" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Nenhuma sala foi criada ou acessada",
    );

    await user.click(screen.getByRole("button", { name: "Entrar em uma sala" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entrar na sala" }));
    expect(screen.getByRole("alert")).toHaveTextContent("6 letras ou números");
    const code = screen.getByLabelText("Código da sala");
    await user.type(code, "ab-12!cd");
    expect(code).toHaveValue("AB12CD");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entrar na sala" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "servidor de partidas não está disponível",
    );

    await user.selectOptions(screen.getByRole("combobox"), "en-US");
    expect(screen.getByRole("alert")).toHaveTextContent("No room was created or joined");
  });
});
