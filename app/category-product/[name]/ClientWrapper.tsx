"use client";

import React, { useState } from 'react';
import { getRouteUrl } from '../../../src/lib/utils';

import { useRouter } from 'next/navigation';
import ProductList from '../../../src/components/ProductList';
import { useAppContext } from '../../../src/contexts/AppContext';

export default function ClientWrapper({ categoryName }: { categoryName: string }) {
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
    />
  );
}
