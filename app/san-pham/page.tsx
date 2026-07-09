"use client";

import React, { useState } from 'react';
import ProductList from '../../src/components/ProductList';
import { useAppContext } from '../../src/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../src/lib/utils';

export default function SanPhamPage() {
  const { sections, setSections, isEditMode } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    alert(`${type.toUpperCase()}: ${message}`);
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
    />
  );
}
