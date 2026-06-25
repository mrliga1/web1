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

const AppLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#020617' }}>
    <div style={{ width: 48, height: 48, border: '4px solid rgba(245, 158, 11, 0.2)', borderRadius: '50%', borderTopColor: '#f59e0b', animation: 'spin 1s ease-in-out infinite' }}></div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Suspense fallback={<AppLoader />}>
            <App />
          </Suspense>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Bật tracking Web Vitals trong console để đo lường hiệu suất
reportWebVitals(console.log);
