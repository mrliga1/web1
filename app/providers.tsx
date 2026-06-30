"use client";

import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "../src/ErrorBoundary";

/* Tạo QueryClient 1 lần duy nhất */
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
 * Providers bọc toàn bộ app ở phía client.
 * Tách riêng "use client" để layout.tsx có thể là Server Component.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
