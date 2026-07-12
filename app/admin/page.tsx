"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('../../src/components/AdminPanel'), { ssr: false });

export default function AdminPage() {
  const [logoUrl, setLogoUrl] = React.useState<string>('');

  React.useEffect(() => {
    const savedLogo = localStorage.getItem('greenia_logoUrl');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    // alert removed;
  };

  return (
    <div className="min-h-screen w-full bg-bg-surface text-slate-900 font-sans" id="app-root">
      <AdminPanel 
        onNavigate={handleNavigate}
        onShowNotification={handleShowNotification}
        logoUrl={logoUrl}
      />
    </div>
  );
}
