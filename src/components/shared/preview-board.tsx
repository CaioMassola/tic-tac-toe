import type { Mark } from "@/lib/game";
import { Symbol } from "@/components/icons";

export function PreviewBoard({
  line = [0, 4, 8],
  small = false,
}: {
  line?: number[];
  small?: boolean;
}) {
  const marks: (Mark | null)[] = small
    ? Array.from({ length: 9 }, (_, i) => (line.includes(i) ? "X" : null))
    : ["X", "O", null, "O", "X", null, null, "O", "X"];

  return (
    <div aria-hidden="true" className={`preview-board ${small ? "small" : ""}`}>
      {marks.map((mark, i) => (
        <div key={i} className={`preview-cell ${line.includes(i) ? "highlight" : ""}`}>
          {mark && <Symbol mark={mark} />}
        </div>
      ))}
      {!small && <span className="winning-strike" />}
    </div>
  );
}
