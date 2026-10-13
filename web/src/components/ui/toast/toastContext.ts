import { createContext } from "react";

export type ToastTone = "success" | "error";

/** Shows a short message in the corner for a few seconds. */
export type ShowToast = (message: string, tone?: ToastTone) => void;

/** null outside a <ToastProvider> (useToast turns that into a clear error). */
export const ToastContext = createContext<ShowToast | null>(null);
