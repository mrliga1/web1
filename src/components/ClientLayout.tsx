'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';

import FloatingActionButtons from './FloatingActionButtons';

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
  const pathname = usePathname();
  
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
