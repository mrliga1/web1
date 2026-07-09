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
      <Navbar 
        currentRoute={{ screen: 'home' }} // Dummy route, replaced by pathname in Navbar itself
        onNavigate={() => {}} // Dummy, replaced by router in Navbar itself
        onShowNotification={triggerNotification}
        logoUrl={logoUrl}
      />
      
      <main className="flex-1 w-full bg-bg-surface">
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
