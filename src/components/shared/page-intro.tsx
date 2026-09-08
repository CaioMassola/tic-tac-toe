import Link from "next/link";
import { Icon } from "@/components/icons";
import type { TranslationProps } from "@/lib/translations";

export function PageIntro({
  label,
  title,
  subtitle,
  t,
}: TranslationProps & { label: string; title: string; subtitle: string }) {
  return (
    <div className="pt-3 sm:pt-4 pb-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted text-xs hover:text-foreground mb-9"
      >
        <Icon name="back" className="w-4 h-4" />
        {t.back}
      </Link>
      <p className="eyebrow mb-3">{label}</p>
      <h1 className="text-3xl sm:text-[42px] leading-tight tracking-[-1.5px] font-bold">
        {title}
      </h1>
      <p className="text-muted text-sm sm:text-base mt-3 leading-7">{subtitle}</p>
    </div>
  );
}
