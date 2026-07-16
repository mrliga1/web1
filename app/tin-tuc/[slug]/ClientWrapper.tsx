"use client";

import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../../src/lib/utils';
import NewsDetail from '../../../src/components/NewsDetail';
import type { News, RouteState } from '../../../src/types';

interface ClientWrapperProps {
  slug: string;
  initialArticle: News;
}

export default function ClientWrapper({ slug, initialArticle }: ClientWrapperProps) {
  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = () => {};

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
