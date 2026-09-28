"use client";

import { useNotification } from "../../src/contexts/NotificationContext";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProjectList from "../../src/components/ProjectList";
import { useAppContext } from "../../src/contexts/AppContext";
import { getRouteUrl } from "../../src/lib/utils";
import type { Product, Project, VisualSection } from "../../src/types";

export default function ClientWrapper({
  initialProjects,
  initialProducts,
  initialSections,
}: {
  initialProjects: Project[];
  initialProducts: Product[];
  initialSections: VisualSection[];
}) {
  const { sections: contextSections, setSections, isEditMode } = useAppContext();
  const sections = !isEditMode && initialSections.length > 0 ? initialSections : contextSections;
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const router = useRouter();
  const showNotification = useNotification();

  return (
    <ProjectList
      onNavigate={(route) => router.push(getRouteUrl(route))}
      onShowNotification={showNotification}
      isEditMode={isEditMode}
      sections={sections}
      onUpdateSections={setSections}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
      initialProjects={initialProjects}
      initialProducts={initialProducts}
    />
  );
}
