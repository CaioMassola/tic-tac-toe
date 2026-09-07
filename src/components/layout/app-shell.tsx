"use client";

import { useEffect, type ReactNode } from "react";
import { usePreferences } from "@/lib/preferences";
import { translations } from "@/lib/translations";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export type View = "home" | "play" | "online" | "rules";

type AppShellProps = {
  view: View;
  children: ReactNode;
};

export function AppShell({ view, children }: AppShellProps) {
  const preferences = usePreferences();
  const { locale, theme } = preferences;
  const t = translations[locale];

  useEffect(() => {
    document.title = `trio — ${t[view]}`;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
  }, [t, locale, theme, view]);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="skip-link">
        {t.skip}
      </a>

      <SiteHeader view={view} t={t} {...preferences} />

      <main
        id="main"
        className="mx-auto w-full max-w-[1200px] flex-1 px-5 sm:px-8 pb-16"
        tabIndex={-1}
      >
        {children}
      </main>

      <SiteFooter t={t} />
    </div>
  );
}
