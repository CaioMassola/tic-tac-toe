import { Icon, Symbol } from "@/components/icons";
import { PreviewBoard } from "@/components/shared/preview-board";
import type { TranslationProps } from "@/lib/translations";

export function HeroArtwork({ t }: TranslationProps) {
  return (
    <div className="hero-art">
      <span className="art-orbit orbit-one" />
      <span className="art-orbit orbit-two" />
      <Symbol mark="O" className="floating-o" />
      <Symbol mark="X" className="floating-x" />
      <div className="preview-card">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[9px] sm:text-[10px] tracking-[2px] text-muted font-semibold">
            {t.preview}
          </span>
          <span className="flex gap-1">
            <i className="tiny-dot" />
            <i className="tiny-dot" />
            <i className="tiny-dot" />
          </span>
        </div>
        <PreviewBoard />
        <div className="flex items-center justify-center gap-2.5 mt-6">
          <span className="mini-marks">
            <Symbol mark="X" />
            <Symbol mark="O" />
          </span>
          <span className="text-xs text-muted">{t.previewCaption}</span>
        </div>
      </div>
      <div className="floating-note">
        <span className="note-icon">
          <Icon name="spark" />
        </span>
        {t.yourMove}
      </div>
    </div>
  );
}
