"use client";

import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../../src/lib/utils';
import NewsDetail from '../../../src/components/NewsDetail';
import type { News, Product, Project, RouteState } from '../../../src/types';

interface ClientWrapperProps {
  slug: string;
  initialArticle: News;
  initialNews: News[];
  initialProducts: Product[];
  initialProjects: Project[];
  initialGeneralSettings: Record<string, unknown>;
}

export default function ClientWrapper({ slug, initialArticle, initialNews, initialProducts, initialProjects, initialGeneralSettings }: ClientWrapperProps) {
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
      initialNews={initialNews}
      initialProducts={initialProducts}
      initialProjects={initialProjects}
      initialGeneralSettings={initialGeneralSettings}
    />
  );
}
