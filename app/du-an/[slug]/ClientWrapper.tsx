"use client";

import React from 'react';
import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import ProjectDetail from '../../../src/components/ProjectDetail';

export default function ClientWrapper({ slug }: { slug: string }) {
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
    alert(`${type.toUpperCase()}: ${message}`);
  };

  return (
    <ProjectDetail 
      slug={slug}
      projectId=""
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      logoUrl={logoUrl}
    />
  );
}
