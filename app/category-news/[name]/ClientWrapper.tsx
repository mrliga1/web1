"use client";

import { useNotification } from "../../../src/contexts/NotificationContext";

import React, { useState } from 'react';
import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import NewsList from '../../../src/components/NewsList';
import { useAppContext } from '../../../src/contexts/AppContext';
import type { GeneralSettingsData, News, Product, Project, RouteState, VisualSection } from '../../../src/types';

export default function ClientWrapper({
  categoryName,
  initialNews,
  initialProducts,
  initialProjects,
  initialGeneralSettings,
  initialSections,
}: {
  categoryName: string;
  initialNews: News[];
  initialProducts: Product[];
  initialProjects: Project[];
  initialGeneralSettings: GeneralSettingsData;
  initialSections: VisualSection[];
}) {
  const { sections: contextSections, setSections, isEditMode } = useAppContext();
  const sections = !isEditMode && initialSections.length > 0 ? initialSections : contextSections;
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = useNotification();

  return (
    <NewsList 
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      isEditMode={isEditMode}
      sections={sections}
      onUpdateSections={setSections}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
      categoryName={categoryName}
      initialNews={initialNews}
      initialProducts={initialProducts}
      initialProjects={initialProjects}
      initialGeneralSettings={initialGeneralSettings}
    />
  );
}
