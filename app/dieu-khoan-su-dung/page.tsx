"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';

import { useRouter } from 'next/navigation';
import TermsOfUse from '../../src/components/TermsOfUse';

export default function TermsOfUsePage() {
  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  return (
    <TermsOfUse onNavigate={handleNavigate} />
  );
}
