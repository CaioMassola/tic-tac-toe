"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

import { useTranslation } from "@/hooks/use-translation";
import { HomeHero } from "./home-hero";
import { GameModes } from "./game-modes";

export function HomeScreen() {
  const t = useTranslation();

  return (
    <>
      <HomeHero t={t} />
      <GameModes t={t} />
      <section className="tip-banner flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
        <div className="flex gap-4 items-center">
          <span className="text-accent">
            <Icon name="spark" className="w-7 h-7" />
          </span>
          <div>
            <h2 className="font-semibold text-sm">{t.tip}</h2>
            <p className="text-muted text-xs mt-1.5 leading-5">{t.tipDesc}</p>
          </div>
        </div>
        <Link
          href="/rules"
          className="text-sm font-semibold flex items-center gap-3 shrink-0"
        >
          {t.learn}
          <Icon name="arrow" className="w-4 h-4" />
        </Link>
      </section>
    </>
  );
}
