import Link from "next/link";
import type { ChangeEvent } from "react";
import { Icon } from "@/components/icons";
import { Logo } from "./logo";
import { SoundToggle } from "./sound-toggle";
import type { Dictionary, Locale } from "@/lib/translations";
import type { View } from "./app-shell";

type SiteHeaderProps = {
  view: View;
  t: Dictionary;
  locale: Locale;
  theme: string;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
};

export function SiteHeader({
  view,
  t,
  locale,
  theme,
  setLocale,
  toggleTheme,
}: SiteHeaderProps) {
  const navigation: [View, string, string][] = [
    ["home", "/", t.home],
    ["online", "/online", t.online],
    ["rules", "/rules", t.rules],
  ];

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    const locale = event.currentTarget.value;

    if (locale === "pt-BR" || locale === "en-US" || locale === "es") {
      setLocale(locale);
    }
  }

  return (
    <header className="site-header">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 flex flex-wrap items-center justify-between gap-y-4 py-5">
        <Link href="/" aria-label={`trio — ${t.home}`}>
          <Logo />
        </Link>
        <nav
          aria-label={t.home}
          className="main-nav flex items-center gap-1 rounded-full p-1"
        >
          {navigation.map(([key, href, label]) => (
            <Link
              key={key}
              href={href}
              aria-current={view === key ? "page" : undefined}
              className={`nav-link ${view === key ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <Icon name="globe" className="text-muted hidden sm:block" />
            <select
              className="locale-select"
              aria-label={t.language}
              value={locale}
              onChange={handleLocaleChange}
            >
              <option value="pt-BR">PT-BR</option>
              <option value="en-US">EN-US</option>
              <option value="es">ES</option>
            </select>
          </div>
          <span className="h-5 w-px bg-line" />
          <SoundToggle t={t} />
          <button
            data-testid="theme-toggle"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t.light : t.dark}
            title={theme === "dark" ? t.light : t.dark}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
        </div>
      </div>
    </header>
  );
}
