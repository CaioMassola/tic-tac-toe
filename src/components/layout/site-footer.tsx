import { Icon } from "@/components/icons";
import { Logo } from "./logo";
import type { TranslationProps } from "@/lib/translations";

export function SiteFooter({ t }: TranslationProps) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Logo />
          <span className="text-xs text-muted max-w-48 sm:max-w-none">{t.footer}</span>
        </div>
        <span className="text-xs text-muted flex items-center gap-2">
          <Icon name="spark" className="w-3.5 h-3.5" />
          {t.footerRight}
        </span>
      </div>
    </footer>
  );
}
