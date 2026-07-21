"use client";

import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import ProjectDetail from '../../../src/components/ProjectDetail';
import type { News, Product, Project, RouteState } from '../../../src/types';

interface ClientWrapperProps {
  slug: string;
  initialProject: Project;
  initialNews: News[];
  initialProducts: Product[];
  initialProjects: Project[];
}

export default function ClientWrapper({ slug, initialProject, initialNews, initialProducts, initialProjects }: ClientWrapperProps) {
  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = () => {};

  return (
    <ProjectDetail 
      slug={slug}
      projectId=""
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      initialProject={initialProject}
      initialNews={initialNews}
      initialProducts={initialProducts}
      initialProjects={initialProjects}
    />
  );
}
