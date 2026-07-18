"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Home from "../src/components/Home";
import { useAppContext } from "../src/contexts/AppContext";
import { getRouteUrl } from "../src/lib/utils";
import type { News, Product, Project, RouteState, VisualSection } from "../src/types";

interface HomePageClientProps {
  initialSections: VisualSection[];
  initialProducts: Product[];
  initialProjects: Project[];
  initialNews: News[];
  needsClientRefresh: boolean;
}

export default function HomePageClient({
  initialSections,
  initialProducts,
  initialProjects,
  initialNews,
  needsClientRefresh,
}: HomePageClientProps) {
  const { sections, setSections, isEditMode } = useAppContext();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [hasSyncedInitialSections, setHasSyncedInitialSections] = useState(false);
  const appliedSectionsSignature = useRef<string | null>(null);
  const router = useRouter();

  const initialSectionsSignature = useMemo(
    () => JSON.stringify(initialSections),
    [initialSections],
  );

  useEffect(() => {
    if (
      !isEditMode ||
      appliedSectionsSignature.current === initialSectionsSignature
    ) {
      return;
    }

    appliedSectionsSignature.current = initialSectionsSignature;
    setSections(initialSections);
    setHasSyncedInitialSections(true);
  }, [initialSections, initialSectionsSignature, isEditMode, setSections]);

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification: (
    message: string,
    type: "success" | "error",
  ) => void = () => {
    // Thông báo của trang chủ hiện được xử lý ở lớp giao diện dùng chung.
  };

  return (
    <Home
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      isEditMode={isEditMode}
      sections={hasSyncedInitialSections ? sections : initialSections}
      onUpdateSections={setSections}
      selectedSectionId={selectedSectionId}
      setSelectedSectionId={setSelectedSectionId}
      initialProducts={initialProducts}
      initialProjects={initialProjects}
      initialNews={initialNews}
      refreshOnMount={needsClientRefresh}
    />
  );
}
