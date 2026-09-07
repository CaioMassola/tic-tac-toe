import "@testing-library/jest-dom/vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { usePreferences } from "@/lib/preferences";

// JSDOM does not implement the browser's modal behavior. Playwright covers it.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute("open", "");
};

HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute("open");
};

beforeEach(() => {
  // Reset the module's in-memory fallback through its public storage subscription.
  const { unmount } = renderHook(usePreferences);
  act(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage"));
  });
  unmount();
  document.documentElement.lang = "pt-BR";
  document.documentElement.dataset.theme = "dark";
});

afterEach(() => {
  vi.restoreAllMocks();
  act(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage"));
  });
  cleanup();
});
