import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ToastProvider } from "./components/ui/toast/ToastProvider";
import { queryClient } from "./lib/queryClient";
// Self-hosted Inter (audit P7): the font files ship with our build, so there is no request to
// Google (faster first text, no third party seeing every visitor, simpler CSP in Stage 13).
// The CSS lists one file per alphabet with a unicode-range; browsers fetch only what a page uses.
import "@fontsource-variable/inter";
import "./index.css";

// index.html always has <div id="root">; the `!` tells TypeScript we know it's there.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
