"use client";

import React from "react";
import { ErrorBoundary } from "../src/ErrorBoundary";
import { AppProvider } from "../src/contexts/AppContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import CookieConsent from "../src/components/CookieConsent";

/**
 * Providers bọc toàn bộ app ở phía client.
 * Tách riêng "use client" để layout.tsx có thể là Server Component.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          {children}
          <CookieConsent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
