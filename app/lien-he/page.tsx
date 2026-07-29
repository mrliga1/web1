"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ContactPage from '../../src/components/ContactPage';
import { useAppContext } from '../../src/contexts/AppContext';
import { getRouteUrl } from '../../src/lib/utils';
import type { RouteState } from '../../src/types';

export default function LienHePage() {
  const router = useRouter();
  const { isEditMode, sections, setSections } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = (message: string, type: 'success' | 'error') => {
    void message;
    void type;
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
