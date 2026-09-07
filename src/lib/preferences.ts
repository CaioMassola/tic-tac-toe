"use client";

import { useSyncExternalStore } from "react";
import { type Locale } from "./translations";

function subscribe(callback: () => void) {
  const onStorage = () => {
    memoryLocale = undefined;
    memoryTheme = undefined;
    callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("trio-preferences", callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("trio-preferences", callback);
  };
}

function read(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

let memoryLocale: Locale | undefined;
let memoryTheme: "light" | "dark" | undefined;

export function usePreferences() {
  const locale = useSyncExternalStore(
    subscribe,
    () => {
      const value = memoryLocale ?? read("trio-locale", "pt-BR");

      return (["pt-BR", "en-US", "es"].includes(value) ? value : "pt-BR") as Locale;
    },
    () => "pt-BR" as Locale,
  );
  const theme = useSyncExternalStore(
    subscribe,
    () => memoryTheme ?? (read("trio-theme", "dark") === "light" ? "light" : "dark"),
    () => "dark",
  );

  function setLocale(value: Locale) {
    memoryLocale = value;
    document.documentElement.lang = value;
    try {
      localStorage.setItem("trio-locale", value);
    } catch {
      /* Keep the in-memory preference. */
    }
    window.dispatchEvent(new Event("trio-preferences"));
  }

  function toggleTheme() {
    memoryTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = memoryTheme;
    try {
      localStorage.setItem("trio-theme", memoryTheme);
    } catch {
      /* Keep the in-memory preference. */
    }
    window.dispatchEvent(new Event("trio-preferences"));
  }

  return { locale, theme, setLocale, toggleTheme };
}
