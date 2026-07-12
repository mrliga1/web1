"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';

import { useRouter } from 'next/navigation';
import FavoritesPage from '../../src/components/FavoritesPage';

export default function YeuThichPage() {
  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  return (
    <FavoritesPage onNavigate={handleNavigate} />
  );
}
