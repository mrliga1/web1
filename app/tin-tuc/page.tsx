"use client";

import React, { useState } from 'react';
import NewsList from '../../src/components/NewsList';
import { useAppContext } from '../../src/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../src/lib/utils';

export default function TinTucPage() {
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
    <NewsList 
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
