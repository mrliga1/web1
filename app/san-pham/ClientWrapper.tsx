"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProductList from "../../src/components/ProductList";
import { useAppContext } from "../../src/contexts/AppContext";
import { getRouteUrl } from "../../src/lib/utils";
import type { Product, Project, VisualSection } from "../../src/types";

interface ClientWrapperProps {
  initialProducts: Product[];
  initialProjects: Project[];
  initialGeneralSettings: Record<string, unknown>;
  initialFilterSettings: Record<string, unknown>;
  initialSections: VisualSection[];
  initialType?: "all" | "sale" | "rent";
  initialPriceRange?: string;
  initialAreaRange?: string;
  initialLocation?: string;
}

export default function ClientWrapper(props: ClientWrapperProps) {
  const { sections: contextSections, setSections, isEditMode } = useAppContext();
  const sections = !isEditMode && props.initialSections.length > 0
    ? props.initialSections
    : contextSections;
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <ProductList
      onNavigate={(route) => router.push(getRouteUrl(route))}
      onShowNotification={() => undefined}
      isEditMode={isEditMode}
      sections={sections}
      onUpdateSections={setSections}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
      initialProducts={props.initialProducts}
      initialProjects={props.initialProjects}
      initialGeneralSettings={props.initialGeneralSettings}
      initialFilterSettings={props.initialFilterSettings}
      initialType={props.initialType}
      initialPriceRange={props.initialPriceRange}
      initialAreaRange={props.initialAreaRange}
      initialLocation={props.initialLocation}
    />
  );
}
