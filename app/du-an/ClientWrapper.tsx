"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProjectList from "../../src/components/ProjectList";
import { useAppContext } from "../../src/contexts/AppContext";
import { getRouteUrl } from "../../src/lib/utils";
import type { Product, Project } from "../../src/types";

export default function ClientWrapper({
  initialProjects,
  initialProducts,
}: {
  initialProjects: Project[];
  initialProducts: Product[];
}) {
  const { sections, setSections, isEditMode } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <ProjectList
      onNavigate={(route) => router.push(getRouteUrl(route))}
      onShowNotification={() => undefined}
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
