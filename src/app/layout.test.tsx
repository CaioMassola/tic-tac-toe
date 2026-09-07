import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import RootLayout, { metadata } from "./layout";

it("renders the document language, content, metadata and preference bootstrap", () => {
  const html = renderToStaticMarkup(
    <RootLayout>
      <main>trio</main>
    </RootLayout>,
  );
  expect(html).toContain('lang="pt-BR"');
  expect(html).toContain('data-theme="dark"');
  expect(html).toContain("<main>trio</main>");
  expect(html).toContain("trio-theme");
  expect(html).toContain("trio-locale");
  expect(metadata.title).toBe("trio — Jogo da velha");
});

it("applies saved preferences before hydration and tolerates blocked storage", () => {
  const html = renderToStaticMarkup(
    <RootLayout>
      <main>trio</main>
    </RootLayout>,
  );
  const script = new DOMParser()
    .parseFromString(html, "text/html")
    .querySelector("script")?.textContent;
  expect(script).toBeTruthy();

  localStorage.setItem("trio-locale", "es");
  localStorage.setItem("trio-theme", "light");
  window.eval(script!);
  expect(document.documentElement).toHaveAttribute("lang", "es");
  expect(document.documentElement).toHaveAttribute("data-theme", "light");

  localStorage.setItem("trio-locale", "invalid");
  localStorage.setItem("trio-theme", "invalid");
  document.documentElement.lang = "pt-BR";
  window.eval(script!);
  expect(document.documentElement).toHaveAttribute("lang", "pt-BR");
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");

  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Blocked storage");
  });
  expect(() => window.eval(script!)).not.toThrow();
});
