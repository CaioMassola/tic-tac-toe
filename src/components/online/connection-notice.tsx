import { Icon } from "@/components/icons";
import type { TranslationProps } from "@/lib/translations";

export function ConnectionNotice({ t }: TranslationProps) {
  return (
    <div className="connection-notice flex gap-3 mb-7">
      <Icon name="info" className="mt-0.5" />
      <div>
        <h2 className="font-semibold text-sm">{t.connectionTitle}</h2>
        <p className="text-sm text-muted leading-6 mt-1 max-w-3xl">{t.connectionDesc}</p>
      </div>
    </div>
  );
}
