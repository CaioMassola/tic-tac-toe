import Link from "next/link";
import { Icon } from "@/components/icons";
import type { TranslationProps } from "@/lib/translations";
import { HeroArtwork } from "./hero-artwork";

export function HomeHero({ t }: TranslationProps) {
  return (
    <section className="hero grid lg:grid-cols-[1.08fr_1fr] items-center gap-10 lg:gap-14 pt-14 pb-14 sm:pt-20 sm:pb-20">
      <div className="relative z-10">
        <p className="eyebrow mb-6 flex items-center gap-2.5">
          <span className="status-dot" />
          {t.tagline}
        </p>
        <h1 className="hero-title">
          {t.hero1}
          <br />
          <span className="text-accent">{t.hero2}</span>
        </h1>
        <p className="text-muted text-base sm:text-lg leading-8 max-w-[420px] mt-6">
          {t.intro}
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/play" className="button-primary">
            {t.start}
            <Icon name="arrow" />
          </Link>
          <Link href="/online" className="button-secondary">
            <Icon name="users" />
            {t.invite}
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-7 text-xs text-muted">
          {[t.free, t.quick, t.fun].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Icon name="check" className="w-3.5 h-3.5 text-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>
      <HeroArtwork t={t} />
    </section>
  );
}
