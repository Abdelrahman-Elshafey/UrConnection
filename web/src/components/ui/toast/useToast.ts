import { use } from "react";
import { ToastContext, type ShowToast } from "./toastContext";

/**
 * const toast = useToast(); toast("Profile updated."); toast("Couldn't delete", "error");
 *
 * React 19's use() reads a context like useContext() does (and, unlike hooks, may even be
 * called inside an if). Throwing here turns a forgotten provider into a clear message.
 */
export function useToast(): ShowToast {
  const show = use(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
