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
  <div className="relative min-h-[640px] flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-hidden bg-slate-950 rounded-lg" id="app-loader-hero">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#065f46,transparent_45%)] opacity-35"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/90 to-slate-950"></div>
    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover opacity-15 grayscale contrast-125 mix-blend-overlay" alt="Background" />
    
    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 items-center relative z-10 pt-[10px] pb-5">
      <div className="md:col-span-1 lg:col-span-7 space-y-6 text-left w-full sm:w-[332px] md:w-full max-w-full">
        <h1 className="font-display font-medium tracking-tight text-white leading-tight flex flex-col gap-1">
          <span className="text-[45px] lg:text-[60px] block font-[Georgia] text-emerald-500">Greenia Homes</span>
          <span className="text-[15px] font-light text-emerald-400 block underline underline-offset-4">Đồng hành - Tận Tâm - Vững Bước Tương Lai</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-md max-w-xl font-light leading-relaxed">
          Greenia Homes là điểm tựa, sự đảm bảo và đồng hành xuyên suốt quá trình để sở hữu căn nhà mơ ước của khách hàng mua để ở, đối với quý khách hàng đầu tư Greenia Homes tự tin mang đến khách hàng những sản phẩm đầu tư an toàn, sinh lời ổn định và an tâm về pháp lý BĐS.
        </p>
        <div className="flex flex-row items-center gap-2 sm:gap-4 pt-[10px] -mb-[20px] w-full">
          <button className="flex items-center justify-center gap-1 sm:gap-2 bg-amber-500 text-slate-950 font-semibold px-3 sm:px-[15px] py-2 sm:py-[5px] rounded-full text-[11px] sm:text-[12px] shadow-xl shadow-amber-500/10 cursor-wait opacity-80 border-none whitespace-nowrap">
            <span>Xem Ngay Sản Phẩm</span>
          </button>
          <div className="group flex items-center justify-center gap-1 sm:gap-2 font-mono text-[11px] sm:text-xs text-slate-400 bg-slate-900/60 backdrop-blur border border-slate-800 rounded-full px-3 sm:px-5 py-2 sm:py-3 cursor-wait whitespace-nowrap">
            <span className="text-xs text-slate-300">0932 966 700</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-1 lg:col-span-5 flex justify-end">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl relative text-left pt-[20px]" style={{ width: '440px', maxWidth: '100%', paddingLeft: '15px', paddingRight: '15px', paddingBottom: '20px', marginLeft: 'auto' }}>
          <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] px-3.5 py-1 rounded-full font-bold shadow-md uppercase tracking-wide">
            Tư vấn nhanh
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-1">Yêu Cầu Tư Vấn Chuyên Sâu</h3>
          <p className="text-slate-400 text-xs mb-[15px] font-light">Chủ đầu tư sẽ trực tiếp liên hệ và gửi trọn bộ thông tin pháp lý của các biệt thự cao cấp trong vòng 5 phút.</p>
          <div className="space-y-4 opacity-50">
            <div className="h-10 bg-slate-800/50 rounded border border-slate-700/50"></div>
            <div className="h-10 bg-slate-800/50 rounded border border-slate-700/50"></div>
            <div className="h-10 bg-slate-800/50 rounded border border-slate-700/50"></div>
            <div className="h-10 bg-slate-800/50 rounded border border-slate-700/50"></div>
            <div className="h-10 bg-amber-500/50 rounded"></div>
          </div>
        </div>
      </div>
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
