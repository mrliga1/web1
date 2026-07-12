"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ContactPage from '../../src/components/ContactPage';
import { useAppContext } from '../../src/contexts/AppContext';
import { getRouteUrl } from '../../src/lib/utils';

export default function LienHePage() {
  const router = useRouter();
  const { isEditMode, sections, setSections } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    // alert removed;
  };

  return (
    <ContactPage 
      onNavigate={handleNavigate}
      isEditMode={isEditMode}
      sections={sections}
      onUpdateSections={setSections}
      onShowNotification={handleShowNotification}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
    />
  );
}
