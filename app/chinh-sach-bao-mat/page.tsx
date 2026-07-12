"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';

import { useRouter } from 'next/navigation';
import PrivacyPolicy from '../../src/components/PrivacyPolicy';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const handleNavigate = (route: any) => {
    router.push(getRouteUrl(route));
  };

  return (
    <PrivacyPolicy onNavigate={handleNavigate} />
  );
}
