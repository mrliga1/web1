"use client";

import React, { useState } from 'react';
import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import NewsList from '../../../src/components/NewsList';
import { useAppContext } from '../../../src/contexts/AppContext';
import type { GeneralSettingsData, News, Product, Project, RouteState } from '../../../src/types';

export default function ClientWrapper({
  categoryName,
  initialNews,
  initialProducts,
  initialProjects,
  initialGeneralSettings,
}: {
  categoryName: string;
  initialNews: News[];
  initialProducts: Product[];
  initialProjects: Project[];
  initialGeneralSettings: GeneralSettingsData;
}) {
  const { sections, setSections, isEditMode } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    void message;
    void type;
  };

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
