import type { TranslationProps } from "@/lib/translations";
import { ModeCard } from "./mode-card";

export function GameModes({ t }: TranslationProps) {
  return (
    <section className="pb-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">{t.choose}</h2>
          <p className="text-sm text-muted mt-2">{t.chooseSub}</p>
        </div>
        <span className="text-muted text-xs font-mono hidden sm:block">01 / 02</span>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <ModeCard
          href="/play"
          icon="screen"
          title={t.localTitle}
          description={t.localDesc}
          action={t.localCta}
          badge={t.localBadge}
          available
        />

        <ModeCard
          href="/online"
          icon="users"
          title={t.onlineTitle}
          description={t.onlineDesc}
          action={t.onlineCta}
          badge={t.soon}
        />
      </div>
    </section>
  );
}
