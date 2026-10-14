import { useCallback, useState, type ReactNode } from "react";
import { FiAlertCircle, FiCheck } from "react-icons/fi";
import { ToastContext, type ShowToast, type ToastTone } from "./toastContext";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const VISIBLE_MS = 3500;
let nextId = 0;

/**
 * Wraps the app once (main.tsx). Any component calls useToast() to show a message.
 * The messages live in an aria-live region, so screen readers read them out too.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // useCallback: the function is the context value, so a stable identity means
  // components using useToast() don't re-render every time a toast appears.
  const show = useCallback<ShowToast>((message, tone = "success") => {
    const id = ++nextId;
    setToasts((all) => [...all, { id, message, tone }]);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), VISIBLE_MS);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-6 top-6 z-[60] flex flex-col items-end gap-3">
        {toasts.map(({ id, message, tone }) => (
          <div
            key={id}
            role={tone === "error" ? "alert" : "status"}
            className="animate-fade-in flex items-center gap-3 rounded-2xl bg-black px-6 py-4 text-white shadow-2xl dark:bg-white dark:text-black"
          >
            {tone === "error" ? (
              <FiAlertCircle aria-hidden className="h-5 w-5 shrink-0 text-red-400 dark:text-red-600" />
            ) : (
              <FiCheck aria-hidden className="h-5 w-5 shrink-0 text-green-400 dark:text-green-600" />
            )}
            <span className="text-sm font-bold">{message}</span>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
