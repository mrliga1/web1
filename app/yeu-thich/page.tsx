"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';
import type { RouteState } from '../../src/types';

import { useRouter } from 'next/navigation';
import FavoritesPage from '../../src/components/FavoritesPage';

export default function YeuThichPage() {
  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  return (
    <FavoritesPage onNavigate={handleNavigate} />
  );
}
