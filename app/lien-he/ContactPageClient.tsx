'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContactPage from '../../src/components/ContactPage';
import { useAppContext } from '../../src/contexts/AppContext';
import { useNotification } from '../../src/contexts/NotificationContext';
import { getRouteUrl } from '../../src/lib/utils';
import type { VisualSection } from '../../src/types';

export default function ContactPageClient({ initialSections }: { initialSections: VisualSection[] }) {
  const router = useRouter();
  const { isEditMode, setSections } = useAppContext();
  const [editedSections, setEditedSections] = useState(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const showNotification = useNotification();

  useEffect(() => {
    // Đồng bộ bản công khai mà không ghi dữ liệu khi khách mở trang.
    if (!isEditMode) setEditedSections(initialSections);
  }, [initialSections, isEditMode]);

  return (
    <ContactPage
      onNavigate={(route) => router.push(getRouteUrl(route))}
      isEditMode={isEditMode}
      sections={isEditMode ? editedSections : initialSections}
      onUpdateSections={(next) => {
        setEditedSections(next);
        setSections(next);
      }}
      onShowNotification={showNotification}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
    />
  );
}
