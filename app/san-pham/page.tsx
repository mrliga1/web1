"use client";

import React, { useState } from 'react';
import ProductList from '../../src/components/ProductList';
import { useAppContext } from '../../src/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../src/lib/utils';

export default function SanPhamPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const { sections, setSections, isEditMode } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    alert(`${type.toUpperCase()}: ${message}`);
  };
  
  const priceRange = typeof searchParams.priceRange === 'string' ? searchParams.priceRange : undefined;
  const areaRange = typeof searchParams.areaRange === 'string' ? searchParams.areaRange : undefined;
  const location = typeof searchParams.location === 'string' ? searchParams.location : undefined;

  return (
    <ProductList 
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      isEditMode={isEditMode}
      sections={sections}
      onUpdateSections={setSections}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
      initialPriceRange={priceRange}
      initialAreaRange={areaRange}
      initialLocation={location}
    />
  );
}
