import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { App } from "./App.js";
import { Toaster } from "./components/Toaster.js";
import { ApiError, redirectToLoginOnUnauthorized } from "./api/client.js";
import "./styles.css";

const savedTheme = window.localStorage.getItem("sentinel-theme");
document.documentElement.dataset.theme =
  savedTheme === "light" ? "light" : "dark";

const mutationCache = new MutationCache({
  onSuccess: (_data, _variables, _context, mutation) => {
    const meta = mutation.meta as
      { successMessage?: unknown; suppressToast?: unknown } | undefined;
    if (meta?.suppressToast === true) return;
    const message =
      typeof meta?.successMessage === "string"
        ? meta.successMessage
        : "Ação concluída com sucesso.";
    window.dispatchEvent(
      new CustomEvent("sentinel:toast", { detail: { message } }),
    );
  },
});

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const isGuildListQuery = query.queryKey[0] === "guilds";
      if (!isGuildListQuery) redirectToLoginOnUnauthorized(error);
    },
  }),
  mutationCache,
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
