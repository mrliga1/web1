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
  <div className="app-loader-wrapper" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#05080f', zIndex: 99999 }}>
    <svg className="app-loader-logo" style={{ width: '120px', height: 'auto', marginBottom: '2rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', filter: 'drop-shadow(0 0 15px rgba(197, 160, 89, 0.4))' }} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="96" stroke="#c5a059" strokeWidth="4" strokeDasharray="10 10"/>
      <path d="M100 20 L150 70 L130 70 L130 150 L70 150 L70 70 L50 70 Z" fill="#c5a059"/>
      <path d="M90 150 L90 100 L110 100 L110 150 Z" fill="#05080f"/>
    </svg>
    <div className="app-loader-spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(197, 160, 89, 0.2)', borderRadius: '50%', borderTopColor: '#c5a059', animation: 'spin 1s ease-in-out infinite' }}></div>
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
