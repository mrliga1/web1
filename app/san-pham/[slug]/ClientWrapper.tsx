"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../../src/lib/utils';
import ProductDetail from '../../../src/components/ProductDetail';

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
    // alert removed;
  };

  return (
    <ProductDetail 
      slug={slug}
      productId=""
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      logoUrl={logoUrl}
    />
  );
}
