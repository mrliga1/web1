'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { usePathname } from 'next/navigation';

import FloatingActionButtons from './FloatingActionButtons';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const pathname = usePathname();
  
  useEffect(() => {
    const savedLogo = localStorage.getItem('greenia_logoUrl');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
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
      />
      
      <main id="main-content" className="flex-1 w-full bg-bg-surface">
        {children}
      </main>
      
      <Footer />
      
      {!pathname?.startsWith('/admin') && <FloatingActionButtons />}

      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-[120] animate-slide-up text-white font-medium ${
          notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
