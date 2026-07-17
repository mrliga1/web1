"use client";

import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import ProjectDetail from '../../../src/components/ProjectDetail';
import type { Project, RouteState } from '../../../src/types';

interface ClientWrapperProps {
  slug: string;
  initialProject: Project;
}

export default function ClientWrapper({ slug, initialProject }: ClientWrapperProps) {
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
    />
  );
}
