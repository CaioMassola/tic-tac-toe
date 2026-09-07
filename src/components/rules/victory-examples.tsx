import { PreviewBoard } from "@/components/shared/preview-board";
import type { TranslationProps } from "@/lib/translations";

export function VictoryExamples({ t }: TranslationProps) {
  const examples = [
    { label: t.horizontal, line: [3, 4, 5] },
    { label: t.vertical, line: [1, 4, 7] },
    { label: t.diagonal, line: [0, 4, 8] },
  ];

  return (
    <section className="panel mt-6 p-7 sm:p-9">
      <h2 className="text-xl font-semibold mb-8">{t.ways}</h2>
      <div className="grid sm:grid-cols-3 gap-8">
        {examples.map(({ label, line }) => (
          <div key={label} className="text-center">
            <PreviewBoard small line={line} />
            <h3 className="mt-4 text-sm text-muted">{label}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
