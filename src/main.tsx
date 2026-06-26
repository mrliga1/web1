import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';

const App = lazy(() => import('./App.tsx'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

export function reportWebVitals(onPerfEntry?: any) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onFCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Bật tracking Web Vitals trong console để đo lường hiệu suất
reportWebVitals(console.log);
