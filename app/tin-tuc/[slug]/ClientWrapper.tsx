"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../../src/lib/utils';
import NewsDetail from '../../../src/components/NewsDetail';
import type { News } from '../../../src/types';

interface ClientWrapperProps {
  slug: string;
  initialArticle: News;
}

export default function ClientWrapper({ slug, initialArticle }: ClientWrapperProps) {
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
    <NewsDetail 
      slug={slug}
      newsId=""
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      initialArticle={initialArticle}
    />
  );
}
