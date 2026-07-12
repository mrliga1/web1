"use client";

import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "../src/ErrorBoundary";
import { AppProvider } from "../src/contexts/AppContext";
import { AuthProvider } from "../src/contexts/AuthContext";

/* Táº¡o QueryClient 1 láº§n duy nháº¥t */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

/**
 * Providers bá»c toÃ n bá»™ app á»Ÿ phÃ­a client.
 * TÃ¡ch riÃªng "use client" Ä‘á»ƒ layout.tsx cÃ³ thá»ƒ lÃ  Server Component.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider context={{}}>
          <Suspense fallback={null}>
            <AuthProvider>
              <AppProvider>
                {children}
              </AppProvider>
            </AuthProvider>
          </Suspense>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
