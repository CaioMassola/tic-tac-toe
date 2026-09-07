import Link from "next/link";
import { Icon, Symbol } from "@/components/icons";
import type { TranslationProps } from "@/lib/translations";

export function OnlineSteps({ t }: TranslationProps) {
  return (
    <section className="online-steps panel p-7 sm:p-10">
      <div className="flex items-center gap-2 mb-9">
        <Symbol mark="X" className="w-14 h-14" />
        <span className="text-muted text-xl">+</span>
        <Symbol mark="O" className="w-14 h-14" />
      </div>
      <div className="space-y-8">
        {[
          [t.step1, t.step1Desc],
          [t.step2, t.step2Desc],
          [t.step3, t.step3Desc],
        ].map(([title, desc], i) => (
          <div className="flex gap-4" key={title}>
            <span className="step-number">0{i + 1}</span>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted leading-6 mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/play"
        className="inline-flex items-center gap-3 text-sm font-semibold text-accent mt-10"
      >
        {t.tryLocal}
        <Icon name="arrow" />
      </Link>
    </section>
  );
}
