"use client";

import React, { useState } from 'react';
import { getRouteUrl } from '../../src/lib/utils';
import type { RouteState } from '../../src/types';

import { useRouter } from 'next/navigation';
import ProductList from '../../src/components/ProductList';
import { useAppContext } from '../../src/contexts/AppContext';

export default function LatestRentsPage() {
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
      initialType="rent"
    />
  );
}
