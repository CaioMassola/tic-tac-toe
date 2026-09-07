import type { RefObject } from "react";
import { Icon } from "@/components/icons";
import type { TranslationProps } from "@/lib/translations";

type ResetSessionDialogProps = TranslationProps & {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onConfirm: () => void;
};

export function ResetSessionDialog({ t, dialogRef, onConfirm }: ResetSessionDialogProps) {
  function handleCancel() {
    dialogRef.current?.close();
  }

  function handleConfirm() {
    onConfirm();
    dialogRef.current?.close();
  }

  return (
    <dialog ref={dialogRef} className="reset-dialog" aria-labelledby="reset-title">
      <div className="p-7">
        <span className="mode-icon mb-5">
          <Icon name="refresh" />
        </span>
        <h2 id="reset-title" className="text-xl font-semibold leading-7">
          {t.resetQuestion}
        </h2>
        <div className="flex flex-wrap gap-3 mt-7">
          <button className="button-secondary" autoFocus onClick={handleCancel}>
            {t.cancel}
          </button>
          <button className="button-primary" onClick={handleConfirm}>
            {t.confirm}
          </button>
        </div>
      </div>
    </dialog>
  );
}
