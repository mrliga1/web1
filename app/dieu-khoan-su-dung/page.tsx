"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';
import type { RouteState } from '../../src/types';

import { useRouter } from 'next/navigation';
import TermsOfUse from '../../src/components/TermsOfUse';

export default function TermsOfUsePage() {
  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  return (
    <TermsOfUse onNavigate={handleNavigate} />
  );
}
