"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';
import type { RouteState } from '../../src/types';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useNotification } from '../../src/contexts/NotificationContext';

const AdminPanel = dynamic(() => import('../../src/components/AdminPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm font-semibold text-slate-700">
      Đang mở trang quản trị…
    </div>
  ),
});

export default function AdminPage() {
  const [logoUrl, setLogoUrl] = React.useState<string>('');

  React.useEffect(() => {
    const savedLogo = localStorage.getItem('greenia_logoUrl');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const router = useRouter();
  const showNotification = useNotification();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  return (
    <div className="min-h-screen w-full bg-bg-surface text-slate-900 font-sans" id="app-root">
      <AdminPanel 
        onNavigate={handleNavigate}
        onShowNotification={showNotification}
        logoUrl={logoUrl}
      />
    </div>
  );
}
