'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname, useRouter } from 'next/navigation';

import FloatingActionButtons from './FloatingActionButtons';
import ContentRealtimeRefresh from './ContentRealtimeRefresh';

interface ClientLayoutProps {
  children: React.ReactNode;
  initialLogoUrl?: string;
  initialSettingsLoaded?: boolean;
}

export default function ClientLayout({
  children,
  initialLogoUrl = '',
  initialSettingsLoaded = false,
}: ClientLayoutProps) {
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>(initialLogoUrl);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(
    initialSettingsLoaded || Boolean(initialLogoUrl),
  );
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [routeTransitionActive, setRouteTransitionActive] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    if (initialLogoUrl) {
      setIsSettingsLoaded(true);
      return;
    }

    const savedLogo = localStorage.getItem('greenia_logoUrl');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    setIsSettingsLoaded(true);
  }, [initialLogoUrl]);

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
  }, []);

  useEffect(() => {
    setRouteTransitionActive(false);
    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
      routeTimerRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const getInternalUrl = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const navigationElement = target.closest<HTMLElement>('a[href], [data-content-href]');
      if (!navigationElement) return null;

      const nestedControl = target.closest('button, input, select, textarea');
      if (nestedControl && nestedControl !== navigationElement) return null;

      const href = navigationElement.getAttribute('href') || navigationElement.dataset.contentHref;
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        return `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return null;
      }
    };

    const prefetchRoute = (event: Event) => {
      const href = getInternalUrl(event.target);
      if (href && href !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        router.prefetch(href);
      }
    };

    const showRouteTransition = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = getInternalUrl(event.target);
      if (!href || href === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;

      setRouteTransitionActive(true);
      if (routeTimerRef.current) clearTimeout(routeTimerRef.current);
      routeTimerRef.current = setTimeout(() => {
        setRouteTransitionActive(false);
        routeTimerRef.current = null;
      }, 12000);
    };

    document.addEventListener('pointerover', prefetchRoute, true);
    document.addEventListener('focusin', prefetchRoute, true);
    document.addEventListener('touchstart', prefetchRoute, { capture: true, passive: true });
    document.addEventListener('click', showRouteTransition, true);

    return () => {
      document.removeEventListener('pointerover', prefetchRoute, true);
      document.removeEventListener('focusin', prefetchRoute, true);
      document.removeEventListener('touchstart', prefetchRoute, true);
      document.removeEventListener('click', showRouteTransition, true);
      if (routeTimerRef.current) clearTimeout(routeTimerRef.current);
    };
  }, [router]);

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setNotification({ message, type });
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimerRef.current = null;
    }, 5000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Liên kết bỏ qua đến nội dung chính cho accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold">Bỏ qua đến nội dung chính</a>
      <Navbar 
        currentRoute={{ screen: 'home' }} // Dummy route, replaced by pathname in Navbar itself
        onNavigate={() => {}} // Dummy, replaced by router in Navbar itself
        onShowNotification={triggerNotification}
        logoUrl={logoUrl}
        isSettingsLoaded={isSettingsLoaded}
      />
      <ContentRealtimeRefresh />

      {routeTransitionActive && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[12000]" role="status" aria-live="polite">
          <div className="h-1 w-full overflow-hidden bg-primary/15">
            <div className="h-full w-2/3 animate-pulse bg-primary shadow-[0_0_12px_rgba(6,78,59,0.45)]" />
          </div>
          <span className="absolute right-3 top-2 rounded-full border border-primary/15 bg-white/95 px-3 py-1 text-[11px] font-semibold text-primary shadow-lg backdrop-blur-sm">
            Đang mở nội dung…
          </span>
        </div>
      )}
      
      <main id="main-content" className="site-decorative-background flex-1 w-full bg-bg-surface">
        {children}
      </main>
      
      <Footer />
      
      {!pathname?.startsWith('/admin') && <FloatingActionButtons />}

      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          className={`fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[11000] rounded-xl border px-4 py-3 text-sm font-semibold text-white shadow-2xl sm:left-auto sm:max-w-md animate-slide-up ${
            notification.type === 'success'
              ? 'border-emerald-300/40 bg-[#075c47]'
              : 'border-red-200/50 bg-[#b42318]'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}
