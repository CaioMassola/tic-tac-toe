import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { usePreferences } from "./preferences";

describe("preferences", () => {
  it("restores a saved light theme and locale on mount", () => {
    localStorage.setItem("trio-locale", "es");
    localStorage.setItem("trio-theme", "light");
    const { result } = renderHook(usePreferences);
    expect(result.current.locale).toBe("es");
    expect(result.current.theme).toBe("light");
  });

  it("persists changes and synchronizes subscribers on storage events", () => {
    const { result } = renderHook(usePreferences);
    act(() => result.current.setLocale("es"));
    act(() => result.current.toggleTheme());
    expect(localStorage.getItem("trio-locale")).toBe("es");
    expect(localStorage.getItem("trio-theme")).toBe("light");

    act(() => {
      localStorage.setItem("trio-locale", "en-US");
      localStorage.setItem("trio-theme", "dark");
      window.dispatchEvent(new StorageEvent("storage"));
    });
    expect(result.current.locale).toBe("en-US");
    expect(result.current.theme).toBe("dark");
  });

  it("rejects invalid stored preferences", () => {
    localStorage.setItem("trio-locale", "invalid");
    localStorage.setItem("trio-theme", "invalid");
    const { result } = renderHook(usePreferences);
    expect(result.current.locale).toBe("pt-BR");
    expect(result.current.theme).toBe("dark");
  });

  it("keeps controls working in memory when storage access is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked storage");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked storage");
    });
    const { result } = renderHook(usePreferences);
    expect(result.current.locale).toBe("pt-BR");
    act(() => result.current.setLocale("en-US"));
    act(() => result.current.toggleTheme());
    expect(result.current.locale).toBe("en-US");
    expect(result.current.theme).toBe("light");
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("removes its listeners when the subscriber unmounts", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(usePreferences);
    unmount();
    expect(remove).toHaveBeenCalledWith("storage", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("trio-preferences", expect.any(Function));
  });

  it("provides deterministic server-rendered defaults", () => {
    function PreferencesLabel() {
      const { locale, theme } = usePreferences();

      return (
        <span>
          {locale}/{theme}
        </span>
      );
    }

    localStorage.setItem("trio-locale", "es");
    localStorage.setItem("trio-theme", "light");
    expect(renderToString(<PreferencesLabel />)).toContain("pt-BR");
    expect(renderToString(<PreferencesLabel />)).toContain("dark");
  });
});
