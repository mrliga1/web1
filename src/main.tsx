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
  <div className="skeleton-hero" style={{ position: 'relative', minHeight: '640px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: '#05080f', overflow: 'hidden' }}>
    <div className="skeleton-bg" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, #065f46, transparent 45%)', opacity: 0.35 }}></div>
    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600" className="skeleton-img" alt="Background" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'grayscale(100%) contrast(125%)', mixBlendMode: 'overlay' }} />
    <div className="skeleton-content" style={{ maxWidth: '80rem', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10, paddingTop: '10px' }}>
      <div className="skeleton-title" style={{ fontFamily: 'Georgia, serif', fontSize: '45px', color: '#c5a059', marginBottom: '0.25rem' }}>Greenia Homes</div>
      <div className="skeleton-subtitle" style={{ fontSize: '15px', color: '#34d399', textDecoration: 'underline', textUnderlineOffset: '4px', marginBottom: '1.5rem' }}>Đồng hành - Tận Tâm - Vững Bước Tương Lai</div>
      <div className="skeleton-text" style={{ color: '#cbd5e1', fontSize: '14px', maxWidth: '36rem', lineHeight: '1.6', marginBottom: '1rem' }}>
        Greenia Homes là điểm tựa, sự đảm bảo và đồng hành xuyên suốt quá trình để sở hữu căn nhà mơ ước của khách hàng mua để ở, đối với quý khách hàng đầu tư Greenia Homes tự tin mang đến khách hàng những sản phẩm đầu tư an toàn, sinh lời ổn định và an tâm về pháp lý BĐS.
      </div>
      <div className="app-loader" style={{ width: '24px', height: '24px', border: '3px solid rgba(245, 158, 11, 0.2)', borderRadius: '50%', borderTopColor: '#f59e0b', animation: 'spin 1s ease-in-out infinite', marginTop: '1rem' }}></div>
    </div>
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
