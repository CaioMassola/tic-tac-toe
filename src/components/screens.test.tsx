import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

describe("computer session", () => {
  it("has one name input, blocks computer turns and resets when switching sides", () => {
    vi.useFakeTimers();
    const { unmount } = render(<PlayPage />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    const selected = screen.getByRole("button", { name: "X · Primeiro" });
    fireEvent.click(selected);
    selected.setAttribute("value", "invalid");
    fireEvent.click(selected);
    selected.setAttribute("value", "X");
    fireEvent.change(screen.getByLabelText("Seu apelido"), { target: { value: "Ana" } });
    expect(screen.getByRole("status")).toHaveTextContent("Sua vez, Ana");
    fireEvent.click(screen.getByRole("button", { name: "Casa 1: vazia" }));
    expect(screen.getByRole("button", { name: "Casa 2: vazia" })).toBeDisabled();
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("button", { name: "Casa 5: O" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Sua vez, Ana");
    fireEvent.click(screen.getByRole("button", { name: "O · Segundo" }));
    expect(screen.getByRole("button", { name: "Casa 1: vazia" })).toBeDisabled();
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("button", { name: "Casa 5: X" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Casa 1: vazia" }));
    expect(screen.getByRole("button", { name: "Casa 1: O" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "X · Primeiro" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: "Casa 5: vazia" })).toBeEnabled();
    expect(screen.getByLabelText("Seu apelido")).toHaveValue("Ana");
    unmount();
    vi.useRealTimers();
  });

  it("scores a computer win, starts rematches with X and confirms session reset", () => {
    vi.useFakeTimers();
    const { unmount } = render(<PlayPage />);
    for (const cell of [1, 2, 4]) {
      fireEvent.click(screen.getByRole("button", { name: "Casa " + cell + ": vazia" }));
      act(() => vi.advanceTimersByTime(400));
    }
    expect(screen.getByRole("status")).toHaveTextContent("Máquina venceu!");
    expect(screen.getByTestId("score-O")).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "Jogar novamente" }));
    expect(screen.getByRole("status")).toHaveTextContent("Sua vez");
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar sessão" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }),
    );
    expect(screen.getByTestId("score-O")).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar sessão" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Sim, reiniciar" }),
    );
    expect(screen.getByTestId("score-O")).toHaveTextContent("0");
    expect(screen.getByText("Sua história começa na primeira partida.")).toBeVisible();
    unmount();
    vi.useRealTimers();
  });

  it("translates default player and computer names", async () => {
    const user = userEvent.setup();
    render(<PlayPage />);
    await user.type(screen.getByLabelText("Seu apelido"), "   ");
    await user.selectOptions(screen.getByRole("combobox"), "en-US");
    expect(screen.getByRole("status")).toHaveTextContent("Your turn");
    expect(screen.getByText("Computer")).toBeVisible();
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
