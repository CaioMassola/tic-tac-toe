"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageIntro } from "@/components/shared/page-intro";
import { useTranslation } from "@/hooks/use-translation";
import { VictoryExamples } from "./victory-examples";

export function RulesScreen() {
  const t = useTranslation();

  return (
    <>
      <PageIntro
        t={t}
        label={t.rulesLabel}
        title={t.rulesHeading}
        subtitle={t.rulesIntro}
      />
      <div className="grid md:grid-cols-3 gap-5">
        {[
          [t.rule1, t.rule1Desc],
          [t.rule2, t.rule2Desc],
          [t.rule3, t.rule3Desc],
        ].map(([title, desc], i) => (
          <section className="panel p-7" key={title}>
            <span className="text-4xl font-light text-accent font-mono">
              0{i + 1}
              <span className="text-muted">.</span>
            </span>
            <h2 className="font-bold text-xl mt-6 mb-3">{title}</h2>
            <p className="text-muted text-sm leading-7">{desc}</p>
          </section>
        ))}
      </div>
      <VictoryExamples t={t} />
      <section className="tip-banner mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-xl font-semibold">{t.ready}</h2>
          <p className="text-sm text-muted mt-2">{t.readySub}</p>
        </div>
        <Link href="/play" className="button-primary">
          {t.start}
          <Icon name="arrow" />
        </Link>
      </section>
    </>
  );
}
