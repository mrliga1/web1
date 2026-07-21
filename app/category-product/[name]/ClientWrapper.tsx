"use client";

import React, { useState } from 'react';
import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import ProductList from '../../../src/components/ProductList';
import { useAppContext } from '../../../src/contexts/AppContext';
import type { Product, Project } from '../../../src/types';

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
  initialGeneralSettings: Record<string, unknown>,
  initialFilterSettings: Record<string, unknown>
}) {
  const { sections, setSections, isEditMode } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    // alert removed;
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
