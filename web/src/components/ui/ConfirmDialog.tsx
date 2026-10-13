import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  /** Shows a spinner on the confirm button while the action runs. */
  busy?: boolean;
  onConfirm: () => void;
  /** Cancel button, Escape key, or a click on the backdrop. */
  onCancel: () => void;
}

/**
 * "Are you sure?" dialog, replacing window.confirm (audit B4).
 *
 * Built on the browser's own <dialog> element: showModal() gives, for free, what used to
 * take a library: focus moves into the dialog and stays there, Escape closes it, the page
 * behind can't be clicked, and screen readers announce it as a dialog.
 * React only says *whether* it's open; the effect turns that into showModal()/close().
 */
export function ConfirmDialog({ open, title, children, confirmLabel, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape fires "cancel"; tell React's state instead of letting the dialog close itself.
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      // A click on the backdrop lands on the <dialog> element itself, not on its content.
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[32px] bg-white p-8 text-black shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm dark:bg-raised-dark dark:text-white"
    >
      <h2 id={titleId} className="mb-3 text-2xl font-black tracking-tight">
        {title}
      </h2>
      {children && <div className="mb-8 text-gray-500 dark:text-gray-400">{children}</div>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
