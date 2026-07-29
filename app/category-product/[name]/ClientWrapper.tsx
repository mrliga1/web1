"use client";

import React, { useState } from 'react';
import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import ProductList from '../../../src/components/ProductList';
import { useAppContext } from '../../../src/contexts/AppContext';
import type { FilterSettingsData, GeneralSettingsData, Product, Project, RouteState } from '../../../src/types';

export default function ClientWrapper({ 
  categoryName,
  initialCategoryTitle,
  initialCategoryDesc,
  initialCategoryName,
  initialProducts,
  initialProjects,
  initialGeneralSettings,
  initialFilterSettings
}: { 
  categoryName: string,
  initialCategoryTitle?: string,
  initialCategoryDesc?: string,
  initialCategoryName?: string,
  initialProducts: Product[],
  initialProjects: Project[],
  initialGeneralSettings: GeneralSettingsData,
  initialFilterSettings: FilterSettingsData
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
    <ProductList 
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      isEditMode={isEditMode}
      sections={sections}
      onUpdateSections={setSections}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
      initialCategory={categoryName}
      initialCategoryTitle={initialCategoryTitle}
      initialCategoryDesc={initialCategoryDesc}
      initialCategoryName={initialCategoryName}
      initialProducts={initialProducts}
      initialProjects={initialProjects}
      initialGeneralSettings={initialGeneralSettings}
      initialFilterSettings={initialFilterSettings}
    />
  );
}
