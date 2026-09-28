"use client";

import React from "react";
import { ErrorBoundary } from "../src/ErrorBoundary";
import { AppProvider } from "../src/contexts/AppContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import CookieConsent from "../src/components/CookieConsent";
import { AdSenseProvider } from '../src/contexts/AdSenseContext';
import type { PublicClientSettings } from '../src/lib/publicSettings';

/**
 * Providers bọc toàn bộ app ở phía client.
 * Tách riêng "use client" để layout.tsx có thể là Server Component.
 */
export default function Providers({ children, initialSettings }: { children: React.ReactNode; initialSettings: PublicClientSettings }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider initialSettings={initialSettings}>
          <AdSenseProvider>
          {children}
          <CookieConsent />
          </AdSenseProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
